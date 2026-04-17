/**
 * Stable ID utilities — shared across homeowner and tradie flows.
 *
 * IDs are generated once before any downstream calls (Supabase, n8n, Sheets)
 * so every system references the same ID for the same record.
 */

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export function generateLeadId(): string {
  return `LEAD-${Date.now()}-${randomSuffix()}`;
}

export function generateTradieId(): string {
  return `TRD-${Date.now()}-${randomSuffix()}`;
}
