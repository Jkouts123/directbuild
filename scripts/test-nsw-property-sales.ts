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

function getDateRange(rows: NswPsiSaleRow[]) {
  const validDates = rows
    .map((row) => row.contractDate)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => a.localeCompare(b));

  return {
    earliestSaleDate: validDates[0] || null,
    latestSaleDate: validDates[validDates.length - 1] || null,
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
  const { earliestSaleDate, latestSaleDate } = getDateRange(matchedRows);

  console.log("NSW Valuer General PSI parser test");
  console.log("----------------------------------");
  console.log(`Input path: ${resolvedPath}`);
  console.log(`DAT files processed: ${datFiles.length}`);
  console.log(`Service area: ${serviceArea}`);
  console.log(`Total parsed rows: ${rows.length}`);
  console.log(`Matched suburb rows: ${matchedRows.length}`);
  console.log(`Recent sales count: ${aggregate.matchedSalesCount}`);
  console.log(`Median sale price: ${formatCurrency(aggregate.medianSalePrice)}`);
  console.log(`Property turnover signal: ${aggregate.propertyTurnoverSignal}`);
  console.log(`Earliest sale date: ${earliestSaleDate || "null"}`);
  console.log(`Latest sale date: ${latestSaleDate || "null"}`);
  console.log("");
  console.log("First 5 matched examples:");
  console.log(JSON.stringify(matchedRows.slice(0, 5).map(describeSale), null, 2));
}

main();
