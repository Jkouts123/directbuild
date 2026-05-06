export type NormalisedTrade =
  | "landscaping"
  | "roofing"
  | "builders"
  | "solar"
  | "carpentry"
  | "concreting"
  | "renovations"
  | "generic";

export const TRADE_KEYWORDS: Record<NormalisedTrade, string[]> = {
  landscaping: [
    "landscaping",
    "retaining wall",
    "pool",
    "swimming pool",
    "deck",
    "patio",
    "paving",
    "turf",
    "outdoor area",
    "alfresco",
    "garden",
    "fencing",
  ],
  roofing: [
    "roof",
    "re-roof",
    "roofing",
    "gutter",
    "stormwater",
    "skylight",
    "fascia",
    "downpipe",
  ],
  builders: [
    "alterations",
    "additions",
    "extension",
    "renovation",
    "secondary dwelling",
    "granny flat",
    "demolition",
    "garage",
    "carport",
  ],
  solar: ["solar", "photovoltaic", "battery", "electrical", "inverter"],
  carpentry: [
    "carpentry",
    "deck",
    "pergola",
    "framing",
    "timber",
    "stairs",
    "doors",
    "skirting",
  ],
  concreting: [
    "concrete",
    "concreting",
    "driveway",
    "slab",
    "footing",
    "pathway",
    "paving",
    "crossover",
  ],
  renovations: [
    "renovation",
    "alterations",
    "additions",
    "extension",
    "bathroom",
    "kitchen",
    "laundry",
    "internal works",
  ],
  generic: [
    "residential",
    "home improvement",
    "alterations",
    "additions",
    "renovation",
    "repair",
    "installation",
    "maintenance",
  ],
};

export function normaliseTrade(trade: string): NormalisedTrade {
  const value = trade.trim().toLowerCase();

  if (value.includes("landscap")) return "landscaping";
  if (value.includes("roof")) return "roofing";
  if (value.includes("solar") || value.includes("photovoltaic")) return "solar";
  if (value.includes("carpent") || value.includes("joiner")) return "carpentry";
  if (value.includes("concret") || value.includes("driveway")) return "concreting";
  if (value.includes("renovat") || value.includes("extension")) {
    return "renovations";
  }
  if (
    value.includes("build") ||
    value.includes("granny") ||
    value.includes("secondary dwelling")
  ) {
    return "builders";
  }

  return "generic";
}

export function getTradeKeywords(trade: string): string[] {
  return TRADE_KEYWORDS[normaliseTrade(trade)];
}

export function getSearchTradeLabel(trade: string): string {
  const normalisedTrade = normaliseTrade(trade);

  if (normalisedTrade === "generic") return trade.trim() || "residential trade";
  if (normalisedTrade === "builders") return "builder";
  if (normalisedTrade === "renovations") return "renovation builder";

  return normalisedTrade;
}
