/**
 * ensureTradiesSchema.ts
 *
 * Reads the current header row on the Tradies tab.
 * Appends any columns from the target schema that are missing.
 * Never reorders or removes existing columns.
 * Safe to run repeatedly.
 */

import { google } from "googleapis";
import { auth } from "./auth";
import { SPREADSHEET_ID, TABS, TRADIE_COLUMNS } from "./config";

async function run() {
  const sheets = google.sheets({ version: "v4", auth });

  const headerRange = `${TABS.TRADIES}!1:1`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: headerRange,
  });

  const existingHeaders: string[] = res.data.values?.[0] ?? [];
  console.log(`[Tradies] Existing headers (${existingHeaders.length}):`, existingHeaders);

  const missing = TRADIE_COLUMNS.filter((col) => !existingHeaders.includes(col));

  if (missing.length === 0) {
    console.log("[Tradies] Schema is already up to date. Nothing to add.");
    return;
  }

  console.log(`[Tradies] Adding ${missing.length} missing column(s):`, missing);

  const startColIndex = existingHeaders.length;
  const startColLetter = colIndexToLetter(startColIndex);
  const endColLetter = colIndexToLetter(startColIndex + missing.length - 1);
  const writeRange = `${TABS.TRADIES}!${startColLetter}1:${endColLetter}1`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: writeRange,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  console.log(`[Tradies] Done — headers written to ${writeRange}`);
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
  console.error("[Tradies] Error:", err.message ?? err);
  process.exit(1);
});
