import fs from "fs";
import path from "path";
import { parseNswPsiDat, type NswPsiSaleRow } from "../lib/data-sources/nswPropertySales";

type PropertyTurnoverSignal = "low" | "moderate" | "strong";

type SuburbAccumulator = {
  salesCount: number;
  salePrices: number[];
  contractDates: string[];
  settlementDates: string[];
};

type SuburbSummary = {
  salesCount: number;
  medianSalePrice: number;
  earliestContractDate: string;
  latestContractDate: string;
  earliestSettlementDate: string;
  latestSettlementDate: string;
  propertyTurnoverSignal: PropertyTurnoverSignal;
  sampleSize: number;
};

type NswPropertySalesCache = {
  source: "nsw_property_sales";
  generatedAt: string;
  dataBasis: string;
  suburbs: Record<string, SuburbSummary>;
};

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "data-cache/nsw-property-sales-summary.json",
);
const DATA_BASIS =
  "Official NSW Valuer General Property Sales Information .DAT files parsed locally. This reflects property sales records, not guaranteed renovation demand.";

function usage() {
  console.log(
    "Usage: ts-node --project scripts/tsconfig.json scripts/build-nsw-property-sales-cache.ts <folder containing extracted NSW PSI .DAT files>",
  );
}

function collectDatFiles(targetPath: string): string[] {
  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    return targetPath.toLowerCase().endsWith(".dat") ? [targetPath] : [];
  }

  if (!stats.isDirectory()) return [];

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) return collectDatFiles(entryPath);
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".dat")) {
        return [entryPath];
      }

      return [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function normaliseSuburb(value?: string) {
  return (value || "").trim().toUpperCase().replace(/\s+/g, " ");
}

function median(values: number[]) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function firstDate(dates: string[]) {
  return [...dates].sort((a, b) => a.localeCompare(b))[0] || "";
}

function lastDate(dates: string[]) {
  const sorted = [...dates].sort((a, b) => a.localeCompare(b));
  return sorted[sorted.length - 1] || "";
}

function getTurnoverSignal(salesCount: number): PropertyTurnoverSignal {
  if (salesCount >= 21) return "strong";
  if (salesCount >= 6) return "moderate";
  return "low";
}

function addRow(accumulators: Map<string, SuburbAccumulator>, row: NswPsiSaleRow) {
  const suburb = normaliseSuburb(row.suburb);
  if (!suburb) return;

  const accumulator =
    accumulators.get(suburb) ||
    ({
      salesCount: 0,
      salePrices: [],
      contractDates: [],
      settlementDates: [],
    } satisfies SuburbAccumulator);

  accumulator.salesCount += 1;
  if (typeof row.purchasePrice === "number") {
    accumulator.salePrices.push(row.purchasePrice);
  }
  if (row.contractDate) accumulator.contractDates.push(row.contractDate);
  if (row.settlementDate) accumulator.settlementDates.push(row.settlementDate);

  accumulators.set(suburb, accumulator);
}

function buildCache(rows: NswPsiSaleRow[]): NswPropertySalesCache {
  const accumulators = new Map<string, SuburbAccumulator>();

  for (const row of rows) {
    addRow(accumulators, row);
  }

  const suburbs = [...accumulators.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<Record<string, SuburbSummary>>((result, [suburb, accumulator]) => {
      result[suburb] = {
        salesCount: accumulator.salesCount,
        medianSalePrice: median(accumulator.salePrices),
        earliestContractDate: firstDate(accumulator.contractDates),
        latestContractDate: lastDate(accumulator.contractDates),
        earliestSettlementDate: firstDate(accumulator.settlementDates),
        latestSettlementDate: lastDate(accumulator.settlementDates),
        propertyTurnoverSignal: getTurnoverSignal(accumulator.salesCount),
        sampleSize: accumulator.salesCount,
      };

      return result;
    }, {});

  return {
    source: "nsw_property_sales",
    generatedAt: new Date().toISOString(),
    dataBasis: DATA_BASIS,
    suburbs,
  };
}

function main() {
  const [, , inputPath] = process.argv;

  if (!inputPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolvedInputPath = path.resolve(inputPath);

  if (!fs.existsSync(resolvedInputPath)) {
    console.error(`Input path does not exist: ${resolvedInputPath}`);
    process.exitCode = 1;
    return;
  }

  const datFiles = collectDatFiles(resolvedInputPath);

  if (datFiles.length === 0) {
    console.error(`No .DAT files found under ${resolvedInputPath}`);
    process.exitCode = 1;
    return;
  }

  const rows = datFiles.flatMap((file) =>
    parseNswPsiDat(fs.readFileSync(file, "utf8")),
  );
  const cache = buildCache(rows);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");

  console.log("NSW property sales cache built");
  console.log("------------------------------");
  console.log(`Input path: ${resolvedInputPath}`);
  console.log(`DAT files processed: ${datFiles.length}`);
  console.log(`Parsed sale rows: ${rows.length}`);
  console.log(`Suburbs cached: ${Object.keys(cache.suburbs).length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main();
