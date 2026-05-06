import fs from "fs";
import path from "path";
import {
  aggregateNswPropertySalesRows,
  parseNswPsiDat,
  type NswPsiSaleRow,
} from "../lib/data-sources/nswPropertySales";

function usage() {
  console.log(
    "Usage: ts-node --project scripts/tsconfig.json scripts/test-nsw-property-sales.ts <DAT file or folder> [SUBURB]",
  );
}

function collectDatFiles(targetPath: string): string[] {
  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    return targetPath.toLowerCase().endsWith(".dat") ? [targetPath] : [];
  }

  if (!stats.isDirectory()) return [];

  return fs
    .readdirSync(targetPath)
    .filter((entry) => entry.toLowerCase().endsWith(".dat"))
    .map((entry) => path.join(targetPath, entry));
}

function formatCurrency(value: number | null) {
  if (value === null) return "n/a";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function describeSale(row: NswPsiSaleRow) {
  const address = [row.unitNumber, row.houseNumber, row.streetName]
    .filter(Boolean)
    .join(" ");

  return {
    suburb: row.suburb || "",
    address,
    postcode: row.postcode || "",
    contractDate: row.contractDate || "",
    settlementDate: row.settlementDate || "",
    purchasePrice: formatCurrency(row.purchasePrice || null),
    zoneCode: row.zoneCode || "",
    primaryPurpose: row.primaryPurpose || "",
  };
}

function main() {
  const [, , inputPath, suburbArg] = process.argv;

  if (!inputPath) {
    usage();
    process.exitCode = 1;
    return;
  }

  const resolvedPath = path.resolve(inputPath);
  const serviceArea = (suburbArg || "PENRITH").trim().toUpperCase();
  const datFiles = collectDatFiles(resolvedPath);

  if (datFiles.length === 0) {
    console.error(`No .DAT files found at ${resolvedPath}`);
    process.exitCode = 1;
    return;
  }

  const rows = datFiles.flatMap((file) => {
    const content = fs.readFileSync(file, "utf8");
    return parseNswPsiDat(content);
  });
  const aggregate = aggregateNswPropertySalesRows({
    rows,
    serviceArea,
  });
  const matchedRows = rows.filter(
    (row) => (row.suburb || "").trim().toUpperCase() === serviceArea,
  );

  console.log("NSW Valuer General PSI parser test");
  console.log("----------------------------------");
  console.log(`Input path: ${resolvedPath}`);
  console.log(`DAT files parsed: ${datFiles.length}`);
  console.log(`Service area: ${serviceArea}`);
  console.log(`Parsed rows: ${rows.length}`);
  console.log(`Matched suburb rows: ${matchedRows.length}`);
  console.log(`Recent sales count: ${aggregate.matchedSalesCount}`);
  console.log(`Median sale price: ${formatCurrency(aggregate.medianSalePrice)}`);
  console.log(`Property turnover signal: ${aggregate.propertyTurnoverSignal}`);
  console.log("");
  console.log("First 3 matched examples:");
  console.log(JSON.stringify(matchedRows.slice(0, 3).map(describeSale), null, 2));
}

main();
