"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { generateLeadId } from "@/lib/utils/ids";

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

// ── Response helpers ──────────────────────────────────────────────────

// Manually extract text from Gemini response candidates. The SDK's
// response.text() helper throws when finishReason is SAFETY/RECITATION/etc
// or when parts are empty. We bypass that so we can surface a specific
// error to the caller instead of a generic 500.
interface GeminiPart { text?: string }
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

function extractResponseText(candidate: GeminiCandidate | undefined): string {
  const parts = candidate?.content?.parts ?? [];
  return parts
    .map((p) => (p && typeof p.text === "string" ? p.text : ""))
    .join("");
}

// Walks the string tracking brace depth while respecting JSON string
// escaping, returning the first balanced {...} block. Greedy
// match(/\{[\s\S]*\}/) fails when the model emits a preamble object
// (e.g. thinking traces) before the real JSON.
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === "\"") { inString = false; continue; }
      continue;
    }
    if (ch === "\"") { inString = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// ── Retry + transient-failure handling ───────────────────────────────

const BUSY_ERROR_MESSAGE =
  "Our estimate engine is busy right now. Please try again in a moment.";

function isTransientGeminiError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  if (e?.status === 503 || e?.status === 429) return true;
  const msg = (e?.message ?? "").toLowerCase();
  return /\b503\b|\b429\b|overloaded|unavailable|too many requests|rate limit/.test(msg);
}

async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  serviceType: string,
  maxRetries = 2,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientGeminiError(err) || attempt === maxRetries) throw err;
      const delay = 500 * Math.pow(3, attempt); // 500ms, 1500ms
      const message = (err as Error)?.message ?? String(err);
      console.warn(
        `[generateEstimate] Transient Gemini error for ${serviceType} (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${message}`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
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
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Services that support image analysis
    const supportsImages = ["landscaping", "roofing", "granny-flats"];
    const hasImages =
      supportsImages.includes(request.serviceType) &&
      request.images &&
      request.images.length > 0;

    const model = genAI.getGenerativeModel(
      {
        model: "gemini-2.5-flash",
        systemInstruction: buildSystemPrompt(request.serviceType),
      },
      {
        // Disable thinking mode — prevents thinking tokens from prefixing
        // the JSON output and breaking our parser in SDK v0.24.x
        apiVersion: "v1beta",
      }
    );

    const userPrompt = buildUserPrompt(request.serviceType, request.formData);

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: userPrompt },
    ];

    // Add images for services that support them (strip oversized ones)
    if (hasImages && request.images) {
      for (const dataUri of request.images) {
        // Skip images over ~3MB base64 to stay within Vercel 4.5MB body limit
        if (dataUri.length > 3_000_000) {
          console.warn(`[generateEstimate] Skipping oversized image (${Math.round(dataUri.length / 1024)}KB)`);
          continue;
        }
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

    console.log(`[generateEstimate] Calling Gemini for ${request.serviceType}, parts: ${parts.length}`);

    let result;
    try {
      result = await callGeminiWithRetry(
        () =>
          model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig: {
              // @ts-expect-error thinkingConfig is supported in v1beta but not in SDK types yet
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        request.serviceType,
      );
    } catch (geminiErr) {
      if (isTransientGeminiError(geminiErr)) {
        console.error(
          `[generateEstimate] Gemini unavailable for ${request.serviceType} after retries — returning busy error`,
        );
        throw new Error(BUSY_ERROR_MESSAGE);
      }
      console.error(
        `[generateEstimate] Gemini API error for ${request.serviceType}:`,
        JSON.stringify(geminiErr, Object.getOwnPropertyNames(geminiErr as object)),
      );
      throw geminiErr;
    }

    // Safely pull candidate + finishReason without invoking the SDK's
    // throwing .text() helper.
    const candidate = result.response.candidates?.[0] as GeminiCandidate | undefined;
    const finishReason = candidate?.finishReason;

    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      console.error(`[generateEstimate] Gemini blocked response (finishReason=${finishReason})`);
      throw new Error("Your input couldn't be processed by our AI. Please adjust the details and try again.");
    }

    const responseText = extractResponseText(candidate);
    console.log(`[generateEstimate] Gemini response length: ${responseText.length} chars, finishReason: ${finishReason || "none"}`);

    if (!responseText) {
      console.error(
        "[generateEstimate] Empty response text. Raw candidate:",
        JSON.stringify(candidate)?.slice(0, 500)
      );
      throw new Error("The AI returned an empty response. Please try again.");
    }
    console.log(`[generateEstimate] Response preview: ${responseText.slice(0, 300)}`);

    // Find the first balanced JSON object — resilient to preamble text,
    // markdown fencing, or a prefixed thinking block.
    const jsonSnippet = extractFirstJsonObject(responseText);
    if (!jsonSnippet) {
      console.error(`[generateEstimate] Could not find JSON in response:\n${responseText.slice(0, 500)}`);
      throw new Error("Failed to parse AI response — no JSON object found");
    }

    let parsed: {
      centerPrice: number;
      lineItems: EstimateLineItem[];
      summary: string;
      disclaimer: string;
      stcRebate?: number;
      estimatedSavings?: number;
    };
    try {
      parsed = JSON.parse(jsonSnippet);
    } catch (parseErr) {
      console.error(
        "[generateEstimate] JSON.parse failed. Snippet being parsed:",
        jsonSnippet.slice(0, 300)
      );
      throw parseErr;
    }

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

    // Generate a stable ID once — shared by Supabase insert and n8n payload
    const leadId = generateLeadId();

    // Save to Supabase + notify n8n (non-blocking, parallel)
    const suburb = String(request.formData.suburb || request.formData.location_suburb || "");

    const saveToSupabase: Promise<void> = supabase
      ? Promise.resolve(
          supabase.from("leads").insert({
            // lead_id omitted until the column exists in the Supabase table
            name: request.contact.firstName,
            phone: request.contact.phone,
            email: request.contact.email || null,
            suburb,
            service_type: request.serviceType,
            user_input: request.formData,
            ai_quote: estimate,
            verified_phone: true,
            created_at: new Date().toISOString(),
          })
        ).then(
          ({ error }) => { if (error) console.error("[generateEstimate] Supabase insert failed:", error); },
          (err) => console.error("[generateEstimate] Supabase insert rejected:", err)
        )
      : Promise.resolve();

    const notifyN8n = triggerN8nWebhook(request, estimate, suburb, leadId)
      .then(() => {}, (err) => console.error("n8n webhook failed:", err));

    await Promise.allSettled([saveToSupabase, notifyN8n]);

    return estimate;
  } catch (err) {
    // Log full error detail so it's visible in Vercel function logs
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error(`[generateEstimate] FATAL for ${request.serviceType}: ${errMsg}`);
    if (errStack) console.error(errStack);
    throw new Error(errMsg || "Failed to generate estimate. Please try again.");
  }
}

// ── n8n Webhook ───────────────────────────────────────────────────────
const N8N_ENDPOINTS: Record<ServiceType, string | undefined> = {
  "solar": process.env.N8N_WEBHOOK_SOLAR,
  "hvac": process.env.N8N_WEBHOOK_HVAC,
  "landscaping": process.env.N8N_WEBHOOK_LANDSCAPING,
  "roofing": process.env.N8N_WEBHOOK_ROOFING,
  "granny-flats": process.env.N8N_WEBHOOK_GRANNY_FLATS,
};

const SOURCE_PAGES: Record<ServiceType, string> = {
  "solar": "/solar",
  "hvac": "/hvac",
  "landscaping": "/landscaping",
  "roofing": "/roofing",
  "granny-flats": "/grannyflats",
};

async function triggerN8nWebhook(
  request: EstimateRequest,
  estimate: EstimateResult,
  suburb: string,
  leadId: string,
) {
  const url = N8N_ENDPOINTS[request.serviceType];
  if (!url) return;

  const payload = {
    lead_id: leadId,
    name: request.contact.firstName,
    phone: request.contact.phone,
    email: request.contact.email || null,
    suburb,
    service_type: request.serviceType,
    vertical: request.serviceType,
    source_page: SOURCE_PAGES[request.serviceType],
    ai_quote_summary: estimate.summary,
    min_price: estimate.minPrice,
    max_price: estimate.maxPrice,
    center_price: estimate.centerPrice,
    line_items: estimate.lineItems,
    image_urls: request.images?.length ? request.images.map((_img, i) => `uploaded-photo-${i + 1}`) : [],
    stc_rebate: estimate.stcRebate ?? null,
    estimated_savings: estimate.estimatedSavings ?? null,
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`n8n webhook (${request.serviceType}) returned ${res.status}`);
  }
}
