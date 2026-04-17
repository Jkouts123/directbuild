/**
 * ensureAssignmentsTab.ts
 *
 * Checks whether an Assignments tab exists in the spreadsheet.
 * - If missing: creates the tab and writes the full header row.
 * - If present: appends any missing headers (same safe logic as other ensure scripts).
 * Safe to run repeatedly.
 */

import { google } from "googleapis";
import { auth } from "./auth";
import { SPREADSHEET_ID, TABS, ASSIGNMENT_COLUMNS } from "./config";

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

  // List all existing sheets
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });

  const existingTitles = (meta.data.sheets ?? []).map(
    (s) => s.properties?.title ?? ""
  );

  console.log("[Assignments] Existing tabs:", existingTitles);

  if (!existingTitles.includes(TABS.ASSIGNMENTS)) {
    // Create the tab
    console.log(`[Assignments] Tab not found — creating "${TABS.ASSIGNMENTS}"...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: TABS.ASSIGNMENTS },
            },
          },
        ],
      },
    });

    // Write all headers to row 1
    const endColLetter = colIndexToLetter(ASSIGNMENT_COLUMNS.length - 1);
    const writeRange = `${TABS.ASSIGNMENTS}!A1:${endColLetter}1`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: writeRange,
      valueInputOption: "RAW",
      requestBody: { values: [ASSIGNMENT_COLUMNS] },
    });

    console.log(`[Assignments] Tab created with ${ASSIGNMENT_COLUMNS.length} headers.`);
    return;
  }

  // Tab exists — check for missing headers
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TABS.ASSIGNMENTS}!1:1`,
  });

  const existingHeaders: string[] = headerRes.data.values?.[0] ?? [];
  console.log(`[Assignments] Existing headers (${existingHeaders.length}):`, existingHeaders);

  const missing = ASSIGNMENT_COLUMNS.filter((col) => !existingHeaders.includes(col));

  if (missing.length === 0) {
    console.log("[Assignments] Schema is already up to date. Nothing to add.");
    return;
  }

  console.log(`[Assignments] Adding ${missing.length} missing column(s):`, missing);

  const startColIndex = existingHeaders.length;
  const startColLetter = colIndexToLetter(startColIndex);
  const endColLetter = colIndexToLetter(startColIndex + missing.length - 1);
  const writeRange = `${TABS.ASSIGNMENTS}!${startColLetter}1:${endColLetter}1`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: writeRange,
    valueInputOption: "RAW",
    requestBody: { values: [missing] },
  });

  console.log(`[Assignments] Done — headers written to ${writeRange}`);
}

run().catch((err) => {
  console.error("[Assignments] Error:", err.message ?? err);
  process.exit(1);
});
