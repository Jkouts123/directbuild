import { NextResponse } from "next/server";

// Server-side proxy that forwards Ferguson's Landscapes questionnaire
// submissions to the n8n webhook configured via the
// N8N_WEBHOOK_FERGUSONS env var. The webhook URL is never exposed
// to the browser.
//
// This endpoint deliberately never returns a 5xx — the user-facing quote
// result must show even when n8n is unreachable. All failure modes return
// JSON with status 200 and an `error` field for observability.

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[fergusons-lead] invalid JSON body:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 200 },
    );
  }

  const webhookUrl = process.env.N8N_WEBHOOK_FERGUSONS;
  if (!webhookUrl) {
    console.error(
      "[fergusons-lead] N8N_WEBHOOK_FERGUSONS is not configured",
    );
    return NextResponse.json(
      { ok: false, error: "N8N_WEBHOOK_FERGUSONS is not configured" },
      { status: 200 },
    );
  }

  const base =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const forwarded = {
    ...base,
    server_received_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwarded),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[fergusons-lead] n8n webhook failed:",
        res.status,
        text,
      );
      return NextResponse.json(
        { ok: false, error: "n8n webhook failed" },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fergusons-lead] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "lead notification failed" },
      { status: 200 },
    );
  }
}
