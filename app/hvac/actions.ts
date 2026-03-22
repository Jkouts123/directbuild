"use server";

// 2026 HVAC Price Matrix (Australian market rates)
const PRICE_MATRIX = {
  laborPerHour: 85,
  // Base install costs per system type
  systemBase: {
    "Split system installation": 1800,
    "Ducted system installation": 8500,
    "Multi-split system": 4500,
    "Replacement of existing system": 1200,
    "Repairs / troubleshooting": 350,
    "Not sure yet": 2500,
  } as Record<string, number>,
  // Capacity multipliers
  systemSize: {
    "Under 3.5kW (bedroom / small room)": 0.7,
    "3.5–5.0kW (medium room)": 1.0,
    "5.0–7.0kW (large living area)": 1.3,
    "7.0–10kW (open plan / large area)": 1.6,
    "10kW+ (whole home / ducted)": 2.2,
    "Not sure": 1.0,
  } as Record<string, number>,
  // Complexity surcharges
  installComplexity: {
    "Back-to-back install (indoor & outdoor units close together)": 0,
    "Standard install": 300,
    "Long pipe run required": 800,
    "Difficult access": 1200,
    "Ceiling / roof cavity work required": 1500,
    "Not sure": 300,
  } as Record<string, number>,
  // Electrical surcharge
  electrical: {
    "Existing power is suitable": 0,
    "Electrical upgrade required": 1200,
    "Not sure": 400,
  } as Record<string, number>,
  // Extras pricing
  extras: {
    "Removal of existing unit": 350,
    "New ducting required": 3500,
    "Zoning (ducted systems)": 2800,
    "Wi-Fi / smart controller": 450,
    "Noise reduction / isolation pads": 250,
    "Ongoing servicing / maintenance": 280,
  } as Record<string, number>,
};

export interface HVACQuoteInput {
  suburb: string;
  workType: string;
  systemSize?: string;
  propertyType?: string;
  installComplexity?: string;
  electrical?: string;
  brand?: string;
  extras?: string[];
  budget?: string;
  timeline?: string;
  photos: string[];
  // Contact
  firstName: string;
  phone: string;
  email: string;
  // Readiness
  propertyStatus?: string;
  paymentMethod?: string;
  financeStatus?: string;
  approvalType?: string;
  approvalStatus?: string;
}

export interface HVACQuoteLineItem {
  label: string;
  description: string;
  amount: number;
}

export interface HVACQuoteResult {
  lineItems: HVACQuoteLineItem[];
  subtotal: number;
  gst: number;
  total: number;
  priceRange: { min: number; max: number };
  disclaimer: string;
}

export async function generateHVACQuote(input: HVACQuoteInput): Promise<HVACQuoteResult> {
  const lineItems: HVACQuoteLineItem[] = [];

  // Base system cost
  const baseCost = PRICE_MATRIX.systemBase[input.workType] ?? 2500;
  const sizeMultiplier = input.systemSize
    ? PRICE_MATRIX.systemSize[input.systemSize] ?? 1.0
    : 1.0;
  const systemCost = Math.round(baseCost * sizeMultiplier);

  lineItems.push({
    label: "System & Installation",
    description: `${input.workType}${input.systemSize ? ` (${input.systemSize})` : ""}`,
    amount: systemCost,
  });

  // Install complexity surcharge
  if (input.installComplexity) {
    const complexityCost = PRICE_MATRIX.installComplexity[input.installComplexity] ?? 0;
    if (complexityCost > 0) {
      lineItems.push({
        label: "Installation Complexity",
        description: input.installComplexity,
        amount: complexityCost,
      });
    }
  }

  // Electrical surcharge
  if (input.electrical) {
    const electricalCost = PRICE_MATRIX.electrical[input.electrical] ?? 0;
    if (electricalCost > 0) {
      lineItems.push({
        label: "Electrical Work",
        description: input.electrical,
        amount: electricalCost,
      });
    }
  }

  // Extras
  if (input.extras && input.extras.length > 0) {
    for (const extra of input.extras) {
      const extraCost = PRICE_MATRIX.extras[extra] ?? 0;
      if (extraCost > 0) {
        lineItems.push({
          label: extra,
          description: "Add-on",
          amount: extraCost,
        });
      }
    }
  }

  // Labour estimate
  const isRepairs = input.workType === "Repairs / troubleshooting";
  const laborHours = isRepairs ? 3 : input.workType.includes("Ducted") ? 16 : 8;
  const laborCost = laborHours * PRICE_MATRIX.laborPerHour;
  lineItems.push({
    label: "Labour",
    description: `${laborHours} hrs @ $${PRICE_MATRIX.laborPerHour}/hr`,
    amount: laborCost,
  });

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const gst = Math.round(subtotal * 0.1);
  const total = subtotal + gst;

  // Price range: -15% to +20% of total
  const min = Math.round(total * 0.85);
  const max = Math.round(total * 1.2);

  return {
    lineItems,
    subtotal,
    gst,
    total,
    priceRange: { min, max },
    disclaimer:
      "This is an indicative estimate based on 2026 market rates. Final pricing is confirmed after an on-site inspection by your assigned HVAC technician. Prices include standard materials; premium brands may incur additional costs.",
  };
}
