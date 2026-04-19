/**
 * getWorkflow.ts
 *
 * Fetches a single workflow by exact ID and prints:
 *   - ID, name, active status
 *   - all nodes (name, type, key parameters)
 *   - optionally writes the full JSON to a file for editing
 *
 * Run:
 *   npm run n8n:get -- <workflow-id>
 *   npm run n8n:get -- <workflow-id> --save   (writes to scripts/n8n/snapshots/<id>.json)
 */

import fs from "fs";
import path from "path";
import { getWorkflow, N8nNode } from "./client";

const [id, flag] = process.argv.slice(2);

if (!id) {
  console.error("Usage: npm run n8n:get -- <workflow-id> [--save]");
  process.exit(1);
}

function summariseNode(node: N8nNode): string {
  const p = node.parameters;
  const extras: string[] = [];

  // Webhook nodes — show the path they listen on
  if (node.type === "n8n-nodes-base.webhook") {
    const httpMethod = (p.httpMethod as string) || "POST";
    const webhookPath = (p.path as string) || "";
    extras.push(`[${httpMethod}] /${webhookPath}`);
  }

  // Google Sheets nodes — show operation + sheet name
  if (node.type === "n8n-nodes-base.googleSheets") {
    const op = (p.operation as string) || (p.resource as string) || "";
    const sheet = (p.sheetName as string) || (p.documentId as string) || "";
    if (op || sheet) extras.push(`op=${op} sheet=${sheet}`);
  }

  // HTTP Request nodes — show method + URL
  if (node.type === "n8n-nodes-base.httpRequest") {
    const method = (p.method as string) || "GET";
    const url = (p.url as string) || "";
    extras.push(`${method} ${url}`);
  }

  // Set nodes — list field names being set
  if (node.type === "n8n-nodes-base.set") {
    const values = (p.values as { string?: { name: string }[] }) || {};
    const fields = (values.string || []).map((v) => v.name).join(", ");
    if (fields) extras.push(`sets: ${fields}`);
  }

  const detail = extras.length ? `  →  ${extras.join(" | ")}` : "";
  return `  ${node.name.padEnd(35)} ${node.type}${detail}`;
}

async function run() {
  console.log(`\nFetching workflow: ${id}\n`);
  const wf = await getWorkflow(id);

  console.log(`ID:      ${wf.id}`);
  console.log(`Name:    ${wf.name}`);
  console.log(`Active:  ${wf.active ? "✓ yes" : "no"}`);
  console.log(`Updated: ${new Date(wf.updatedAt).toLocaleString("en-AU")}`);
  console.log(`Nodes:   ${wf.nodes.length}`);
  console.log("");
  console.log("── Nodes ────────────────────────────────────────────────────────");

  for (const node of wf.nodes) {
    console.log(summariseNode(node));
  }

  if (flag === "--save") {
    const dir = path.resolve(__dirname, "snapshots");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(wf, null, 2), "utf8");
    console.log(`\n✓ Full workflow JSON saved to: scripts/n8n/snapshots/${id}.json`);
    console.log("  Edit that file, then run: npm run n8n:patch -- <id> scripts/n8n/snapshots/<id>.json");
  } else {
    console.log("\nTip: add --save to write the full workflow JSON for editing.");
  }
}

run().catch((err) => {
  console.error("[getWorkflow] Error:", err.message ?? err);
  process.exit(1);
});
