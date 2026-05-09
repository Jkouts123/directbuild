import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

type PropertyTurnoverSignal = "low" | "moderate" | "strong";

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

type SupabaseSuburbSummaryRow = {
  suburb: string;
  state: "NSW";
  sales_count: number;
  median_sale_price: number | null;
  earliest_contract_date: string | null;
  latest_contract_date: string | null;
  earliest_settlement_date: string | null;
  latest_settlement_date: string | null;
  property_turnover_signal: PropertyTurnoverSignal;
  sample_size: number;
  generated_at: string;
  data_basis: string;
};

const CACHE_PATH = path.resolve(
  process.cwd(),
  "data-cache/nsw-property-sales-summary.json",
);
const BATCH_SIZE = 500;

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

function requireEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value =
    name === "SUPABASE_URL"
      ? process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env[name];
  if (!value) {
    throw new Error(`${name} is required to upload NSW property sales cache.`);
  }

  return value;
}

function readCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    throw new Error(
      `Cache file not found: ${CACHE_PATH}. Build it before uploading.`,
    );
  }

  return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as NswPropertySalesCache;
}

function nullableDate(value: string) {
  return value || null;
}

function nullablePrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function mapCacheToRows(cache: NswPropertySalesCache): SupabaseSuburbSummaryRow[] {
  return Object.entries(cache.suburbs).map(([suburb, summary]) => ({
    suburb: suburb.trim().toUpperCase(),
    state: "NSW",
    sales_count: summary.salesCount,
    median_sale_price: nullablePrice(summary.medianSalePrice),
    earliest_contract_date: nullableDate(summary.earliestContractDate),
    latest_contract_date: nullableDate(summary.latestContractDate),
    earliest_settlement_date: nullableDate(summary.earliestSettlementDate),
    latest_settlement_date: nullableDate(summary.latestSettlementDate),
    property_turnover_signal: summary.propertyTurnoverSignal,
    sample_size: summary.sampleSize,
    generated_at: cache.generatedAt,
    data_basis: cache.dataBasis,
  }));
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const cache = readCache();
  const rows = mapCacheToRows(cache);

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const { error } = await supabase
      .from("nsw_property_sales_suburb_summary")
      .upsert(batch, { onConflict: "suburb" });

    if (error) {
      throw new Error(
        `Supabase upsert failed for rows ${index + 1}-${index + batch.length}: ${error.message}`,
      );
    }
  }

  console.log("NSW property sales cache uploaded to Supabase");
  console.log("--------------------------------------------");
  console.log(`Cache file: ${CACHE_PATH}`);
  console.log(`Rows uploaded: ${rows.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
