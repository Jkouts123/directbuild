/**
 * backfillIds.ts
 *
 * Backfills lead_id on the Leads tab and tradie_id on the Tradies tab
 * for any row that has data but an empty ID field.
 *
 * Rules:
 * - Only writes to rows where the ID column is blank.
 * - Never overwrites an existing ID.
 * - Never touches the header row.
 * - Stops at the first fully empty row (no name/phone data).
 *
 * Run: npm run sheets:backfill-ids
 */

import { google } from "googleapis";
import { auth } from "./auth";
import { SPREADSHEET_ID, TABS } from "./config";

// Generates a stable ID in the same format as lib/utils/ids.ts
function generateLeadId(): string {
  return `LEAD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function generateTradieId(): string {
  return `TRD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function backfillTab(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string,
  idColumn: string,
  idGenerator: () => string,
  // Column name used to detect if a row has real data (skip fully blank rows)
  dataColumn: string
) {
  console.log(`\n[${tabName}] Starting backfill...`);

  // Read everything from the tab
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}`,
  });

  const rows: string[][] = (res.data.values ?? []) as string[][];
  if (rows.length < 2) {
    console.log(`[${tabName}] No data rows found. Nothing to backfill.`);
    return;
  }

  const headers = rows[0];
  const idColIndex = headers.indexOf(idColumn);
  const dataColIndex = headers.indexOf(dataColumn);

  if (idColIndex === -1) {
    console.error(`[${tabName}] Column "${idColumn}" not found in headers. Run ensure-schema first.`);
    return;
  }
  if (dataColIndex === -1) {
    console.error(`[${tabName}] Anchor column "${dataColumn}" not found in headers.`);
    return;
  }

  const updates: { range: string; value: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const hasData = (row[dataColIndex] ?? "").trim().length > 0;
    if (!hasData) continue; // skip empty rows

    const existingId = (row[idColIndex] ?? "").trim();
    if (existingId.length > 0) continue; // already has an ID

    const newId = idGenerator();
    const cellAddress = `${tabName}!${colIndexToLetter(idColIndex)}${i + 1}`;
    updates.push({ range: cellAddress, value: newId });
  }

  if (updates.length === 0) {
    console.log(`[${tabName}] All rows already have IDs. Nothing to do.`);
    return;
  }

  console.log(`[${tabName}] Backfilling ${updates.length} row(s)...`);

  // Batch update all cells at once
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: updates.map(({ range, value }) => ({
        range,
        values: [[value]],
      })),
    },
  });

  console.log(`[${tabName}] Done — ${updates.length} ID(s) written.`);
}

function colIndexToLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

async function run() {
  const sheets = google.sheets({ version: "v4", auth });

  await backfillTab(sheets, TABS.LEADS, "lead_id", generateLeadId, "name");
  await backfillTab(sheets, TABS.TRADIES, "tradie_id", generateTradieId, "full_name");

  console.log("\n[backfillIds] Complete.");
}

run().catch((err) => {
  console.error("[backfillIds] Error:", err.message ?? err);
  process.exit(1);
});
