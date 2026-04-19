/**
 * client.ts — typed n8n REST API v1 wrapper
 *
 * Provides GET, PUT helpers with consistent error handling.
 * All methods throw on non-2xx responses so callers get a clear error.
 */

import { N8N_API, AUTH_HEADERS } from "./config";

// Minimal types for the fields we actually use
export interface N8nWorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, unknown>;
  position: [number, number];
}

export interface N8nWorkflow extends N8nWorkflowSummary {
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  settings: Record<string, unknown>;
  staticData: unknown;
  tags: unknown[];
}

export interface N8nListResponse {
  data: N8nWorkflowSummary[];
  nextCursor: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${N8N_API}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...AUTH_HEADERS, ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`n8n API ${init?.method ?? "GET"} ${url} → ${res.status} ${res.statusText}\n${body}`);
  }

  return res.json() as Promise<T>;
}

// ── API Methods ───────────────────────────────────────────────────────

/** List all workflows (paginated, fetches all pages). */
export async function listWorkflows(): Promise<N8nWorkflowSummary[]> {
  const results: N8nWorkflowSummary[] = [];
  let cursor: string | null = null;

  do {
    const qs: string = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const page: N8nListResponse = await apiFetch<N8nListResponse>(`/workflows${qs}`);
    results.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor);

  return results;
}

/** Fetch a single workflow by its exact numeric/string ID. */
export async function getWorkflow(id: string): Promise<N8nWorkflow> {
  return apiFetch<N8nWorkflow>(`/workflows/${id}`);
}

/**
 * Update a workflow by ID.
 * n8n's PUT endpoint only accepts a subset of the workflow object.
 * Strip read-only / computed properties before sending.
 */
export async function updateWorkflow(id: string, workflow: N8nWorkflow): Promise<N8nWorkflow> {
  // Only send fields accepted by the n8n REST API v1 PUT /workflows/{id} schema.
  // Sending extra properties (shared, pinData, versionId, etc.) causes 400.
  // Strip non-writable properties from settings (API rejects unknown keys)
  const { availableInMCP: _a, timeSavedMode: _t, ...cleanSettings } =
    (workflow.settings ?? {}) as Record<string, unknown>;

  const body = {
    name:        workflow.name,
    nodes:       workflow.nodes,
    connections: workflow.connections,
    settings:    cleanSettings,
    staticData:  workflow.staticData ?? null,
  };
  return apiFetch<N8nWorkflow>(`/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/** Activate a workflow. */
export async function activateWorkflow(id: string): Promise<void> {
  await apiFetch(`/workflows/${id}/activate`, { method: "POST" });
}

/** Deactivate a workflow. */
export async function deactivateWorkflow(id: string): Promise<void> {
  await apiFetch(`/workflows/${id}/deactivate`, { method: "POST" });
}
