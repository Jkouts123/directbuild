type NswPropertySalesSignalsInput = {
  serviceArea: string;
};

export type NswPropertySalesSignalsResult = {
  source: "nsw_property_sales";
  status: "success" | "error" | "unavailable";
  serviceArea: string;
  summary: {
    propertyTurnoverSignal: "low" | "moderate" | "strong" | "pending";
    recentSalesCount?: number;
    medianSalePrice?: number;
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

const NSW_VALUER_GENERAL_BULK_PSI_URL =
  "https://www.valuergeneral.nsw.gov.au/design/bulk_psi_content/bulk_psi";

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
  if (count >= 100) return "strong";
  if (count >= 30) return "moderate";
  return "low";
}

function extractPsiZipUrls(html: string) {
  const urls = new Set<string>();
  const regex =
    /https:\/\/www\.valuergeneral\.nsw\.gov\.au\/__psi\/(?:weekly|yearly)\/[0-9]+\.zip/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    urls.add(match[0]);
  }

  return [...urls];
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

  try {
    const response = await fetch(NSW_VALUER_GENERAL_BULK_PSI_URL, {
      headers: { Accept: "text/html" },
    });
    const html = await response.text().catch(() => "");
    const psiZipUrls = response.ok ? extractPsiZipUrls(html) : [];
    const latestWeeklyUrl = psiZipUrls.find((url) => url.includes("/weekly/"));

    if (!response.ok) {
      return buildResult(
        "unavailable",
        serviceArea,
        [
          "Official NSW Valuer General bulk PSI page was checked, but it was not reachable in this request.",
          "Parser and aggregation utilities are available for official Valuer General .DAT files once a scheduled download/cache step is added.",
          `Valuer General bulk PSI access should be reviewed at ${NSW_VALUER_GENERAL_BULK_PSI_URL}.`,
          "Unavailable property-sales data should be treated as pending, not as low property turnover.",
        ],
        `NSW Valuer General bulk PSI request returned ${response.status}.`,
      );
    }

    return buildResult("unavailable", serviceArea, [
      `Official NSW Valuer General bulk PSI page is reachable and ${psiZipUrls.length} ZIP link${psiZipUrls.length === 1 ? " was" : "s were"} discovered.`,
      latestWeeklyUrl
        ? `Latest discovered weekly PSI ZIP: ${latestWeeklyUrl}.`
        : "No weekly PSI ZIP URL was discovered in this request.",
      "Parser and aggregation utilities are available for official Valuer General .DAT files once a scheduled download/cache step is added.",
      "A future implementation should use official Valuer General PSI data or another licensed official feed, then aggregate recent sales count and median price by mapped service area.",
      "Unavailable property-sales data should be treated as pending, not as low property turnover.",
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

// TODO: Connect official NSW property-sales data when a clean access path is
// available.
// Required official source:
// - NSW Valuer General Property Sales Information (PSI), official bulk/licensed
//   access, or an official NSW data endpoint that allows suburb/service-area
//   aggregation.
// Current foundation:
// - parseNswPsiDat parses official 2001-current .DAT sale rows (B records).
// - aggregateNswPropertySalesRows calculates matched sale count, median sale
//   price and a turnover signal for already-downloaded official PSI rows.
// - next step is a scheduled job/cache that downloads weekly/yearly ZIP files
//   from the official Valuer General bulk PSI page, extracts .DAT files, parses
//   B records, and stores a queryable service-area index.
// Required fields:
// - recent sales count over a defined window
// - median sale price for residential property
// - property type where available, so non-residential sales can be excluded
// - service-area/suburb mapping confidence
// Report value:
// - helps DirectBuild understand residential turnover and likely homeowner
//   decision activity before activation.
// Important:
// - if sales data is unavailable, gated, bulk-only, or unmapped, do not treat it
//   as low demand. Keep it pending/unavailable until real official data is
//   returned.
