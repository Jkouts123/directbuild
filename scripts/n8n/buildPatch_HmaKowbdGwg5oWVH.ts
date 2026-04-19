/**
 * buildPatch_HmaKowbdGwg5oWVH.ts
 *
 * Patches the MAIN QUOTE GENERATOR snapshot with:
 *
 * 1. All 5 homeowner Google Sheets nodes → new snake_case column mappings
 * 2. Granny Flat Sheets node → correct tab GID (1360660652) + fixed payload paths
 * 3. Tradie Signup Sheets node → full column mapping (was empty {})
 * 4. New Code (hashing) nodes for Solar, HVAC, Granny Flat
 * 5. Updated connections to wire new Code nodes into each chain
 * 6. META CAPI3 (HVAC) body → use hashed values from new Code node
 * 7. META CAPI4 (Granny Flat) body → rewrite old $('Message a model') paths
 *
 * Run: ts-node --project scripts/tsconfig.json scripts/n8n/buildPatch_HmaKowbdGwg5oWVH.ts
 * Then inspect the snapshot and apply via: npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --dry-run
 */

import fs from "fs";
import path from "path";

const SNAPSHOT = path.resolve(__dirname, "snapshots/HmaKowbdGwg5oWVH.json");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wf: any = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));

// ── Helpers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findNode(name: string): any {
  const n = wf.nodes.find((node: { name: string }) => node.name === name);
  if (!n) throw new Error(`Node not found: "${name}"`);
  return n;
}

function schemaCol(id: string) {
  return {
    id,
    displayName: id,
    required: false,
    defaultMatch: false,
    display: true,
    type: "string",
    canBeUsedToMatch: true,
  };
}

// ── Shared hashing Code script ────────────────────────────────────────
// Mirrors the existing "Code in JavaScript" / "Code in JavaScript1" nodes
// but also strips spaces from phone (more robust normalisation).
const HASH_CODE = [
  "const crypto = require('crypto');",
  "",
  "const email     = $input.first().json.body.email?.toLowerCase().trim() || '';",
  "const phone     = $input.first().json.body.phone?.replace(/\\s/g, '') || '';",
  "const name      = $input.first().json.body.name || '';",
  "const firstName = name.split(' ')[0]?.toLowerCase().trim() || '';",
  "const suburb    = $input.first().json.body.suburb || '';",
  "",
  "// Extract 4-digit postcode from suburb string e.g. \"Earlwood NSW 2206\"",
  "const postcodeMatch = suburb.match(/\\d{4}$/);",
  "const postcode = postcodeMatch ? postcodeMatch[0] : '';",
  "",
  "return [{",
  "  json: {",
  "    ...$input.first().json,",
  "    email_hashed: crypto.createHash('sha256').update(email).digest('hex'),",
  "    phone_hashed: crypto.createHash('sha256').update(phone).digest('hex'),",
  "    fn_hashed:    crypto.createHash('sha256').update(firstName).digest('hex'),",
  "    zip_hashed:   crypto.createHash('sha256').update(postcode).digest('hex'),",
  "  }",
  "}];",
].join("\n");

// ── Lead column schema (matches LEAD_COLUMNS in scripts/sheets/config.ts) ────
const LEAD_COLS = [
  "lead_id", "name", "phone", "email", "job_scope", "suburb",
  "timeline", "ideal_budget", "estimated_cost_range", "budget_confirmed",
  "ownership_status", "submitted_at", "vertical", "source_page",
  "campaign_name", "notes", "contacted_status", "assigned_tradie_id",
  "assigned_tradie_name", "quote_status", "final_job_value",
];

function makeLeadColumns(sourceName: string) {
  return {
    mappingMode: "defineBelow",
    value: {
      lead_id:              `={{ $('${sourceName}').item.json.body.lead_id }}`,
      name:                 `={{ $('${sourceName}').item.json.body.name }}`,
      phone:                `={{ $('${sourceName}').item.json.body.phone }}`,
      email:                `={{ $('${sourceName}').item.json.body.email }}`,
      job_scope:            `={{ $('${sourceName}').item.json.body.ai_quote_summary }}`,
      suburb:               `={{ $('${sourceName}').item.json.body.suburb }}`,
      timeline:             "",
      ideal_budget:         "",
      estimated_cost_range: `={{ $('${sourceName}').item.json.body.min_price }} - {{ $('${sourceName}').item.json.body.max_price }}`,
      budget_confirmed:     "",
      ownership_status:     "",
      submitted_at:         `={{ $('${sourceName}').item.json.body.timestamp }}`,
      vertical:             `={{ $('${sourceName}').item.json.body.vertical }}`,
      source_page:          `={{ $('${sourceName}').item.json.body.source_page }}`,
      campaign_name:        "",
      notes:                "",
      contacted_status:     "",
      assigned_tradie_id:   "",
      assigned_tradie_name: "",
      quote_status:         "",
      final_job_value:      "",
    },
    matchingColumns: ["phone"],
    schema: LEAD_COLS.map(schemaCol),
    attemptToConvertTypes: false,
    convertFieldsToString: false,
  };
}

// ── Tradie column schema (matches TRADIE_COLUMNS in scripts/sheets/config.ts) ─
const TRADIE_COLS = [
  "tradie_id", "full_name", "business", "service_type", "jobs_can_handle",
  "location_based", "locations_serviced", "phone_number", "email", "abn",
  "website", "years_in_business", "status", "joined_at", "notes",
];

function makeTradieColumns() {
  return {
    mappingMode: "defineBelow",
    value: {
      tradie_id:          "={{ $json.body.tradie_id }}",
      full_name:          "={{ $json.body.full_name }}",
      business:           "={{ $json.body.business_name }}",
      service_type:       "={{ $json.body.trade_type }}",
      jobs_can_handle:    "",
      location_based:     "={{ $json.body.location_based_in }}",
      locations_serviced: "={{ $json.body.locations_serviced }}",
      phone_number:       "={{ $json.body.phone }}",
      email:              "={{ $json.body.email }}",
      abn:                "={{ $json.body.abn }}",
      website:            "={{ $json.body.website }}",
      years_in_business:  "={{ $json.body.years_in_business }}",
      status:             "={{ $json.body.status }}",
      joined_at:          "={{ $json.body.joined_at }}",
    },
    matchingColumns: ["tradie_id"],
    schema: TRADIE_COLS.map(schemaCol),
    attemptToConvertTypes: false,
    convertFieldsToString: false,
  };
}

// ── 1. Update homeowner Google Sheets column mappings ─────────────────

const landscapingSheet = findNode("Append row in sheet1");
landscapingSheet.parameters.columns = makeLeadColumns("Landscaping");

const solarSheet = findNode("Append row in sheet");
solarSheet.parameters.columns = makeLeadColumns("Solar");

const roofingSheet = findNode("Append or update row in sheet2");
roofingSheet.parameters.columns = makeLeadColumns("Roofing");

const hvacSheet = findNode("Append or update row in sheet3");
hvacSheet.parameters.columns = makeLeadColumns("HVAC");

// ── 2. Fix Granny Flat Sheets node ───────────────────────────────────
// Was pointing to gid=1778581719 (Roofing tab) and using broken old paths.
const grannySheet = findNode("Append or update row in sheet4");
grannySheet.parameters.sheetName = {
  __rl: true,
  value: 1360660652,
  mode: "list",
  cachedResultName: "Grannyflat",
  cachedResultUrl:
    "https://docs.google.com/spreadsheets/d/1HevPryCuo0RygihMdk1Iz6wZMShG7KdmCHM2UHJurDs/edit#gid=1360660652",
};
grannySheet.parameters.operation = "appendOrUpdate";
grannySheet.parameters.columns = makeLeadColumns("Granny Flat");

// ── 3. Fix Tradie Signup Sheets node (was completely empty) ──────────
const tradieSheet = findNode("Append or update row in sheet");
tradieSheet.parameters.columns = makeTradieColumns();

// ── 4. Fix META CAPI3 (HVAC) body — use hashed values ────────────────
// Was sending raw $json.body.email / $json.body.phone unhashedto Meta.
const metaCapi3 = findNode("META CAPI3");
metaCapi3.parameters.jsonBody = JSON.stringify({
  data: [
    {
      event_name: "Lead",
      // eslint-disable-next-line no-template-curly-in-string
      event_time: "={{ Math.floor($now / 1000) }}",
      event_id: "={{ $now + '-' + $('HVAC').item.json.body.phone }}",
      action_source: "website",
      event_source_url: "directbuild.au/hvac",
      user_data: {
        em: ["={{ $json.email_hashed }}"],
        ph: ["={{ $json.phone_hashed }}"],
        fn: "={{ $json.fn_hashed }}",
        zip: "={{ $json.zip_hashed }}",
        client_user_agent: "={{ $('HVAC').item.json.headers['user-agent'] }}",
        client_ip_address: "={{ $('HVAC').item.json.headers['x-real-ip'] }}",
      },
      custom_data: {
        quote_min: "={{ $('HVAC').item.json.body.min_price ?? 0 }}",
        quote_max: "={{ $('HVAC').item.json.body.max_price ?? 0 }}",
        suburb: "={{ $('HVAC').item.json.body.suburb }}",
        job_type: "={{ $('HVAC').item.json.body.service_type }}",
      },
    },
  ],
})
  // n8n uses raw expressions — un-stringify the expression strings so they work
  .replace(/"={{ /g, '={{ ')
  .replace(/ }}"/g, ' }}');

// Actually, n8n stores the body as a raw string with n8n expressions inline.
// Reconstruct it properly as a template literal string:
metaCapi3.parameters.jsonBody =
  `={\n  "data": [\n    {\n      "event_name": "Lead",\n      "event_time": {{ Math.floor($now / 1000) }},\n      "event_id": "{{ $now + '-' + $('HVAC').item.json.body.phone }}",\n      "action_source": "website",\n      "event_source_url": "directbuild.au/hvac",\n      "user_data": {\n        "em": ["{{ $json.email_hashed }}"],\n        "ph": ["{{ $json.phone_hashed }}"],\n        "fn": "{{ $json.fn_hashed }}",\n        "zip": "{{ $json.zip_hashed }}",\n        "client_user_agent": "{{ $('HVAC').item.json.headers['user-agent'] }}",\n        "client_ip_address": "{{ $('HVAC').item.json.headers['x-real-ip'] }}"\n      },\n      "custom_data": {\n        "quote_min": {{ $('HVAC').item.json.body.min_price ?? 0 }},\n        "quote_max": {{ $('HVAC').item.json.body.max_price ?? 0 }},\n        "suburb": "{{ $('HVAC').item.json.body.suburb }}",\n        "job_type": "{{ $('HVAC').item.json.body.service_type }}"\n      }\n    }\n  ]\n}\n`;

// ── 5. Fix META CAPI4 (Granny Flat) body — rewrite broken old paths ──
// Was referencing $('Message a model').* and $('Granny Flat').item.json.body.body.*
const metaCapi4 = findNode("META CAPI4");
metaCapi4.parameters.jsonBody =
  `={\n  "data": [\n    {\n      "event_name": "Lead",\n      "event_time": {{ Math.floor(Date.now() / 1000) }},\n      "event_id": "{{ $('Granny Flat').item.json.body.lead_id }}",\n      "action_source": "website",\n      "event_source_url": "directbuild.au/grannyflats",\n      "user_data": {\n        "em": ["{{ $json.email_hashed }}"],\n        "ph": ["{{ $json.phone_hashed }}"],\n        "fn": "{{ $json.fn_hashed }}",\n        "zip": "{{ $json.zip_hashed }}",\n        "client_ip_address": "{{ $('Granny Flat').item.json.headers['x-real-ip'] }}",\n        "client_user_agent": "{{ $('Granny Flat').item.json.headers['user-agent'] }}"\n      },\n      "custom_data": {\n        "quote_min": {{ $('Granny Flat').item.json.body.min_price ?? 0 }},\n        "quote_max": {{ $('Granny Flat').item.json.body.max_price ?? 0 }},\n        "suburb": "{{ $('Granny Flat').item.json.body.suburb }}",\n        "job_type": "{{ $('Granny Flat').item.json.body.service_type }}"\n      }\n    }\n  ]\n}\n`;

// ── 6. Add new Code (hashing) nodes for Solar, HVAC, Granny Flat ─────

const solarWebhookNode   = findNode("Solar");
const hvacWebhookNode    = findNode("HVAC");
const grannyWebhookNode  = findNode("Granny Flat");

const hashSolar: object = {
  parameters: { jsCode: HASH_CODE },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [solarWebhookNode.position[0] + 144, solarWebhookNode.position[1]],
  id: "aa11bb22-cc33-dd44-ee55-ff6677889900",
  name: "Hash PII Solar",
};

const hashHvac: object = {
  parameters: { jsCode: HASH_CODE },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [hvacWebhookNode.position[0] + 144, hvacWebhookNode.position[1]],
  id: "bb22cc33-dd44-ee55-ff66-778899001122",
  name: "Hash PII HVAC",
};

const hashGranny: object = {
  parameters: { jsCode: HASH_CODE },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [grannyWebhookNode.position[0] + 144, grannyWebhookNode.position[1]],
  id: "cc33dd44-ee55-ff66-7788-99001122aabb",
  name: "Hash PII Granny Flat",
};

wf.nodes.push(hashSolar, hashHvac, hashGranny);

// ── 7. Update connections to wire new Code nodes ──────────────────────
// Solar: Solar → Hash PII Solar → META CAPI1
// (was: Solar → META CAPI1)
wf.connections["Solar"] = {
  main: [[{ node: "Hash PII Solar", type: "main", index: 0 }]],
};
wf.connections["Hash PII Solar"] = {
  main: [[{ node: "META CAPI1", type: "main", index: 0 }]],
};

// HVAC: HVAC → Hash PII HVAC → META CAPI3
// (was: HVAC → META CAPI3)
wf.connections["HVAC"] = {
  main: [[{ node: "Hash PII HVAC", type: "main", index: 0 }]],
};
wf.connections["Hash PII HVAC"] = {
  main: [[{ node: "META CAPI3", type: "main", index: 0 }]],
};

// Granny Flat: Granny Flat → Hash PII Granny Flat → META CAPI4
// (was: Granny Flat → META CAPI4)
wf.connections["Granny Flat"] = {
  main: [[{ node: "Hash PII Granny Flat", type: "main", index: 0 }]],
};
wf.connections["Hash PII Granny Flat"] = {
  main: [[{ node: "META CAPI4", type: "main", index: 0 }]],
};

// ── Write patched snapshot ────────────────────────────────────────────
fs.writeFileSync(SNAPSHOT, JSON.stringify(wf, null, 2), "utf8");
console.log("✓ Snapshot patched. Run dry-run next:");
console.log("  npm run n8n:patch -- HmaKowbdGwg5oWVH scripts/n8n/snapshots/HmaKowbdGwg5oWVH.json --dry-run");
