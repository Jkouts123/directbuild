"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────
export type ServiceType = "solar" | "hvac" | "landscaping" | "roofing" | "granny-flats";

export interface EstimateRequest {
  serviceType: ServiceType;
  formData: Record<string, unknown>;
  images?: string[]; // base64 data URIs
  contact: {
    firstName: string;
    phone: string;
    email?: string;
  };
}

export interface EstimateLineItem {
  label: string;
  description: string;
  amount: number;
}

export interface EstimateResult {
  centerPrice: number;
  minPrice: number;
  maxPrice: number;
  lineItems: EstimateLineItem[];
  summary: string;
  disclaimer: string;
  // Solar-specific
  stcRebate?: number;
  estimatedSavings?: number;
}

// ── Jason Gap Rules ───────────────────────────────────────────────────
function calculateGap(centerPrice: number): number {
  let gap: number;
  if (centerPrice < 10_000) gap = 2_000;
  else if (centerPrice < 25_000) gap = 4_000;
  else if (centerPrice < 50_000) gap = 6_000;
  else gap = 10_000;

  return Math.min(gap, 20_000);
}

// ── Service-Specific System Prompts ───────────────────────────────────
function buildSystemPrompt(serviceType: ServiceType): string {
  const base = `You are an expert Australian construction estimator for Direct Build, Australia's premier vetted tradie network. You provide realistic 2026 market-rate estimates.

CRITICAL INSTRUCTIONS:
1. Analyze ALL the provided form data carefully.
2. Calculate a realistic CENTER PRICE for the total job (including labour, materials, equipment, and all applicable costs).
3. Break down the estimate into clear line items with individual amounts.
4. Return ONLY valid JSON matching the exact schema below — no markdown, no backticks, no explanation.

JSON SCHEMA:
{
  "centerPrice": <number — your best estimate for total cost>,
  "lineItems": [
    { "label": "<string>", "description": "<string>", "amount": <number> }
  ],
  "summary": "<string — 2-3 sentence plain-text summary of the quote>",
  "disclaimer": "<string — standard disclaimer>"
}`;

  switch (serviceType) {
    case "solar":
      return `${base}

SOLAR-SPECIFIC RULES (Sydney Solar Market 2026):
- Labour rate: midpoint $145/hr
- STC (Small-scale Technology Certificate) rebate calculation: For systems under 100kW, calculate STCs as: system_kW × zone_rating(1.382 for Sydney) × deeming_period(years remaining to 2031). Current STC price: ~$38 each.
- Add a "stcRebate" field (number) to your JSON with the calculated rebate amount.
- Add an "estimatedSavings" field (number) — estimated annual electricity savings.
- Consider panel tier, inverter type, battery inclusion, roof complexity, and electrical requirements.
- DO NOT analyze images for solar — base your estimate purely on the form data.
- Include separate line items for: panels, inverter, battery (if applicable), mounting/racking, electrical, labour.`;

    case "hvac":
      return `${base}

HVAC-SPECIFIC RULES (Australian 2026 Market):
- Focus on room count, system type (split vs ducted vs multi-split), and system capacity.
- Labour rate: $85–$120/hr depending on complexity.
- Include line items for: unit(s), installation labour, pipework, electrical, commissioning.
- Factor in: property type, install complexity, brand choice, extras selected.
- For ducted systems: include ductwork and zoning costs.
- For repairs: estimate diagnostic + parts + labour.`;

    case "landscaping":
      return `${base}

LANDSCAPING-SPECIFIC RULES (Australian 2026 Market):

SIZE PRESETS (use these to estimate area):
- "small": up to 30m²
- "medium": 30–80m² (use 55m² as midpoint)
- "large": 80–150m² (use 115m² as midpoint)
- "estate": 150m²+ (use 200m² as midpoint)

MATERIAL RATES:
- Turf: $18–95/m² depending on variety (Sir Walter ~$30/m², Kikuyu ~$18/m², Synthetic ~$70–95/m²).
- Paving: $120–200/m² (Concrete cheapest, Natural Stone most expensive).
- Retaining walls: $350–450 per linear metre.
- Decking: $220–380/m² (Treated Pine cheapest, Merbau/Composite premium).

LABOUR RATES:
- General landscaping labour: $75/hr base.
- Restricted access (doorway or 1m side path): 15–25% labour uplift due to hand-digging.
- Excavation / demolition labour: $180/hr.

SITE CONDITION COST MODIFIERS — CRITICAL:
- If accessWidth is "doorway": add 25% labour uplift (no machinery possible, all manual).
- If accessWidth is "1m-path": add 15% labour uplift (small machinery only, tight manoeuvring).
- If slope is "steep": you MUST add a "Excavation & Earthworks" line item ($2,000–$5,000 depending on size).
- If siteState is "old-concrete": you MUST add a "Demolition & Waste Removal" line item. Include skip bin hire ($600 per 6m³ bin) + demo labour ($180/hr, estimate 1–3 days depending on area).
- If siteState is "heavy-overgrowth": you MUST add a "Site Clearing" line item ($1,500–$4,000 depending on size and tree removal needs).
- Skip bin / waste disposal: $600 per 6m³ bin. Estimate 1 bin for small, 2 for medium/large, 3+ for estate with demolition.

PHOTO ANALYSIS — IMPORTANT:
- If photos are provided, carefully analyze them for: visible slopes or grade changes, existing concrete/pavers/structures that need removal, tree stumps or heavy vegetation, access width, and overall site condition.
- Cross-reference what you see in the photos with the user's stated slope, siteState, and accessWidth answers. If the photos reveal conditions worse than stated (e.g., user said "flat" but photo shows clear slope), note this discrepancy in your summary and quote based on what the photo shows.

Include line items for each selected service (materials + labour) PLUS any applicable site condition items.
Factor in soil preparation, waste removal, and site cleanup.`;

    case "roofing":
      return `${base}

ROOFING-SPECIFIC RULES (Australian 2026 Market):
- If photos are provided, analyze them to assess: roof condition, material, pitch, access.
- Full replacement: $80–$200/m² depending on material (Colorbond cheapest, slate premium).
- Repairs: $500–$5,000 depending on scope. Asbestos removal adds $50–80/m².
- Include scaffolding costs for steep/multi-storey roofs.
- Factor in: roof size, pitch, shape, access level, material type, extras.
- Include line items for: materials, labour, scaffolding (if needed), waste disposal, safety equipment.`;

    case "granny-flats":
      return `${base}

GRANNY FLAT-SPECIFIC RULES (Australian 2026 Market):
- If photos are provided, analyze them to assess: site suitability, access, terrain.
- Base cost ranges: Studio $80k–$120k, 1-bed $120k–$180k, 2-bed $160k–$250k.
- Construction type significantly affects price: brick veneer most expensive, lightweight cheapest.
- Finish level is the biggest cost driver: basic rental spec vs mid-range vs high-end.
- Include line items for: structure & shell, foundations, electrical, plumbing, bathroom, kitchen, flooring, windows, insulation, approvals, site costs.
- Factor in: block condition, distance from main dwelling, separate metering, hot water system, approval pathway.`;

    default:
      return base;
  }
}

// ── Build User Prompt ─────────────────────────────────────────────────
function buildUserPrompt(
  serviceType: ServiceType,
  formData: Record<string, unknown>
): string {
  // Remove photos/images from text prompt (sent as image parts separately)
  const cleanData = { ...formData };
  delete cleanData.photos;
  delete cleanData.images;

  return `Service: ${serviceType.toUpperCase()}

Form Data:
${JSON.stringify(cleanData, null, 2)}

Calculate a realistic estimate and return ONLY the JSON object.`;
}

// ── Main Server Action ────────────────────────────────────────────────
export async function generateEstimate(
  request: EstimateRequest
): Promise<EstimateResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured in .env.local");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Services that support image analysis
  const supportsImages = ["landscaping", "roofing", "granny-flats"];
  const hasImages =
    supportsImages.includes(request.serviceType) &&
    request.images &&
    request.images.length > 0;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-05-20",
    systemInstruction: buildSystemPrompt(request.serviceType),
  });

  const userPrompt = buildUserPrompt(request.serviceType, request.formData);

  // Build content parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: userPrompt },
  ];

  // Add images for services that support them
  if (hasImages && request.images) {
    for (const dataUri of request.images) {
      // Extract mime type and base64 data from data URI
      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
  }

  const result = await model.generateContent(parts);
  const responseText = result.response.text();

  // Parse JSON from response (strip any markdown fencing)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Gemini response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    centerPrice: number;
    lineItems: EstimateLineItem[];
    summary: string;
    disclaimer: string;
    stcRebate?: number;
    estimatedSavings?: number;
  };

  // Apply Jason Gap Rules
  const gap = calculateGap(parsed.centerPrice);
  const minPrice = Math.round(parsed.centerPrice - gap / 2);
  const maxPrice = Math.round(parsed.centerPrice + gap / 2);

  const estimate: EstimateResult = {
    centerPrice: Math.round(parsed.centerPrice),
    minPrice: Math.max(0, minPrice),
    maxPrice,
    lineItems: parsed.lineItems,
    summary: parsed.summary,
    disclaimer:
      parsed.disclaimer ||
      "This is an AI-generated indicative estimate based on 2026 market rates. Final pricing is confirmed after an on-site assessment by your assigned specialist.",
    stcRebate: parsed.stcRebate ? Math.round(parsed.stcRebate) : undefined,
    estimatedSavings: parsed.estimatedSavings
      ? Math.round(parsed.estimatedSavings)
      : undefined,
  };

  // Save to Supabase
  try {
    await supabase.from("leads").insert({
      name: request.contact.firstName,
      phone: request.contact.phone,
      email: request.contact.email || null,
      suburb: String(request.formData.suburb || request.formData.location_suburb || ""),
      service_type: request.serviceType,
      user_input: request.formData,
      ai_quote: estimate,
      verified_phone: true,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Don't fail the quote if Supabase insert fails
    console.error("Failed to save lead to Supabase:", err);
  }

  return estimate;
}
