import { NextResponse } from "next/server";

// Sandbox-only endpoint.
// - Validates required fields
// - Requires verified_phone === true
// - Logs server-side
// - Returns { ok: true } on success
// Deliberately NOT wired to n8n / Sheets / Telegram / Meta CAPI / Stripe /
// Supabase. Production wiring lands when the design is approved.

interface Payload {
  full_name?: unknown;
  business_name?: unknown;
  trade_type?: unknown;
  service_area?: unknown;
  website?: unknown;
  average_job_value?: unknown;
  capacity_per_month?: unknown;
  can_respond_24h?: unknown;
  current_marketing_issue?: unknown;
  phone?: unknown;
  verified_phone?: unknown;
}

function isNonEmptyString(v: unknown, min = 1): v is string {
  return typeof v === "string" && v.trim().length >= min;
}

const REQUIRED_STRING_FIELDS = [
  "full_name",
  "business_name",
  "trade_type",
  "service_area",
  "average_job_value",
  "capacity_per_month",
  "can_respond_24h",
  "phone",
] as const;

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const missing = REQUIRED_STRING_FIELDS.filter(
    (f) => !isNonEmptyString(body[f], 1),
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  if (body.verified_phone !== true) {
    return NextResponse.json(
      {
        ok: false,
        error: "Phone verification is required before submitting.",
      },
      { status: 400 },
    );
  }

  // Optional fields — if present must be strings.
  if (
    body.website !== undefined &&
    body.website !== "" &&
    typeof body.website !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid website value" },
      { status: 400 },
    );
  }
  if (
    body.current_marketing_issue !== undefined &&
    typeof body.current_marketing_issue !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid current_marketing_issue value" },
      { status: 400 },
    );
  }

  const submission = {
    full_name: String(body.full_name).trim(),
    business_name: String(body.business_name).trim(),
    trade_type: String(body.trade_type).trim(),
    service_area: String(body.service_area).trim(),
    website:
      typeof body.website === "string" ? body.website.trim() : "",
    average_job_value: String(body.average_job_value).trim(),
    capacity_per_month: String(body.capacity_per_month).trim(),
    can_respond_24h: String(body.can_respond_24h).trim(),
    current_marketing_issue:
      typeof body.current_marketing_issue === "string"
        ? body.current_marketing_issue.trim()
        : "",
    phone: String(body.phone).trim(),
    verified_phone: true,
    received_at: new Date().toISOString(),
  };

  console.log(
    "[sandbox/joinus-waitlist] submission:",
    JSON.stringify(submission),
  );

  return NextResponse.json({ ok: true });
}
