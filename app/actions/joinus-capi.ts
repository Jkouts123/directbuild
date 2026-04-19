"use server";

import crypto from "crypto";

const PIXEL_ID = "744412482022839";
const CAPI_URL = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events`;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

interface CAPIPayload {
  eventName: "PageView" | "Lead";
  eventId: string;
  sourceUrl: string;
  email?: string;
  phone?: string;
  clientIp?: string;
  clientUserAgent?: string;
}

export async function sendJoinUsCapi(payload: CAPIPayload): Promise<void> {
  const token = process.env.META_CAPI_JOINUS_TOKEN;
  if (!token) {
    console.warn("[joinus-capi] META_CAPI_JOINUS_TOKEN not set — skipping CAPI");
    return;
  }

  const userData: Record<string, string | string[]> = {};
  if (payload.email) userData.em = [sha256(payload.email.toLowerCase().trim())];
  if (payload.phone) userData.ph = [sha256(payload.phone.replace(/\s/g, ""))];
  if (payload.clientIp) userData.client_ip_address = payload.clientIp;
  if (payload.clientUserAgent) userData.client_user_agent = payload.clientUserAgent;

  const body = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: "website",
        event_source_url: payload.sourceUrl,
        user_data: userData,
      },
    ],
  };

  try {
    const res = await fetch(`${CAPI_URL}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      console.error(`[joinus-capi] CAPI ${payload.eventName} failed: ${res.status} ${text}`);
    }
  } catch (err) {
    console.error("[joinus-capi] CAPI request threw:", err);
  }
}
