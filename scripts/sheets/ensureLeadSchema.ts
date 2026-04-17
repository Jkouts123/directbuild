/**
 * ensureLeadSchema.ts
 *
 * Loops through every lead tab (Landscaping, Roofing, Solar, HVAC, Grannyflat)
 * and ensures all LEAD_COLUMNS headers exist on each one.
 * Missing headers are appended after the last existing column.
 * Existing headers are never reordered or removed.
 * Safe to run repeatedly — idempotent.
 */

import { google } from "googleapis";
import { auth } from "./auth";
import { SPREADSHEET_ID, TABS, LEAD_COLUMNS } from "./config";

// All tabs that hold homeowner leads — each gets the same LEAD_COLUMNS schema
const LEAD_TABS = [
  TABS.LANDSCAPING,
  TABS.ROOFING,
  TABS.SOLAR,
  TABS.HVAC,
  TABS.GRANNYFLATS,
] as const;

function colIndexToLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

async function ensureTabSchema(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string
) {
  const tag = `[${tabName}]`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!1:1`,
  });

  const existingHeaders: string[] = res.data.values?.[0] ?? [];
  console.log(`${tag} Existing headers (${existingHeaders.length}):`, existingHeaders);

  const missing = LEAD_COLUMNS.filter((col) => !existingHeaders.includes(col));

  if (missing.length === 0) {
    console.log(`${tag} Schema is already up to date. Nothing to add.`);
    return;
  }

  console.log(`${tag} Adding ${missing.length} missing column(s):`, missing);

  const startColIndex = existingHeaders.length;
  const startColLetter = colIndexToLetter(startColIndex);
  const endColLetter = colIndexToLetter(startColIndex + missing.length - 1);
  const writeRange = `${tabName}!${startColLetter}1:${endColLetter}1`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: writeRange,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  console.log(`${tag} Done — headers written to ${writeRange}`);
}

async function run() {
  const sheets = google.sheets({ version: "v4", auth });

  for (const tabName of LEAD_TABS) {
    await ensureTabSchema(sheets, tabName);
    console.log("");
  }

  console.log("ensureLeadSchema complete.");
}

run().catch((err) => {
  console.error("[ensureLeadSchema] Error:", err.message ?? err);
  process.exit(1);
});
