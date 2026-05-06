"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import PhoneVerify from "../../components/PhoneVerify";
import { trackFacebookLead } from "../../components/FacebookPixel";
import { sendJoinUsCapi } from "../../actions/joinus-capi";
import { OTP_VERIFICATION_ENABLED } from "@/lib/feature-flags";
import { generateTradieId } from "@/lib/utils/ids";
import {
  TRADE_OPTIONS,
  JOB_VALUE_OPTIONS,
  CAPACITY_OPTIONS,
  RESPONSE_OPTIONS,
} from "../data";
import AbnSearch, { type AbnSelected } from "./AbnSearch";

interface FormState {
  full_name: string;
  business_name: string;
  trade_type: string;
  service_area: string;
  website: string;
  average_job_value: string;
  capacity_per_month: string;
  can_respond_24h: string;
  current_marketing_issue: string;
  phone: string;
  email: string;
}

const INITIAL: FormState = {
  full_name: "",
  business_name: "",
  trade_type: "",
  service_area: "",
  website: "",
  average_job_value: "",
  capacity_per_month: "",
  can_respond_24h: "",
  current_marketing_issue: "",
  phone: "",
  email: "",
};

const INPUT =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder:text-white/35 focus:border-orange-safety focus:outline-none focus:bg-white/[0.06] transition-colors min-h-[52px]";

const LABEL = "block text-sm font-medium text-white/85 mb-2";
const HINT = "text-xs text-white/45 mt-1.5";

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

interface EligibilityFormProps {
  submitMode: "live" | "sandbox";
}

export default function EligibilityForm({
  submitMode,
}: EligibilityFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [abn, setAbn] = useState<AbnSelected | null>(null);
  const [verified, setVerified] = useState(!OTP_VERIFICATION_ENABLED);
  const [showOTP, setShowOTP] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    if (key === "phone" && OTP_VERIFICATION_ENABLED) {
      setVerified(false);
    }
  }

  function handleAbnChange(next: AbnSelected | null) {
    setAbn(next);
    // Auto-fill business name from ABN selection if user hasn't typed one
    if (next && !form.business_name.trim()) {
      setForm((p) => ({ ...p, business_name: next.business_name }));
    }
  }

  function isPhoneShape(p: string) {
    return p.replace(/\D/g, "").length >= 8;
  }
  function isEmailShape(e: string) {
    return /\S+@\S+\.\S+/.test(e);
  }

  function nonOtpFieldsValid() {
    return (
      form.full_name.trim().length > 1 &&
      form.business_name.trim().length > 1 &&
      form.trade_type !== "" &&
      form.service_area.trim().length > 1 &&
      form.average_job_value !== "" &&
      form.capacity_per_month !== "" &&
      form.can_respond_24h !== "" &&
      isPhoneShape(form.phone) &&
      isEmailShape(form.email)
    );
  }

  const canVerify = isPhoneShape(form.phone) && !verified;
  const canSubmit = nonOtpFieldsValid() && verified && !submitting;

  function handleVerifyClick() {
    setError("");
    if (!isPhoneShape(form.phone)) return;
    setShowOTP(true);
  }

  function handleVerified() {
    setVerified(true);
    setShowOTP(false);
  }

  async function submitLive() {
    const tradieId = generateTradieId();
    // Shared id for browser Pixel Lead + direct CAPI Lead.
    // Also stored on the n8n payload as lead_event_id for audit/dedup.
    const leadEventId = crypto.randomUUID();
    const websiteNormalised = normaliseUrl(form.website);
    const nowIso = new Date().toISOString();

    const payload = {
      tradie_id: tradieId,
      lead_event_id: leadEventId,
      full_name: form.full_name,
      business_name: form.business_name,
      trade_type: form.trade_type,
      service_area: form.service_area,
      // Mirror service_area into the existing fields the n8n branch reads
      // (CAPI custom_data, Sheets, Telegram) so historic mappings keep working.
      location_based_in: form.service_area,
      locations_serviced: form.service_area,
      phone: form.phone,
      email: form.email,
      verified_phone: true,
      website: websiteNormalised,
      average_job_value: form.average_job_value,
      capacity_per_month: form.capacity_per_month,
      can_respond_24h: form.can_respond_24h,
      current_marketing_issue: form.current_marketing_issue,
      status: "pending",
      joined_at: nowIso,
      source_page: "/joinus",
      // Optional fields kept in payload so existing Sheets cells stay populated
      // (or blank) without n8n erroring on missing keys.
      abn: abn ? abn.abn.replace(/\s/g, "") : "",
      years_in_business: "",
      preferred_job_size: "",
      timestamp: nowIso,
    };

    const url =
      process.env.NEXT_PUBLIC_N8N_WEBHOOK_JOINUS ||
      "https://dimitrik.app.n8n.cloud/webhook/tradiesignup";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(
        `Webhook returned ${res.status} ${res.statusText || ""}`.trim(),
      );
    }

    // Browser Pixel Lead + direct CAPI Lead, deduped on leadEventId.
    trackFacebookLead(leadEventId);
    sendJoinUsCapi({
      eventName: "Lead",
      eventId: leadEventId,
      sourceUrl: window.location.href,
      email: form.email,
      phone: form.phone,
      clientUserAgent: navigator.userAgent,
    });
  }

  async function submitSandbox() {
    const res = await fetch("/api/sandbox/joinus-waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, verified_phone: verified }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!res.ok || !json.ok) {
      throw new Error(
        json.error ||
          "Something went wrong submitting your application. Please try again.",
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      if (submitMode === "live") {
        await submitLive();
      } else {
        await submitSandbox();
      }
      setSubmitted(true);
    } catch (err) {
      console.error("[joinus] submit error:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <SuccessState />;
  }

  return (
    <>
      <section
        id="apply"
        className="relative isolate bg-black-deep text-white py-16 sm:py-24 lg:py-28 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 500px at 10% 0%, rgba(255,140,0,0.12), transparent 60%), linear-gradient(180deg, #0a0e14, #0d1420)",
            }}
          />
        </div>

        <div className="mx-auto max-w-[760px] px-5 sm:px-8 lg:px-12">
          <header className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 lg:mb-14">
            <p className="inline-flex items-center gap-3 text-[11px] font-mono font-medium uppercase tracking-[0.22em] text-orange-safety">
              <span className="h-px w-8 bg-orange-safety" aria-hidden />
              Application
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.05]">
              Apply for the current{" "}
              <span className="block sm:inline">DirectBuild intake.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/60 leading-[1.6] max-w-[58ch]">
              We review applications by trade and area. If your trade and
              service area are open for current intake, we’ll be in touch
              about next steps.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 sm:space-y-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-8 lg:p-10 backdrop-blur-sm"
          >
            <Field>
              <label htmlFor="full_name" className={LABEL}>
                Your full name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="John Smith"
                className={INPUT}
              />
            </Field>

            <Field>
              <span className={LABEL}>
                Verify your business{" "}
                <span className="text-white/40">(optional)</span>
              </span>
              <AbnSearch value={abn} onChange={handleAbnChange} />
              <p className={HINT}>
                Search by business name or ABN. We use this to confirm
                you’re operating under a registered Australian business.
              </p>
            </Field>

            <Field>
              <label htmlFor="business_name" className={LABEL}>
                Business name
              </label>
              <input
                id="business_name"
                type="text"
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
                placeholder="Trading name"
                className={INPUT}
              />
              {abn && (
                <p className={HINT}>
                  Auto-filled from ABN — edit if needed.
                </p>
              )}
            </Field>

            <Field>
              <label htmlFor="trade_type" className={LABEL}>
                What trade do you want more private work for?
              </label>
              <select
                id="trade_type"
                value={form.trade_type}
                onChange={(e) => update("trade_type", e.target.value)}
                className={`${INPUT} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select your trade…
                </option>
                {TRADE_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-black-deep">
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <label htmlFor="service_area" className={LABEL}>
                What areas can you reliably service?
              </label>
              <input
                id="service_area"
                type="text"
                value={form.service_area}
                onChange={(e) => update("service_area", e.target.value)}
                placeholder="e.g. Inner West Sydney, Eastern Suburbs"
                className={INPUT}
              />
              <p className={HINT}>
                Be specific. We match incoming homeowner enquiries against
                this.
              </p>
            </Field>

            <Field>
              <label htmlFor="website" className={LABEL}>
                Website or social link{" "}
                <span className="text-white/40">(optional)</span>
              </label>
              <input
                id="website"
                type="url"
                autoComplete="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="yourbusiness.com.au"
                className={INPUT}
              />
            </Field>

            <Field>
              <label htmlFor="average_job_value" className={LABEL}>
                What is your average job value?
              </label>
              <select
                id="average_job_value"
                value={form.average_job_value}
                onChange={(e) => update("average_job_value", e.target.value)}
                className={`${INPUT} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select a band…
                </option>
                {JOB_VALUE_OPTIONS.map((v) => (
                  <option key={v} value={v} className="bg-black-deep">
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <span className={LABEL}>
                How many extra jobs could you take on per month?
              </span>
              <PillGroup
                name="capacity_per_month"
                options={CAPACITY_OPTIONS.map((v) => ({ value: v, label: v }))}
                value={form.capacity_per_month}
                onChange={(v) => update("capacity_per_month", v)}
                cols={4}
              />
            </Field>

            <Field>
              <span className={LABEL}>
                Can you respond to new homeowner enquiries within 24 hours?
              </span>
              <PillGroup
                name="can_respond_24h"
                options={RESPONSE_OPTIONS}
                value={form.can_respond_24h}
                onChange={(v) => update("can_respond_24h", v)}
                cols={2}
              />
            </Field>

            <Field>
              <label htmlFor="current_marketing_issue" className={LABEL}>
                What is your biggest marketing issue right now?{" "}
                <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                id="current_marketing_issue"
                rows={4}
                value={form.current_marketing_issue}
                onChange={(e) =>
                  update("current_marketing_issue", e.target.value)
                }
                placeholder="Tell us briefly. We read every application."
                className={`${INPUT} min-h-[120px] resize-y leading-[1.5]`}
              />
            </Field>

            <Field>
              <label htmlFor="email" className={LABEL}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@yourbusiness.com.au"
                className={INPUT}
              />
            </Field>

            {/* ── Phone + OTP block ── */}
            <Field>
              <label htmlFor="phone" className={LABEL}>
                Mobile number
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="04XX XXX XXX"
                  className={`${INPUT} sm:flex-1`}
                />
                {OTP_VERIFICATION_ENABLED && !verified && (
                  <button
                    type="button"
                    onClick={handleVerifyClick}
                    disabled={!canVerify}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border border-orange-safety/50 bg-orange-safety/10 px-5 min-h-[52px] text-sm font-semibold text-orange-safety hover:bg-orange-safety/15 transition-colors cursor-pointer whitespace-nowrap ${
                      !canVerify ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <ShieldCheck size={16} strokeWidth={2} />
                    Verify via SMS
                  </button>
                )}
                {OTP_VERIFICATION_ENABLED && verified && (
                  <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-5 min-h-[52px] text-sm font-semibold text-emerald-300 whitespace-nowrap">
                    <CheckCircle2 size={16} strokeWidth={2} />
                    Phone verified
                  </span>
                )}
              </div>
              {OTP_VERIFICATION_ENABLED && (
                <p className={HINT}>
                  We send a 6-digit code by SMS. Verification is required
                  before submitting.
                </p>
              )}
            </Field>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <p className="text-xs text-white/45 leading-relaxed">
                By applying you agree we may contact you about your
                application. Selected trades only — limited spots per area.
              </p>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`inline-flex items-center justify-center gap-2.5 rounded-lg bg-orange-safety px-7 min-h-[56px] text-base font-bold text-black-deep hover:bg-orange-hover active:scale-[0.99] transition-[background-color,transform] cursor-pointer whitespace-nowrap w-full sm:w-auto ${
                  !canSubmit ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    Submit application{" "}
                    <ArrowRight size={18} strokeWidth={2.25} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {showOTP && OTP_VERIFICATION_ENABLED && (
        <PhoneVerify
          phone={form.phone}
          onVerified={handleVerified}
          onCancel={() => setShowOTP(false)}
        />
      )}
    </>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function PillGroup({
  name,
  options,
  value,
  onChange,
  cols,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols: 2 | 4;
}) {
  const grid = cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2";
  return (
    <div className={`grid ${grid} gap-2.5`} role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border min-h-[52px] px-4 text-base font-semibold transition-colors cursor-pointer ${
              selected
                ? "border-orange-safety bg-orange-safety/10 text-white"
                : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/30 hover:bg-white/[0.07]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SuccessState() {
  return (
    <section
      id="apply"
      className="relative isolate bg-black-deep text-white py-24 sm:py-32 lg:py-40 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-90">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 50% 0%, rgba(255,140,0,0.14), transparent 60%), linear-gradient(180deg, #0a0e14, #0d1420)",
          }}
        />
      </div>

      <div className="mx-auto max-w-[640px] px-5 sm:px-8 lg:px-12 text-center space-y-6 sm:space-y-7">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-orange-safety/30 bg-orange-safety/10">
          <CheckCircle2
            size={28}
            strokeWidth={1.75}
            className="text-orange-safety"
          />
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
          Application received
        </p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.05]">
          Application received.
        </h2>
        <p className="text-base sm:text-lg text-white/65 leading-[1.6] max-w-[52ch] mx-auto">
          Verified applications are reviewed by trade and service area. If
          there’s a fit for the current DirectBuild intake, we’ll contact
          you about next steps.
        </p>
        <p className="text-xs text-white/40 pt-2">
          Selected trades only · limited spots per area.
        </p>
      </div>
    </section>
  );
}
