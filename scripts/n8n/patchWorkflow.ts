/**
 * patchWorkflow.ts
 *
 * Safely applies a JSON patch file to an n8n workflow.
 *
 * SAFETY PROTOCOL — always run in this order:
 *   1. npm run n8n:list           → find the workflow ID
 *   2. npm run n8n:get -- <id>    → inspect nodes
 *   3. npm run n8n:get -- <id> --save  → save snapshot to edit
 *   4. Edit scripts/n8n/snapshots/<id>.json
 *   5. npm run n8n:patch -- <id> scripts/n8n/snapshots/<id>.json --dry-run
 *      → shows diff without writing
 *   6. npm run n8n:patch -- <id> scripts/n8n/snapshots/<id>.json
 *      → applies update after you confirm
 *
 * The script ALWAYS:
 *   - Re-fetches the live workflow immediately before update
 *   - Shows a node-level diff (added/removed/changed nodes)
 *   - Requires --confirm flag to actually write (or --dry-run to skip)
 *
 * Run:
 *   npm run n8n:patch -- <id> <patch-file.json> [--dry-run] [--confirm]
 */

import fs from "fs";
import path from "path";
import { getWorkflow, updateWorkflow, N8nWorkflow, N8nNode } from "./client";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--") && !a.includes("/") && !a.includes("\\"));
const patchFile = args.find((a) => !a.startsWith("--") && a !== id);
const isDryRun = args.includes("--dry-run");
const isConfirmed = args.includes("--confirm");

if (!id || !patchFile) {
  console.error(
    "Usage: npm run n8n:patch -- <workflow-id> <patch-file.json> [--dry-run] [--confirm]"
  );
  process.exit(1);
}

function nodeKey(node: N8nNode): string {
  return `${node.id}::${node.name}::${node.type}`;
}

function diffNodes(before: N8nNode[], after: N8nNode[]): void {
  const beforeMap = new Map(before.map((n) => [n.id, n]));
  const afterMap = new Map(after.map((n) => [n.id, n]));

  const added = after.filter((n) => !beforeMap.has(n.id));
  const removed = before.filter((n) => !afterMap.has(n.id));
  const changed = after.filter((n) => {
    const orig = beforeMap.get(n.id);
    if (!orig) return false;
    return JSON.stringify(orig) !== JSON.stringify(n);
  });

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    console.log("  (no node-level changes detected)");
    return;
  }

  for (const n of added) {
    console.log(`  + ADDED    ${n.name} (${n.type})`);
  }
  for (const n of removed) {
    console.log(`  - REMOVED  ${n.name} (${n.type})`);
  }
  for (const n of changed) {
    const orig = beforeMap.get(n.id)!;
    console.log(`  ~ CHANGED  ${n.name} (${n.type})`);
    // Show parameter-level changes
    const allKeys = new Set([
      ...Object.keys(orig.parameters),
      ...Object.keys(n.parameters),
    ]);
    for (const key of allKeys) {
      const vBefore = JSON.stringify(orig.parameters[key]);
      const vAfter = JSON.stringify(n.parameters[key]);
      if (vBefore !== vAfter) {
        console.log(`      param "${key}":`);
        console.log(`        before: ${vBefore}`);
        console.log(`        after:  ${vAfter}`);
      }
    }
  }
}

async function run() {
  const patchPath = path.resolve(patchFile!);
  if (!fs.existsSync(patchPath)) {
    console.error(`Patch file not found: ${patchPath}`);
    process.exit(1);
  }

  const patch: N8nWorkflow = JSON.parse(fs.readFileSync(patchPath, "utf8"));

  if (patch.id !== id) {
    console.error(
      `ID mismatch: patch file has id="${patch.id}" but you passed "${id}"`
    );
    console.error("Double-check you are patching the right workflow.");
    process.exit(1);
  }

  // Always re-fetch live state immediately before diffing
  console.log(`\nFetching live workflow: ${id}`);
  const live = await getWorkflow(id);

  console.log(`\nWorkflow: "${live.name}" (${live.id})`);
  console.log(`Active:   ${live.active ? "✓ yes" : "no"}`);
  console.log(`Nodes (live):  ${live.nodes.length}`);
  console.log(`Nodes (patch): ${patch.nodes.length}`);

  console.log("\n── Node diff ────────────────────────────────────────────────────");
  diffNodes(live.nodes, patch.nodes);

  if (isDryRun) {
    console.log("\n[dry-run] No changes written. Remove --dry-run and add --confirm to apply.");
    return;
  }

  if (!isConfirmed) {
    console.log(
      "\n⚠  To apply these changes, re-run with --confirm:\n" +
        `   npm run n8n:patch -- ${id} ${patchFile} --confirm`
    );
    return;
  }

  console.log("\nApplying update...");
  const updated = await updateWorkflow(id, patch);
  console.log(`✓ Workflow "${updated.name}" updated successfully.`);
  console.log(`  Updated at: ${new Date(updated.updatedAt).toLocaleString("en-AU")}`);
}

run().catch((err) => {
  console.error("[patchWorkflow] Error:", err.message ?? err);
  process.exit(1);
});
