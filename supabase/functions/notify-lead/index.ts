import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface LeadPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    suburb: string;
    service_type: string;
    user_input: Record<string, unknown>;
    ai_quote: {
      centerPrice: number;
      minPrice: number;
      maxPrice: number;
      summary: string;
    };
    verified_phone: boolean;
    created_at: string;
  };
  old_record: null;
}

// ── Slack ────────────────────────────────────────────────────────────
async function notifySlack(lead: LeadPayload["record"]) {
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not set — skipping Slack notification");
    return;
  }

  const quote = lead.ai_quote;
  const verified = lead.verified_phone ? "Verified" : "Unverified";

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `New ${lead.service_type.toUpperCase()} Lead`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Name:*\n${lead.name}` },
          { type: "mrkdwn", text: `*Phone:*\n${lead.phone} (${verified})` },
          { type: "mrkdwn", text: `*Suburb:*\n${lead.suburb}` },
          { type: "mrkdwn", text: `*Service:*\n${lead.service_type}` },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Estimate:*\n$${quote.minPrice.toLocaleString()} – $${quote.maxPrice.toLocaleString()}`,
          },
          {
            type: "mrkdwn",
            text: `*Centre Price:*\n$${quote.centerPrice.toLocaleString()}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Summary:*\n${quote.summary}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Received at ${new Date(lead.created_at).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}`,
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Slack webhook failed:", res.status, await res.text());
  }
}

// ── Google Sheets ───────────────────────────────────────────────────
async function appendToSheet(lead: LeadPayload["record"]) {
  const credentials = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const spreadsheetId = Deno.env.get("GOOGLE_SHEET_ID");

  if (!credentials || !spreadsheetId) {
    console.warn("Google Sheets env vars not set — skipping sheet append");
    return;
  }

  const sa = JSON.parse(credentials);

  // Build JWT for Google API auth
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  // Import the private key and sign
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureInput = new TextEncoder().encode(`${header}.${claimSet}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, signatureInput);
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${claimSet}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  // Append row
  const quote = lead.ai_quote;
  const row = [
    new Date(lead.created_at).toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
    lead.name,
    lead.phone,
    lead.email || "",
    lead.suburb,
    lead.service_type,
    `$${quote.minPrice.toLocaleString()}`,
    `$${quote.maxPrice.toLocaleString()}`,
    `$${quote.centerPrice.toLocaleString()}`,
    lead.verified_phone ? "Yes" : "No",
    quote.summary,
  ];

  const sheetRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:K:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!sheetRes.ok) {
    console.error("Google Sheets append failed:", sheetRes.status, await sheetRes.text());
  }
}

// ── Handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Verify the request is a POST from Supabase
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = (await req.json()) as LeadPayload;

    if (payload.type !== "INSERT" || payload.table !== "leads") {
      return new Response("Ignored — not a leads insert", { status: 200 });
    }

    const lead = payload.record;

    // Run Slack and Sheets in parallel
    await Promise.allSettled([notifySlack(lead), appendToSheet(lead)]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-lead error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
