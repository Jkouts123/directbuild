"use server";

// 2026 Solar Price Matrix (Australian market rates)
const PRICE_MATRIX = {
  laborPerHour: 85,
  // Base system cost per kW
  systemCostPerKw: {
    "3kW": 3200,
    "5kW": 4800,
    "6.6kW": 5900,
    "8kW": 7200,
    "10kW": 8800,
    "13kW+": 11500,
    "Not sure": 5900,
  } as Record<string, number>,
  // Panel tier premium
  panelTier: {
    "Standard (Jinko, Trina, Canadian Solar)": 0,
    "Mid-range (LONGi, QCells, REC)": 800,
    "Premium (SunPower, LG, REC Alpha)": 2200,
    "No preference": 0,
  } as Record<string, number>,
  // Inverter type
  inverter: {
    "String inverter (standard)": 0,
    "Micro-inverters (per panel)": 1500,
    "Hybrid inverter (battery-ready)": 1200,
    "Not sure": 0,
  } as Record<string, number>,
  // Battery pricing
  battery: {
    "No battery for now": 0,
    "Small (5kWh – Tesla Powerwall, BYD)": 8500,
    "Medium (10kWh)": 13500,
    "Large (13–15kWh)": 17500,
    "Not sure / want advice": 0,
  } as Record<string, number>,
  // Roof complexity
  roofComplexity: {
    "Simple single-plane roof": 0,
    "Multi-plane / hip roof": 600,
    "Steep pitch (>30 degrees)": 900,
    "Flat roof (tilt frames needed)": 1200,
    "Two-storey roof": 800,
    "Not sure": 300,
  } as Record<string, number>,
  // Electrical
  electrical: {
    "Standard switchboard (no upgrade needed)": 0,
    "Switchboard upgrade required": 1400,
    "Three-phase power": 600,
    "Not sure": 400,
  } as Record<string, number>,
};

export interface SolarQuoteInput {
  suburb: string;
  systemSize: string;
  panelTier: string;
  inverter: string;
  battery: string;
  roofType?: string;
  roofComplexity?: string;
  existingSolar?: string;
  electrical?: string;
  shading?: string;
  budget?: string;
  timeline?: string;
  photos: string[];
  firstName: string;
  phone: string;
  email: string;
  propertyStatus?: string;
  paymentMethod?: string;
  financeStatus?: string;
  approvalType?: string;
  approvalStatus?: string;
}

export interface SolarQuoteLineItem {
  label: string;
  description: string;
  amount: number;
}

export interface SolarQuoteResult {
  lineItems: SolarQuoteLineItem[];
  subtotal: number;
  gst: number;
  total: number;
  priceRange: { min: number; max: number };
  estimatedSavings: number;
  disclaimer: string;
}

export async function generateSolarQuote(input: SolarQuoteInput): Promise<SolarQuoteResult> {
  const lineItems: SolarQuoteLineItem[] = [];

  // System base cost
  const baseCost = PRICE_MATRIX.systemCostPerKw[input.systemSize] ?? 5900;
  lineItems.push({
    label: "Solar Panel System",
    description: `${input.systemSize} system`,
    amount: baseCost,
  });

  // Panel tier premium
  const panelPremium = PRICE_MATRIX.panelTier[input.panelTier] ?? 0;
  if (panelPremium > 0) {
    lineItems.push({
      label: "Panel Upgrade",
      description: input.panelTier,
      amount: panelPremium,
    });
  }

  // Inverter
  const inverterCost = PRICE_MATRIX.inverter[input.inverter] ?? 0;
  if (inverterCost > 0) {
    lineItems.push({
      label: "Inverter Upgrade",
      description: input.inverter,
      amount: inverterCost,
    });
  }

  // Battery
  const batteryCost = PRICE_MATRIX.battery[input.battery] ?? 0;
  if (batteryCost > 0) {
    lineItems.push({
      label: "Battery Storage",
      description: input.battery,
      amount: batteryCost,
    });
  }

  // Roof complexity
  if (input.roofComplexity) {
    const roofCost = PRICE_MATRIX.roofComplexity[input.roofComplexity] ?? 0;
    if (roofCost > 0) {
      lineItems.push({
        label: "Roof Complexity",
        description: input.roofComplexity,
        amount: roofCost,
      });
    }
  }

  // Electrical
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

  // Existing solar removal
  if (input.existingSolar === "Yes — needs removal and replacement") {
    lineItems.push({
      label: "Old System Removal",
      description: "Remove and dispose existing panels & inverter",
      amount: 1500,
    });
  }

  // Labour
  const laborHours = batteryCost > 0 ? 12 : 8;
  const laborCost = laborHours * PRICE_MATRIX.laborPerHour;
  lineItems.push({
    label: "Installation Labour",
    description: `${laborHours} hrs @ $${PRICE_MATRIX.laborPerHour}/hr`,
    amount: laborCost,
  });

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);
  const gst = Math.round(subtotal * 0.1);
  const total = subtotal + gst;

  // Estimated annual savings based on system size
  const kwMatch = input.systemSize.match(/(\d+\.?\d*)/);
  const kw = kwMatch ? parseFloat(kwMatch[1]) : 6.6;
  const estimatedSavings = Math.round(kw * 380); // ~$380 savings per kW per year

  const min = Math.round(total * 0.85);
  const max = Math.round(total * 1.2);

  return {
    lineItems,
    subtotal,
    gst,
    total,
    priceRange: { min, max },
    estimatedSavings,
    disclaimer:
      "This is an indicative estimate based on 2026 market rates. Final pricing is confirmed after an on-site assessment by your assigned CEC-accredited installer. STC rebates may further reduce your out-of-pocket cost.",
  };
}
