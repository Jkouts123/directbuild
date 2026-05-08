type GetNswPlanningSignalsInput = {
  trade: string;
  serviceArea: string;
  councilName?: string;
  limit?: number;
};

export type NswPlanningStatus =
  | "success"
  | "error"
  | "no_results"
  | "unavailable";

export type GetNswPlanningSignalsResult = {
  source: "nsw_planning";
  status: NswPlanningStatus;
  query: string;
  serviceArea: string;
  councilName?: string;
  directApplicationCount: number;
  contextApplicationCount: number;
  relevantApplicationCount: number;
  topDirectKeywords: string[];
  topContextKeywords: string[];
  topMatchedKeywords: string[];
  signalStrength: "low" | "moderate" | "strong";
  dataBasis: string;
  summary: {
    directApplicationCount: number;
    contextApplicationCount: number;
    relevantApplicationCount: number;
    topDirectKeywords: string[];
    topContextKeywords: string[];
    topMatchedKeywords: string[];
    signalStrength: "low" | "moderate" | "strong";
    dataBasis: string;
  };
  error?: string;
};

type TrackerFeature = {
  properties?: Record<string, unknown>;
};

type TrackerResponse = {
  TotalCount?: number;
  features?: TrackerFeature[];
  error?: unknown;
};

type PlanningApplicationSignal = {
  directKeywords: string[];
  contextKeywords: string[];
};

const APPLICATION_TRACKER_URL =
  "https://api.apps1.nsw.gov.au/eplanning/data/v0/DAApplicationTracker";

const RECENT_APPLICATION_WINDOW_DAYS = 365;
const DEFAULT_PAGE_SIZE = 100;

const NSW_COUNCIL_BY_AREA: Record<string, string> = {
  penrith: "Penrith City Council",
  "penrith city council": "Penrith City Council",
  "sydney - western sydney": "Penrith City Council",
  "western sydney": "Penrith City Council",
};

const DIRECT_KEYWORDS_BY_TRADE = {
  landscaping: [
    "pool",
    "swimming pool",
    "deck",
    "patio",
    "fencing",
    "retaining wall",
    "paving",
    "landscaping",
    "turf",
    "alfresco",
    "pergola",
    "earthworks",
  ],
  roofing: ["roof", "re-roof", "roofing", "gutter", "stormwater"],
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
  solar: ["solar", "photovoltaic", "battery", "electrical"],
} satisfies Record<string, string[]>;

const CONTEXT_KEYWORDS = [
  "residential",
  "dwelling house",
  "alterations and additions",
  "alterations or additions",
  "secondary dwelling",
  "dual occupancy",
  "demolition",
  "new structure",
];

function normaliseKey(value: string) {
  return value.trim().toLowerCase().replace(/,.*$/, "").replace(/\s+/g, " ");
}

export function getSupportedNswPlanningCouncil(serviceArea: string) {
  return NSW_COUNCIL_BY_AREA[normaliseKey(serviceArea)];
}

export function getNswPlanningUnavailableResult(input: {
  trade: string;
  serviceArea: string;
  councilName?: string;
  reason?: string;
}): GetNswPlanningSignalsResult {
  return buildResult({
    status: "unavailable",
    query: `${input.trade} ${input.serviceArea} NSW DA CDC planning activity`,
    serviceArea: input.serviceArea,
    councilName: input.councilName,
    directApplications: [],
    contextApplications: [],
    dataBasis:
      input.reason ||
      "Planning activity data is unavailable/pending access for this service area.",
    error: input.reason,
  });
}

function normaliseLimit(limit?: number) {
  if (!Number.isFinite(limit)) return DEFAULT_PAGE_SIZE;
  return Math.max(10, Math.min(Math.trunc(limit || DEFAULT_PAGE_SIZE), 4000));
}

function getKeywordsForTrade(trade: string) {
  const lowerTrade = trade.toLowerCase();

  if (lowerTrade.includes("landscap")) return DIRECT_KEYWORDS_BY_TRADE.landscaping;
  if (lowerTrade.includes("roof")) return DIRECT_KEYWORDS_BY_TRADE.roofing;
  if (lowerTrade.includes("solar")) return DIRECT_KEYWORDS_BY_TRADE.solar;
  if (
    lowerTrade.includes("build") ||
    lowerTrade.includes("granny") ||
    lowerTrade.includes("renovat")
  ) {
    return DIRECT_KEYWORDS_BY_TRADE.builders;
  }

  return DIRECT_KEYWORDS_BY_TRADE.builders;
}

function getMatchedKeywords(text: string, keywords: string[]) {
  const normalisedText = text.toLowerCase();
  return keywords.filter((keyword) => normalisedText.includes(keyword));
}

function countTopKeywords(applications: PlanningApplicationSignal[], field: "directKeywords" | "contextKeywords") {
  const counts = new Map<string, number>();

  for (const application of applications) {
    for (const keyword of application[field]) {
      counts.set(keyword, (counts.get(keyword) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([keyword]) => keyword);
}

function getSignalStrength(count: number): "low" | "moderate" | "strong" {
  if (count >= 8) return "strong";
  if (count >= 3) return "moderate";
  return "low";
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return "";
}

function getRecentDateFrom() {
  const date = new Date();
  date.setDate(date.getDate() - RECENT_APPLICATION_WINDOW_DAYS);
  return date.toISOString().slice(0, 10);
}

function mapFeatureToSignal(
  feature: TrackerFeature,
  directKeywords: string[],
): PlanningApplicationSignal | null {
  const properties = feature.properties || {};
  const searchableText = [
    pickString(properties, ["PROJECT_TITLE"]),
    pickString(properties, ["TYPE_OF_DEVELOPMENT"]),
    pickString(properties, ["APPLICATION_TYPE"]),
    pickString(properties, ["STATUS"]),
  ]
    .filter(Boolean)
    .join(" ");
  const matchedDirectKeywords = getMatchedKeywords(searchableText, directKeywords);
  const matchedContextKeywords = getMatchedKeywords(searchableText, CONTEXT_KEYWORDS);

  if (matchedDirectKeywords.length === 0 && matchedContextKeywords.length === 0) {
    return null;
  }

  return {
    directKeywords: matchedDirectKeywords,
    contextKeywords: matchedContextKeywords,
  };
}

async function fetchTrackerRecords(input: {
  councilName: string;
  pageSize: number;
}) {
  const response = await fetch(APPLICATION_TRACKER_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ApplicationStatus: "ALL",
      CouncilDisplayName: input.councilName,
      LodgementDateFrom: getRecentDateFrom(),
      PageNumber: 1,
      PageSize: input.pageSize,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as TrackerResponse;

  if (!response.ok) {
    throw new Error(
      `NSW Planning tracker request failed with status ${response.status}.`,
    );
  }

  return data.features || [];
}

function buildResult(input: {
  status: NswPlanningStatus;
  query: string;
  serviceArea: string;
  councilName?: string;
  directApplications: PlanningApplicationSignal[];
  contextApplications: PlanningApplicationSignal[];
  dataBasis: string;
  error?: string;
}): GetNswPlanningSignalsResult {
  const directApplicationCount = input.directApplications.length;
  const contextApplicationCount = input.contextApplications.length;
  const relevantApplicationCount = directApplicationCount + contextApplicationCount;
  const topDirectKeywords = countTopKeywords(input.directApplications, "directKeywords");
  const topContextKeywords = countTopKeywords(
    input.contextApplications,
    "contextKeywords",
  );
  const topMatchedKeywords = Array.from(
    new Set([...topDirectKeywords, ...topContextKeywords]),
  ).slice(0, 5);
  const signalStrength = getSignalStrength(relevantApplicationCount);
  const summary = {
    directApplicationCount,
    contextApplicationCount,
    relevantApplicationCount,
    topDirectKeywords,
    topContextKeywords,
    topMatchedKeywords,
    signalStrength,
    dataBasis: input.dataBasis,
  };

  return {
    source: "nsw_planning",
    status: input.status,
    query: input.query,
    serviceArea: input.serviceArea,
    ...(input.councilName ? { councilName: input.councilName } : {}),
    ...summary,
    summary,
    ...(input.error ? { error: input.error } : {}),
  };
}

export async function getNswPlanningSignals(
  input: GetNswPlanningSignalsInput,
): Promise<GetNswPlanningSignalsResult> {
  const trade = input.trade.trim();
  const serviceArea = input.serviceArea.trim();
  const councilName =
    input.councilName || getSupportedNswPlanningCouncil(serviceArea);
  const query = `${trade} ${serviceArea} NSW DA CDC planning activity`;
  const dataBasis =
    "NSW Planning Portal Application Tracker records lodged in the last 365 days, summarised by keyword only.";

  if (!councilName) {
    return getNswPlanningUnavailableResult({
      trade,
      serviceArea,
      reason:
        "No supported NSW Planning council mapping exists for this service area yet.",
    });
  }

  try {
    const features = await fetchTrackerRecords({
      councilName,
      pageSize: normaliseLimit(input.limit),
    });
    const directKeywords = getKeywordsForTrade(trade);
    const signals = features
      .map((feature) => mapFeatureToSignal(feature, directKeywords))
      .filter((signal): signal is PlanningApplicationSignal => signal !== null);
    const directApplications = signals.filter(
      (signal) => signal.directKeywords.length > 0,
    );
    const contextApplications = signals.filter(
      (signal) =>
        signal.directKeywords.length === 0 && signal.contextKeywords.length > 0,
    );

    if (signals.length === 0) {
      return buildResult({
        status: "no_results",
        query,
        serviceArea,
        councilName,
        directApplications: [],
        contextApplications: [],
        dataBasis,
      });
    }

    return buildResult({
      status: "success",
      query,
      serviceArea,
      councilName,
      directApplications,
      contextApplications,
      dataBasis,
    });
  } catch (error) {
    return buildResult({
      status: "error",
      query,
      serviceArea,
      councilName,
      directApplications: [],
      contextApplications: [],
      dataBasis,
      error:
        error instanceof Error
          ? error.message
          : "Unknown NSW Planning tracker error.",
    });
  }
}
