/**
 * buildPatch_HmaKowbdGwg5oWVH_joinus_v2.ts
 *
 * Patches the Tradie Signup branch to support the new /joinus form payload:
 *   1. Append 5 column mappings to the Sheets node:
 *        service_area, average_job_value, current_marketing_issue,
 *        source_page, lead_event_id
 *      (Existing 17 mappings + matchingColumns ["tradie_id"] are preserved.)
 *   2. Rewrite the Telegram node text to surface the new application fields.
 *
 * Untouched on purpose:
 *   - META CAPI5 (still uses body.tradie_id as event_id; reads location_based_in,
 *     business_name, trade_type, status — all present in the new payload)
 *   - Hash PII Tradie (still hashes body.email + body.phone — both present)
 *   - Tradie Signup webhook (unchanged)
 *   - Connection graph
 *   - Every other workflow node
 *
 * IDEMPOTENT: re-running this script against an already-patched snapshot is a
 * no-op for the Sheets node (skips rows that already exist) and a deterministic
 * rewrite for the Telegram node.
 *
 * Run:
 *   npm run n8n:get -- HmaKowbdGwg5oWVH --save
 *   ts-node --project scripts/tsconfig.json scripts/n8n/buildPatch_HmaKowbdGwg5oWVH_joinus_v2.ts
 *   npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --dry-run
 *   npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --confirm
 *
 * REQUIRED MANUAL STEP BEFORE --confirm:
 *   Add the 5 new column headers to the rightmost end of the TradieSignups tab
 *   (sheet ID 1830207448 in spreadsheet 1HevPryCuo0RygihMdk1Iz6wZMShG7KdmCHM2UHJurDs):
 *     service_area, average_job_value, current_marketing_issue, source_page, lead_event_id
 *   n8n's appendOrUpdate writes by header name; the headers must exist first.
 */

import fs from "fs";
import path from "path";

const SNAPSHOT = path.resolve(__dirname, "snapshots/HmaKowbdGwg5oWVH.json");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wf: any = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findNode(name: string): any {
  const n = wf.nodes.find((node: { name: string }) => node.name === name);
  if (!n) throw new Error(`Node not found: "${name}"`);
  return n;
}

// ── 1. Sheets — append 5 new column mappings ────────────────────────────

const NEW_SHEET_COLUMNS: { id: string }[] = [
  { id: "service_area" },
  { id: "average_job_value" },
  { id: "current_marketing_issue" },
  { id: "source_page" },
  { id: "lead_event_id" },
];

const sheetsNode = findNode("Append or update row in sheet");
const cols = sheetsNode.parameters.columns;
if (!cols || !Array.isArray(cols.schema) || !cols.value) {
  throw new Error(
    'Sheets node has unexpected shape — expected parameters.columns.{schema[],value{}}',
  );
}

const existingIds = new Set<string>(
  cols.schema.map((c: { id: string }) => c.id),
);

let addedSchema = 0;
let addedMapping = 0;
for (const { id } of NEW_SHEET_COLUMNS) {
  if (!existingIds.has(id)) {
    cols.schema.push({
      id,
      displayName: id,
      required: false,
      defaultMatch: false,
      display: true,
      type: "string",
      canBeUsedToMatch: true,
    });
    addedSchema++;
  }
  if (!cols.value[id]) {
    cols.value[id] =
      `={{ $('Tradie Signup').item.json.body.${id} }}`;
    addedMapping++;
  }
}

console.log(
  `• Sheets: appended ${addedSchema} schema entries, ${addedMapping} mappings (idempotent)`,
);

// ── 2. Telegram — rewrite text to surface new application fields ────────

const telegramNode = findNode("Send a text message5");
const NEW_TELEGRAM_TEXT =
  "=NEW DirectBuild tradie application 🔥\n\n" +
  "Name:           {{ $('Tradie Signup').item.json.body.full_name }}\n" +
  "Business:       {{ $('Tradie Signup').item.json.body.business_name }}\n" +
  "Trade:          {{ $('Tradie Signup').item.json.body.trade_type }}\n" +
  "Service area:   {{ $('Tradie Signup').item.json.body.service_area }}\n" +
  "Avg job value:  {{ $('Tradie Signup').item.json.body.average_job_value }}\n" +
  "Capacity:       {{ $('Tradie Signup').item.json.body.capacity_per_month }}\n" +
  "24h response:   {{ $('Tradie Signup').item.json.body.can_respond_24h }}\n" +
  "Phone:          {{ $('Tradie Signup').item.json.body.phone }}\n" +
  "Email:          {{ $('Tradie Signup').item.json.body.email }}\n" +
  "Website:        {{ $('Tradie Signup').item.json.body.website }}\n\n" +
  "Marketing issue:\n" +
  "{{ $('Tradie Signup').item.json.body.current_marketing_issue }}\n\n" +
  "Tradie ID: {{ $('Tradie Signup').item.json.body.tradie_id }}";

if (telegramNode.parameters.text === NEW_TELEGRAM_TEXT) {
  console.log("• Telegram: text already up to date (no change)");
} else {
  telegramNode.parameters.text = NEW_TELEGRAM_TEXT;
  console.log("• Telegram: text replaced with new application format");
}

// ── 3. META CAPI5 — intentionally untouched ─────────────────────────────

console.log("• META CAPI5: intentionally untouched (compatible with new payload)");

// ── Write patched snapshot ──────────────────────────────────────────────

fs.writeFileSync(SNAPSHOT, JSON.stringify(wf, null, 2), "utf8");
console.log(
  "\n✓ Snapshot patched. Next:",
  "\n  npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --dry-run",
);
