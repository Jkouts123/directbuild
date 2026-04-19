/**
 * buildPatch_HmaKowbdGwg5oWVH_tradie.ts
 *
 * Patches the MAIN QUOTE GENERATOR workflow with:
 *
 * 1. New "Hash PII Tradie" Code node — SHA-256 hashes email + phone from tradie payload
 * 2. Updated META CAPI5 body — uses $json.email_hashed / $json.phone_hashed
 * 3. Updated connections — Tradie Signup → Hash PII Tradie → META CAPI5
 *
 * Run:
 *   npm run n8n:get -- HmaKowbdGwg5oWVH --save    (refresh snapshot first)
 *   ts-node --project scripts/tsconfig.json scripts/n8n/buildPatch_HmaKowbdGwg5oWVH_tradie.ts
 *   npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --dry-run
 *   npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --confirm
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

// ── 1. Add Hash PII Tradie Code node ─────────────────────────────────

const tradieWebhookNode = findNode("Tradie Signup");

const HASH_CODE = [
  "const crypto = require('crypto');",
  "",
  "const email = $input.first().json.body.email?.toLowerCase().trim() || '';",
  "const phone = $input.first().json.body.phone?.replace(/\\s/g, '') || '';",
  "",
  "return [{",
  "  json: {",
  "    ...$input.first().json,",
  "    email_hashed: crypto.createHash('sha256').update(email).digest('hex'),",
  "    phone_hashed: crypto.createHash('sha256').update(phone).digest('hex'),",
  "  }",
  "}];",
].join("\n");

const hashTradie: object = {
  parameters: { jsCode: HASH_CODE },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [tradieWebhookNode.position[0] + 180, tradieWebhookNode.position[1]],
  id: "dd44ee55-ff66-7788-9900-1122aabbcc33",
  name: "Hash PII Tradie",
};

wf.nodes.push(hashTradie);

// ── 2. Update META CAPI5 body — use hashed values ────────────────────
// Replace raw $json.body.email / $json.body.phone with $json.email_hashed / $json.phone_hashed.
// All other references ($json.body.*, $('Tradie Signup').item.json.*) remain valid because
// the Code node spreads ...$input.first().json, preserving the full original payload.

const metaCapi5 = findNode("META CAPI5");
metaCapi5.parameters.jsonBody =
  `={\n  "data": [\n    {\n      "event_name": "Lead",\n      "event_time": {{ Math.floor(Date.now() / 1000) }},\n      "event_id": "{{ $json.body.tradie_id }}",\n      "action_source": "website",\n      "event_source_url": "{{ $json.headers.origin }}",\n      "user_data": {\n        "em": ["{{ $json.email_hashed }}"],\n        "ph": ["{{ $json.phone_hashed }}"],\n        "client_ip_address": "{{ $('Tradie Signup').item.json.headers['x-real-ip'] }}",\n        "client_user_agent": "{{ $('Tradie Signup').item.json.headers['user-agent'] }}"\n      },\n      "custom_data": {\n        "content_name": "Tradie Signup",\n        "content_category": "Contractor Registration",\n        "trade_type": "{{ $json.body.trade_type }}",\n        "business_name": "{{ $json.body.business_name }}",\n        "location_based_in": "{{ $json.body.location_based_in }}",\n        "status": "{{ $json.body.status }}"\n      }\n    }\n  ]\n}\n`;

// ── 3. Update connections ─────────────────────────────────────────────
// Before: Tradie Signup → META CAPI5 → Append or update row in sheet → Telegram
// After:  Tradie Signup → Hash PII Tradie → META CAPI5 → ...

wf.connections["Tradie Signup"] = {
  main: [[{ node: "Hash PII Tradie", type: "main", index: 0 }]],
};
wf.connections["Hash PII Tradie"] = {
  main: [[{ node: "META CAPI5", type: "main", index: 0 }]],
};

// ── Write patched snapshot ────────────────────────────────────────────
fs.writeFileSync(SNAPSHOT, JSON.stringify(wf, null, 2), "utf8");
console.log("✓ Snapshot patched. Run dry-run next:");
console.log("  npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --dry-run");
