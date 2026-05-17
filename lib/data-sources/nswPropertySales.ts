import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

type NswPropertySalesSignalsInput = {
  serviceArea: string;
};

export type NswPropertySalesSignalsResult = {
  source: "nsw_property_sales";
  status: "success" | "error" | "unavailable" | "no_results";
  serviceArea: string;
  salesCount?: number;
  medianSalePrice?: number;
  earliestContractDate?: string;
  latestContractDate?: string;
  earliestSettlementDate?: string;
  latestSettlementDate?: string;
  propertyTurnoverSignal?: "low" | "moderate" | "strong";
  dataBasis?: string;
  summary: {
    propertyTurnoverSignal: "low" | "moderate" | "strong" | "pending";
    salesCount?: number;
    medianSalePrice?: number;
    earliestContractDate?: string;
    latestContractDate?: string;
    earliestSettlementDate?: string;
    latestSettlementDate?: string;
    sampleSize?: number;
  };
  notes: string[];
  error?: string;
};

export type NswPsiSaleRow = {
  recordType: "B";
  districtCode: string;
  propertyId: string;
  saleId: string;
  unitNumber?: string;
  houseNumber?: string;
  streetName?: string;
  suburb?: string;
  postcode?: string;
  area?: number;
  areaType?: string;
  contractDate?: string;
  settlementDate?: string;
  purchasePrice?: number;
  zoneCode?: string;
  propertyNature?: string;
  primaryPurpose?: string;
  dealingNumber?: string;
  rawFields: string[];
};

export type NswPropertySalesAggregate = {
  serviceArea: string;
  matchedSalesCount: number;
  medianSalePrice: number | null;
  propertyTurnoverSignal: "low" | "moderate" | "strong";
  fromDate?: string;
  toDate?: string;
};

type NswPropertySalesCacheSuburbSummary = {
  salesCount: number;
  medianSalePrice: number;
  earliestContractDate: string;
  latestContractDate: string;
  earliestSettlementDate: string;
  latestSettlementDate: string;
  propertyTurnoverSignal: "low" | "moderate" | "strong";
  sampleSize: number;
};

type NswPropertySalesSupabaseRow = {
  suburb: string;
  state: string;
  sales_count: number;
  median_sale_price: number | string | null;
  earliest_contract_date: string | null;
  latest_contract_date: string | null;
  earliest_settlement_date: string | null;
  latest_settlement_date: string | null;
  property_turnover_signal: "low" | "moderate" | "strong" | null;
  sample_size: number;
  generated_at: string | null;
  data_basis: string | null;
};

type NswPropertySalesCache = {
  source: "nsw_property_sales";
  generatedAt: string;
  dataBasis: string;
  suburbs: Record<string, NswPropertySalesCacheSuburbSummary>;
};

const NSW_PROPERTY_SALES_CACHE_PATH = path.join(
  process.cwd(),
  "data-cache",
  "nsw-property-sales-summary.json",
);

function buildResult(
  status: NswPropertySalesSignalsResult["status"],
  serviceArea: string,
  notes: string[],
  error?: string,
): NswPropertySalesSignalsResult {
  return {
    source: "nsw_property_sales",
    status,
    serviceArea,
    summary: {
      propertyTurnoverSignal: "pending",
    },
    notes,
    ...(error ? { error } : {}),
  };
}

function buildSuccessResult(input: {
  serviceArea: string;
  dataBasis: string;
  suburbSummary: NswPropertySalesCacheSuburbSummary;
  storage: "Supabase" | "local cache";
}): NswPropertySalesSignalsResult {
  return {
    source: "nsw_property_sales",
    status: "success",
    serviceArea: input.serviceArea,
    salesCount: input.suburbSummary.salesCount,
    medianSalePrice: input.suburbSummary.medianSalePrice,
    earliestContractDate: input.suburbSummary.earliestContractDate,
    latestContractDate: input.suburbSummary.latestContractDate,
    earliestSettlementDate: input.suburbSummary.earliestSettlementDate,
    latestSettlementDate: input.suburbSummary.latestSettlementDate,
    propertyTurnoverSignal: input.suburbSummary.propertyTurnoverSignal,
    dataBasis: input.dataBasis,
    summary: {
      propertyTurnoverSignal: input.suburbSummary.propertyTurnoverSignal,
      salesCount: input.suburbSummary.salesCount,
      medianSalePrice: input.suburbSummary.medianSalePrice,
      earliestContractDate: input.suburbSummary.earliestContractDate,
      latestContractDate: input.suburbSummary.latestContractDate,
      earliestSettlementDate: input.suburbSummary.earliestSettlementDate,
      latestSettlementDate: input.suburbSummary.latestSettlementDate,
      sampleSize: input.suburbSummary.sampleSize,
    },
    notes: [
      `Official NSW Valuer General PSI suburb summary found in ${input.storage}.`,
      "Property turnover is a renovation-trigger proxy, not guaranteed renovation demand.",
      "No full addresses are returned by this cache-backed signal.",
    ],
  };
}

function normaliseArea(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const number = Number(value.replace(/,/g, ""));
  return Number.isFinite(number) ? number : undefined;
}

function parseDate(value?: string) {
  if (!value || !/^\d{8}$/.test(value)) return undefined;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function stripRecordTerminator(line: string) {
  return line.trim().replace(/\$$/, "");
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function getTurnoverSignal(count: number) {
  if (count >= 21) return "strong";
  if (count >= 6) return "moderate";
  return "low";
}

function parseMaybeNumber(value: number | string | null) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function cleanDate(value: string | null | undefined) {
  return value || "";
}

function mapSupabaseRowToSummary(
  row: NswPropertySalesSupabaseRow,
): NswPropertySalesCacheSuburbSummary {
  return {
    salesCount: row.sales_count,
    medianSalePrice: parseMaybeNumber(row.median_sale_price),
    earliestContractDate: cleanDate(row.earliest_contract_date),
    latestContractDate: cleanDate(row.latest_contract_date),
    earliestSettlementDate: cleanDate(row.earliest_settlement_date),
    latestSettlementDate: cleanDate(row.latest_settlement_date),
    propertyTurnoverSignal:
      row.property_turnover_signal || getTurnoverSignal(row.sales_count),
    sampleSize: row.sample_size,
  };
}

async function getSupabaseSuburbSummary(suburbKey: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      status: "not_configured" as const,
      note:
        "Supabase NSW property-sales storage is not configured in this environment.",
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data, error } = await supabase
    .from("nsw_property_sales_suburb_summary")
    .select(
      "suburb,state,sales_count,median_sale_price,earliest_contract_date,latest_contract_date,earliest_settlement_date,latest_settlement_date,property_turnover_signal,sample_size,generated_at,data_basis",
    )
    .eq("suburb", suburbKey)
    .maybeSingle<NswPropertySalesSupabaseRow>();

  if (error) {
    return {
      status: "error" as const,
      note: `Supabase NSW property-sales lookup failed: ${error.message}`,
    };
  }

  if (!data) {
    return {
      status: "not_found" as const,
      note: `Supabase NSW property-sales storage has no row for ${suburbKey}.`,
    };
  }

  return {
    status: "success" as const,
    dataBasis:
      data.data_basis ||
      "Official NSW Valuer General Property Sales Information suburb summary stored in Supabase.",
    suburbSummary: mapSupabaseRowToSummary(data),
  };
}

function getLocalCacheSuburbSummary(suburbKey: string) {
  if (!fs.existsSync(NSW_PROPERTY_SALES_CACHE_PATH)) {
    return {
      status: "missing_cache" as const,
      note:
        "Local NSW property-sales cache is not available at data-cache/nsw-property-sales-summary.json.",
    };
  }

  const cache = JSON.parse(
    fs.readFileSync(NSW_PROPERTY_SALES_CACHE_PATH, "utf8"),
  ) as NswPropertySalesCache;
  const suburbSummary = cache.suburbs?.[suburbKey];

  if (!suburbSummary) {
    return {
      status: "not_found" as const,
      note: `Local NSW property-sales cache has no suburb summary for ${suburbKey}.`,
    };
  }

  return {
    status: "success" as const,
    dataBasis: cache.dataBasis,
    suburbSummary,
  };
}

export function parseNswPsiDat(content: string): NswPsiSaleRow[] {
  return content
    .split(/\r?\n/)
    .map(stripRecordTerminator)
    .filter((line) => line.startsWith("B;"))
    .map((line): NswPsiSaleRow | null => {
      const fields = line.split(";");
      const purchasePrice = parseNumber(fields[15]);

      if (!purchasePrice) return null;

      return {
        recordType: "B",
        districtCode: fields[1] || "",
        propertyId: fields[2] || "",
        saleId: fields[3] || "",
        ...(fields[5] ? { unitNumber: fields[5] } : {}),
        ...(fields[7] ? { houseNumber: fields[7] } : {}),
        ...(fields[8] ? { streetName: fields[8] } : {}),
        ...(fields[9] ? { suburb: fields[9] } : {}),
        ...(fields[10] ? { postcode: fields[10] } : {}),
        ...(parseNumber(fields[11]) !== undefined
          ? { area: parseNumber(fields[11]) }
          : {}),
        ...(fields[12] ? { areaType: fields[12] } : {}),
        ...(parseDate(fields[13]) ? { contractDate: parseDate(fields[13]) } : {}),
        ...(parseDate(fields[14])
          ? { settlementDate: parseDate(fields[14]) }
          : {}),
        purchasePrice,
        ...(fields[16] ? { zoneCode: fields[16] } : {}),
        ...(fields[17] ? { propertyNature: fields[17] } : {}),
        ...(fields[18] ? { primaryPurpose: fields[18] } : {}),
        ...(fields[22] ? { dealingNumber: fields[22] } : {}),
        rawFields: fields,
      };
    })
    .filter((row): row is NswPsiSaleRow => row !== null);
}

export function aggregateNswPropertySalesRows(input: {
  rows: NswPsiSaleRow[];
  serviceArea: string;
  fromDate?: string;
  toDate?: string;
}): NswPropertySalesAggregate {
  const serviceArea = normaliseArea(input.serviceArea);
  const fromTime = input.fromDate ? Date.parse(input.fromDate) : null;
  const toTime = input.toDate ? Date.parse(input.toDate) : null;

  const matchingRows = input.rows.filter((row) => {
    if (normaliseArea(row.suburb || "") !== serviceArea) return false;

    const date = row.settlementDate || row.contractDate;
    const timestamp = date ? Date.parse(date) : null;
    if (timestamp !== null && fromTime !== null && timestamp < fromTime) return false;
    if (timestamp !== null && toTime !== null && timestamp > toTime) return false;

    return true;
  });
  const prices = matchingRows
    .map((row) => row.purchasePrice)
    .filter((price): price is number => typeof price === "number");
  const matchedSalesCount = matchingRows.length;

  return {
    serviceArea: input.serviceArea,
    matchedSalesCount,
    medianSalePrice: median(prices),
    propertyTurnoverSignal: getTurnoverSignal(matchedSalesCount),
    ...(input.fromDate ? { fromDate: input.fromDate } : {}),
    ...(input.toDate ? { toDate: input.toDate } : {}),
  };
}

export async function getNswPropertySalesSignals(
  input: NswPropertySalesSignalsInput,
): Promise<NswPropertySalesSignalsResult> {
  const serviceArea = input.serviceArea.trim();
  const suburbKey = normaliseArea(serviceArea);

  try {
    const notes: string[] = [];
    const supabaseResult = await getSupabaseSuburbSummary(suburbKey);

    if (supabaseResult.status === "success") {
      return buildSuccessResult({
        serviceArea,
        dataBasis: supabaseResult.dataBasis,
        suburbSummary: supabaseResult.suburbSummary,
        storage: "Supabase",
      });
    }

    notes.push(supabaseResult.note);

    const localCacheResult = getLocalCacheSuburbSummary(suburbKey);

    if (localCacheResult.status === "success") {
      const result = buildSuccessResult({
        serviceArea,
        dataBasis: localCacheResult.dataBasis,
        suburbSummary: localCacheResult.suburbSummary,
        storage: "local cache",
      });

      return {
        ...result,
        notes: [...notes, ...result.notes],
      };
    }

    notes.push(localCacheResult.note);

    if (
      supabaseResult.status === "not_configured" &&
      localCacheResult.status === "missing_cache"
    ) {
      return buildResult(
        "unavailable",
        serviceArea,
        [
          ...notes,
          "Configure Supabase or build data-cache/nsw-property-sales-summary.json from official NSW Valuer General PSI .DAT files before using this signal.",
          "Unavailable property-sales data should be treated as pending, not as low property turnover.",
        ],
      );
    }

    if (supabaseResult.status === "error" && localCacheResult.status === "missing_cache") {
      return buildResult("unavailable", serviceArea, [
        ...notes,
        "Supabase lookup failed and no local cache was available.",
        "Unavailable property-sales data should be treated as pending, not as low property turnover.",
      ]);
    }

    return buildResult("no_results", serviceArea, [
      ...notes,
      `No NSW property-sales suburb summary was found for ${suburbKey}.`,
      "Missing suburb data should be treated as incomplete coverage, not as low property turnover.",
    ]);
  } catch (error) {
    return buildResult(
      "error",
      serviceArea,
      [
        "NSW property-sales data could not be checked in this request.",
        "Unavailable property-sales data should be treated as pending, not as low property turnover.",
      ],
      error instanceof Error
        ? error.message
        : "Unknown NSW property sales data error.",
    );
  }
}

// This datasource intentionally reads a local summary cache only. Raw Valuer
// General PSI ZIP/.DAT files stay outside git and are reduced to suburb-level
// counts before the app reads them.
