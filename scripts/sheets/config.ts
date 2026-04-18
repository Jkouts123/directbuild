import dotenv from "dotenv";
import path from "path";

// Load .env.local from the project root (two levels up from scripts/sheets/)
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

export const SPREADSHEET_ID = process.env.DIRECTBUILD_SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  throw new Error(
    "DIRECTBUILD_SPREADSHEET_ID is not set — add it to .env.local"
  );
}

// Tab names — must match the actual Google Sheet tab names exactly
export const TABS = {
  LANDSCAPING: "Landscaping",
  ROOFING: "Roofing",
  SOLAR: "Solar",
  HVAC: "HVAC",
  GRANNYFLATS: "Grannyflat",
  TRADIES: "TradieSignups",
  ASSIGNMENTS: "Assignments",
} as const;

// Target column headers from CURRENT_SHEETS_SCHEMA.md
export const LEAD_COLUMNS = [
  "lead_id",
  "name",
  "phone",
  "email",
  "job_scope",
  "suburb",
  "timeline",
  "ideal_budget",
  "estimated_cost_range",
  "budget_confirmed",
  "ownership_status",
  "submitted_at",
  "vertical",
  "source_page",
  "campaign_name",
  "notes",
  "contacted_status",
  "assigned_tradie_id",
  "assigned_tradie_name",
  "quote_status",
  "final_job_value",
];

export const TRADIE_COLUMNS = [
  "tradie_id",
  "full_name",
  "business",
  "service_type",
  "jobs_can_handle",
  "location_based",
  "locations_serviced",
  "phone_number",
  "email",
  "abn",
  "website",
  "years_in_business",
  "status",
  "joined_at",
  "notes",
];

export const ASSIGNMENT_COLUMNS = [
  "assignment_id",
  "lead_id",
  "vertical",
  "lead_name",
  "lead_phone",
  "suburb",
  "tradie_id",
  "tradie_name",
  "business_name",
  "assigned_at",
  "assigned_by",
  "assignment_status",
  "tradie_contacted",
  "quote_low",
  "quote_high",
  "quoted_at",
  "outcome",
  "final_job_value",
  "commission_due",
  "notes",
];
