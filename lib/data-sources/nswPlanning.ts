type GetNswPlanningSignalsInput = {
  trade: string;
  serviceArea: string;
  limit?: number;
};

type PlanningApplicationSignal = {
  council?: string;
  suburb?: string;
  address?: string;
  description?: string;
  lodgedDate?: string;
  status?: string;
  matchedKeywords: string[];
};

type GetNswPlanningSignalsResult = {
  source: "nsw_planning";
  status: "success" | "error" | "no_results";
  query: string;
  serviceArea: string;
  relevantApplications: PlanningApplicationSignal[];
  summary: {
    relevantApplicationCount: number;
    topMatchedKeywords: string[];
    signalStrength: "low" | "moderate" | "strong";
  };
  error?: string;
};

type CkanPackageResponse = {
  success?: boolean;
  result?: {
    resources?: Array<{
      id?: string;
      name?: string;
      format?: string;
      datastore_active?: boolean;
      url?: string;
    }>;
  };
  error?: {
    message?: string;
  };
};

type CkanDatastoreResponse = {
  success?: boolean;
  result?: {
    records?: Array<Record<string, unknown>>;
  };
  error?: {
    message?: string;
  };
};

const ONLINE_DA_PACKAGE_URL =
  "https://data.nsw.gov.au/data/api/3/action/package_show?id=online-da-data-api";

const CKAN_DATASTORE_SEARCH_URL =
  "https://data.nsw.gov.au/data/api/3/action/datastore_search";

const RECENT_APPLICATION_WINDOW_DAYS = 365;

const KEYWORDS_BY_TRADE = {
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
    "alterations",
    "additions",
  ],
  roofing: [
    "roof",
    "re-roof",
    "roofing",
    "gutter",
    "stormwater",
    "alterations",
    "additions",
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
  solar: ["solar", "photovoltaic", "battery", "electrical"],
} satisfies Record<string, string[]>;

function buildResult(
  status: GetNswPlanningSignalsResult["status"],
  query: string,
  serviceArea: string,
  relevantApplications: PlanningApplicationSignal[],
  error?: string,
): GetNswPlanningSignalsResult {
  return {
    source: "nsw_planning",
    status,
    query,
    serviceArea,
    relevantApplications,
    summary: {
      relevantApplicationCount: relevantApplications.length,
      topMatchedKeywords: getTopMatchedKeywords(relevantApplications),
      signalStrength: getSignalStrength(relevantApplications.length),
    },
    ...(error ? { error } : {}),
  };
}

function normaliseLimit(limit?: number) {
  if (!Number.isFinite(limit)) return 10;
  return Math.max(1, Math.min(Math.trunc(limit || 10), 50));
}

function getKeywordsForTrade(trade: string) {
  const lowerTrade = trade.toLowerCase();

  if (lowerTrade.includes("landscap")) return KEYWORDS_BY_TRADE.landscaping;
  if (lowerTrade.includes("roof")) return KEYWORDS_BY_TRADE.roofing;
  if (lowerTrade.includes("solar")) return KEYWORDS_BY_TRADE.solar;
  if (
    lowerTrade.includes("build") ||
    lowerTrade.includes("granny") ||
    lowerTrade.includes("renovat")
  ) {
    return KEYWORDS_BY_TRADE.builders;
  }

  return KEYWORDS_BY_TRADE.builders;
}

function getMatchedKeywords(text: string, keywords: string[]) {
  const normalisedText = text.toLowerCase();
  return keywords.filter((keyword) => normalisedText.includes(keyword));
}

function getTopMatchedKeywords(applications: PlanningApplicationSignal[]) {
  const counts = new Map<string, number>();

  for (const application of applications) {
    for (const keyword of application.matchedKeywords) {
      counts.set(keyword, (counts.get(keyword) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([keyword]) => keyword);
}

function getSignalStrength(count: number) {
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

  return undefined;
}

function getLodgedDate(record: Record<string, unknown>) {
  return pickString(record, [
    "lodgedDate",
    "LodgedDate",
    "lodgementDate",
    "LodgementDate",
    "dateLodged",
    "DateLodged",
  ]);
}

function isRecentApplication(lodgedDate?: string) {
  if (!lodgedDate) return true;

  const timestamp = Date.parse(lodgedDate);
  if (Number.isNaN(timestamp)) return true;

  const ageMs = Date.now() - timestamp;
  const recentWindowMs = RECENT_APPLICATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return ageMs <= recentWindowMs;
}

function mapRecordToApplication(
  record: Record<string, unknown>,
  keywords: string[],
): PlanningApplicationSignal | null {
  const description = pickString(record, [
    "description",
    "developmentDescription",
    "DevelopmentDescription",
    "development_description",
    "applicationDescription",
    "ApplicationDescription",
  ]);
  const address = pickString(record, [
    "address",
    "propertyAddress",
    "PropertyAddress",
    "siteAddress",
    "SiteAddress",
  ]);
  const lodgedDate = getLodgedDate(record);
  const searchableText = [description, address].filter(Boolean).join(" ");
  const matchedKeywords = getMatchedKeywords(searchableText, keywords);

  if (!isRecentApplication(lodgedDate)) return null;
  if (matchedKeywords.length === 0) return null;

  return {
    ...(pickString(record, ["council", "Council", "councilName", "CouncilName"])
      ? {
          council: pickString(record, [
            "council",
            "Council",
            "councilName",
            "CouncilName",
          ]),
        }
      : {}),
    ...(pickString(record, ["suburb", "Suburb", "locality", "Locality"])
      ? { suburb: pickString(record, ["suburb", "Suburb", "locality", "Locality"]) }
      : {}),
    ...(address ? { address } : {}),
    ...(description ? { description } : {}),
    ...(lodgedDate ? { lodgedDate } : {}),
    ...(pickString(record, ["status", "Status", "applicationStatus"])
      ? {
          status: pickString(record, [
            "status",
            "Status",
            "applicationStatus",
          ]),
        }
      : {}),
    matchedKeywords,
  };
}

async function findPublicDatastoreResource() {
  const response = await fetch(ONLINE_DA_PACKAGE_URL, {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json().catch(() => ({}))) as CkanPackageResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.error?.message ||
        `NSW Planning metadata request failed with status ${response.status}.`,
    );
  }

  return (data.result?.resources || []).find(
    (resource) => resource.datastore_active && resource.id,
  );
}

async function fetchDatastoreRecords(resourceId: string, query: string, limit: number) {
  const url = new URL(CKAN_DATASTORE_SEARCH_URL);
  url.searchParams.set("resource_id", resourceId);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json().catch(() => ({}))) as CkanDatastoreResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.error?.message ||
        `NSW Planning datastore request failed with status ${response.status}.`,
    );
  }

  return data.result?.records || [];
}

export async function getNswPlanningSignals(
  input: GetNswPlanningSignalsInput,
): Promise<GetNswPlanningSignalsResult> {
  const trade = input.trade.trim();
  const serviceArea = input.serviceArea.trim();
  const query = `${trade} ${serviceArea} NSW development applications`;
  const keywords = getKeywordsForTrade(trade);
  const limit = normaliseLimit(input.limit);

  try {
    const resource = await findPublicDatastoreResource();

    if (!resource?.id) {
      return buildResult(
        "error",
        query,
        serviceArea,
        [],
        "NSW Online DA open-data metadata is available, but no unauthenticated machine-readable DA application records endpoint is exposed by the public CKAN package.",
      );
    }

    const records = await fetchDatastoreRecords(resource.id, serviceArea, limit);
    const relevantApplications = records
      .map((record) => mapRecordToApplication(record, keywords))
      .filter(
        (application): application is PlanningApplicationSignal =>
          application !== null,
      )
      .slice(0, limit);

    if (relevantApplications.length === 0) {
      return buildResult("no_results", query, serviceArea, []);
    }

    return buildResult("success", query, serviceArea, relevantApplications);
  } catch (error) {
    return buildResult(
      "error",
      query,
      serviceArea,
      [],
      error instanceof Error ? error.message : "Unknown NSW Planning data error.",
    );
  }
}
