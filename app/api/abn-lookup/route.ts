import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AbrResult {
  abn: string;
  name: string;
  entityType: string;
  state: string;
  postcode: string;
  status: string;
}

interface AbrNameRow {
  Abn: string;
  Name: string;
  State?: string;
  Postcode?: string;
  AbnStatus?: string;
}

// ABR JSON endpoints always wrap responses in a JSONP callback when the
// `callback` query param is set. We send `callback=callback` then strip
// the wrapper defensively — some mirrors return the wrapper even without it.
function stripJsonp(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[A-Za-z_$][\w$]*\(([\s\S]*)\)\s*;?\s*$/);
  return match ? match[1] : trimmed;
}

async function fetchAbr(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`ABR ${res.status} ${res.statusText}`);
  const text = await res.text();
  return JSON.parse(stripJsonp(text));
}

export async function GET(request: Request) {
  const guid = process.env.ABR_GUID;
  if (!guid) {
    console.error("[abn-lookup] ABR_GUID not configured");
    return NextResponse.json(
      { error: "Lookup unavailable", results: [] },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  const digits = q.replace(/\s/g, "");

  try {
    if (/^\d{11}$/.test(digits)) {
      const url =
        `https://abr.business.gov.au/json/AbnDetails.aspx` +
        `?abn=${digits}` +
        `&guid=${encodeURIComponent(guid)}` +
        `&callback=callback`;
      const json = (await fetchAbr(url)) as {
        Abn?: string;
        EntityName?: string;
        EntityTypeName?: string;
        AddressState?: string;
        AddressPostcode?: string;
        AbnStatus?: string;
        Message?: string;
      };
      if (!json.Abn || !json.EntityName) {
        return NextResponse.json({
          error: json.Message || "ABN not found",
          results: [],
        });
      }
      const single: AbrResult = {
        abn: json.Abn,
        name: json.EntityName,
        entityType: json.EntityTypeName || "",
        state: json.AddressState || "",
        postcode: json.AddressPostcode || "",
        status: json.AbnStatus || "",
      };
      return NextResponse.json({ results: [single] });
    }

    if (q.length >= 3) {
      const url =
        `https://abr.business.gov.au/json/MatchingNames.aspx` +
        `?name=${encodeURIComponent(q)}` +
        `&maxResults=10` +
        `&guid=${encodeURIComponent(guid)}` +
        `&callback=callback`;
      const json = (await fetchAbr(url)) as { Names?: AbrNameRow[] };
      const names: AbrResult[] = (json.Names || []).map((n) => ({
        abn: n.Abn,
        name: n.Name,
        entityType: "",
        state: n.State || "",
        postcode: n.Postcode || "",
        status: n.AbnStatus || "",
      }));
      return NextResponse.json({ results: names });
    }

    return NextResponse.json({ results: [] });
  } catch (err) {
    console.error("[abn-lookup] proxy error:", err);
    return NextResponse.json(
      { error: "Lookup failed", results: [] },
      { status: 502 }
    );
  }
}
