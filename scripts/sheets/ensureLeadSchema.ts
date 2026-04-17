/**
 * ensureLeadSchema.ts
 *
 * Reads the current header row on the Leads tab.
 * Appends any columns from the target schema that are missing.
 * Never reorders or removes existing columns.
 * Safe to run repeatedly.
 */

import { google } from "googleapis";
import { auth } from "./auth";
import { SPREADSHEET_ID, TABS, LEAD_COLUMNS } from "./config";

async function run() {
  const sheets = google.sheets({ version: "v4", auth });

  // Read row 1 (headers)
  const headerRange = `${TABS.LEADS}!1:1`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: headerRange,
  });

  const existingHeaders: string[] = res.data.values?.[0] ?? [];
  console.log(`[Leads] Existing headers (${existingHeaders.length}):`, existingHeaders);

  const missing = LEAD_COLUMNS.filter((col) => !existingHeaders.includes(col));

  if (missing.length === 0) {
    console.log("[Leads] Schema is already up to date. Nothing to add.");
    return;
  }

  console.log(`[Leads] Adding ${missing.length} missing column(s):`, missing);

  // Append missing headers after the last existing column
  const startColIndex = existingHeaders.length; // 0-based
  const startColLetter = colIndexToLetter(startColIndex);
  const endColLetter = colIndexToLetter(startColIndex + missing.length - 1);
  const writeRange = `${TABS.LEADS}!${startColLetter}1:${endColLetter}1`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: writeRange,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  console.log(`[Leads] Done — headers written to ${writeRange}`);
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

run().catch((err) => {
  console.error("[Leads] Error:", err.message ?? err);
  process.exit(1);
});
