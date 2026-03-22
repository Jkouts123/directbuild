"use server";

// 2026 Price Matrix
const PRICE_MATRIX = {
  laborPerHour: 75,
  turf: {
    "Sir Walter": 28,
    Kikuyu: 18,
    Synthetic: 95,
    "Not Sure": 28, // default to mid-range
  } as Record<string, number>,
  paving: {
    Concrete: 120,
    Brick: 140,
    "Natural Stone": 200,
    "Not Sure": 120,
  } as Record<string, number>,
  walls: {
    Timber: 350,
    Concrete: 450,
    "Besser Block": 380,
    "Not Sure": 350,
  } as Record<string, number>,
  decking: {
    Merbau: 320,
    "Treated Pine": 220,
    Composite: 380,
    "Not Sure": 320,
  } as Record<string, number>,
};

export interface QuoteInput {
  suburb: string;
  services: string[];
  turf?: { sqm: number; type: string };
  paving?: { sqm: number; material: string };
  walls?: { length: number; material: string };
  decking?: { sqm: number; material: string };
  sideAccess: boolean;
  photos: string[]; // base64
}

export interface QuoteLineItem {
  service: string;
  description: string;
  estimate: number;
}

export interface QuoteResult {
  lineItems: QuoteLineItem[];
  laborEstimate: number;
  subtotal: number;
  gst: number;
  total: number;
  disclaimer: string;
}

export async function generateQuote(input: QuoteInput): Promise<QuoteResult> {
  const lineItems: QuoteLineItem[] = [];
  let totalLaborHours = 0;

  if (input.turf && input.services.includes("Turf")) {
    const rate = PRICE_MATRIX.turf[input.turf.type] ?? 28;
    const materialCost = rate * input.turf.sqm;
    const hours = Math.ceil(input.turf.sqm / 40); // ~40m2/day
    totalLaborHours += hours * 8;
    lineItems.push({
      service: "Turf",
      description: `${input.turf.sqm}m\u00B2 ${input.turf.type} @ $${rate}/m\u00B2`,
      estimate: materialCost,
    });
  }

  if (input.paving && input.services.includes("Paving")) {
    const rate = PRICE_MATRIX.paving[input.paving.material] ?? 120;
    const materialCost = rate * input.paving.sqm;
    const hours = Math.ceil(input.paving.sqm / 15); // ~15m2/day
    totalLaborHours += hours * 8;
    lineItems.push({
      service: "Paving",
      description: `${input.paving.sqm}m\u00B2 ${input.paving.material} @ $${rate}/m\u00B2`,
      estimate: materialCost,
    });
  }

  if (input.walls && input.services.includes("Retaining Walls")) {
    const rate = PRICE_MATRIX.walls[input.walls.material] ?? 350;
    const materialCost = rate * input.walls.length;
    const hours = Math.ceil(input.walls.length / 3); // ~3m/day
    totalLaborHours += hours * 8;
    lineItems.push({
      service: "Retaining Walls",
      description: `${input.walls.length}m ${input.walls.material} @ $${rate}/m`,
      estimate: materialCost,
    });
  }

  if (input.decking && input.services.includes("Decking")) {
    const rate = PRICE_MATRIX.decking[input.decking.material] ?? 320;
    const materialCost = rate * input.decking.sqm;
    const hours = Math.ceil(input.decking.sqm / 8); // ~8m2/day
    totalLaborHours += hours * 8;
    lineItems.push({
      service: "Decking",
      description: `${input.decking.sqm}m\u00B2 ${input.decking.material} @ $${rate}/m\u00B2`,
      estimate: materialCost,
    });
  }

  // Access surcharge
  if (!input.sideAccess) {
    totalLaborHours = Math.ceil(totalLaborHours * 1.15); // 15% labor uplift
  }

  const laborEstimate = totalLaborHours * PRICE_MATRIX.laborPerHour;
  const materialSubtotal = lineItems.reduce((s, li) => s + li.estimate, 0);
  const subtotal = materialSubtotal + laborEstimate;
  const gst = Math.round(subtotal * 0.1);
  const total = subtotal + gst;

  return {
    lineItems,
    laborEstimate,
    subtotal,
    gst,
    total,
    disclaimer:
      "This is an indicative estimate based on 2026 market rates. Final pricing confirmed after on-site measure by your assigned landscaper.",
  };
}
