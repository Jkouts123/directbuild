/**
 * listWorkflows.ts
 *
 * Prints all n8n workflows with their ID, name, and active status.
 * Use this first to find the workflow ID before fetching or patching.
 *
 * Run: npm run n8n:list
 */

import { listWorkflows } from "./client";

async function run() {
  console.log("Fetching workflows from n8n...\n");
  const workflows = await listWorkflows();

  if (workflows.length === 0) {
    console.log("No workflows found.");
    return;
  }

  // Column widths
  const idW = 24;
  const nameW = 45;
  const activeW = 8;

  const header = [
    "ID".padEnd(idW),
    "Name".padEnd(nameW),
    "Active".padEnd(activeW),
    "Updated",
  ].join("  ");

  console.log(header);
  console.log("─".repeat(header.length));

  for (const wf of workflows) {
    const active = wf.active ? "✓ yes" : "  no";
    const updated = new Date(wf.updatedAt).toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(
      [
        wf.id.padEnd(idW),
        wf.name.slice(0, nameW - 1).padEnd(nameW),
        active.padEnd(activeW),
        updated,
      ].join("  ")
    );
  }

  console.log(`\n${workflows.length} workflow(s) total.`);
  console.log('\nTo inspect a workflow: npm run n8n:get -- <id>');
}

run().catch((err) => {
  console.error("[listWorkflows] Error:", err.message ?? err);
  process.exit(1);
});
