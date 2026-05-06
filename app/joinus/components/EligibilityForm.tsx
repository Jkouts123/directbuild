"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import PhoneVerify from "../../components/PhoneVerify";
import { trackFacebookLead } from "../../components/FacebookPixel";
import { sendJoinUsCapi } from "../../actions/joinus-capi";
import { generateTradieId } from "@/lib/utils/ids";
import {
  TRADE_OPTIONS,
  JOB_VALUE_OPTIONS,
  CAPACITY_OPTIONS,
  RESPONSE_OPTIONS,
} from "../data";
import AbnSearch, { type AbnSelected } from "./AbnSearch";
import OpportunityReport, {
  type AreaOpportunityReport,
} from "./OpportunityReport";

interface FormState {
  full_name: string;
  business_name: string;
  trade_type: string;
  service_area: string;
  website: string;
  average_job_value: string;
  capacity_per_month: string;
  close_rate: string;
  can_respond_24h: string;
  current_marketing_issue: string;
  gross_margin_range: string;
  current_marketing_spend: string;
  preferred_job_types: string[];
  current_lead_sources: string[];
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
  close_rate: "",
  can_respond_24h: "",
  current_marketing_issue: "",
  gross_margin_range: "",
  current_marketing_spend: "",
  preferred_job_types: [],
  current_lead_sources: [],
  phone: "",
  email: "",
};

const INPUT =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder:text-white/35 focus:border-orange-safety focus:outline-none focus:bg-white/[0.06] transition-colors min-h-[52px]";

const LABEL = "block text-sm font-medium text-white/85 mb-2";
const HINT = "text-xs text-white/45 mt-1.5";
const OTP_REQUIRED = true;

const CLOSE_RATE_OPTIONS = ["Under 15%", "15–25%", "25–40%", "40%+", "Not sure"];
const GROSS_MARGIN_OPTIONS = [
  "Under 15%",
  "15–25%",
  "25–40%",
  "40%+",
  "Not sure",
];
const MARKETING_SPEND_OPTIONS = [
  "$0",
  "Under $1,000/month",
  "$1,000–$3,000/month",
  "$3,000–$7,500/month",
  "$7,500+/month",
];
const LEAD_SOURCE_OPTIONS = [
  "Referrals",
  "Google",
  "Facebook / Instagram",
  "Website",
  "Hipages / lead platforms",
  "Agency",
  "Repeat clients",
  "Word of mouth",
  "Other",
];
const IMPROVEMENT_OPTIONS = [
  "More private homeowner enquiries",
  "Better quality enquiries",
  "Faster follow-up with homeowners",
  "More quote-ready opportunities",
  "Better visibility on what marketing turns into jobs",
  "Less reliance on referrals",
  "Less reliance on agencies or lead platforms",
  "Better tracking from enquiry to booked job",
];
const JOB_TYPE_OPTIONS = {
  landscaping: [
    "Full backyard upgrades",
    "Retaining walls",
    "Paving",
    "Turf",
    "Outdoor entertaining",
    "Pool surrounds",
    "Front yard transformations",
  ],
  carpentry: [
    "Decks",
    "Pergolas",
    "Renovation carpentry",
    "Framing",
    "Fit-outs",
    "Doors / windows",
    "High-end custom work",
  ],
  roofing: [
    "Roof repairs",
    "Re-roofing",
    "Leak repair",
    "Guttering",
    "Storm damage",
    "Roof restoration",
  ],
  solar: [
    "Residential solar installs",
    "Battery installs",
    "Solar upgrades",
    "Inverter replacements",
    "Commercial solar",
  ],
  builders: [
    "Extensions",
    "Renovations",
    "Granny flats",
    "Garage conversions",
    "Outdoor structures",
    "High-end residential work",
  ],
  generic: [
    "Higher-value residential jobs",
    "Maintenance / repair work",
    "New installs",
    "Renovation work",
    "Emergency / urgent work",
    "Larger project work",
  ],
};

function normaliseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getPreferredJobOptions(trade: string) {
  const value = trade.toLowerCase();
  if (value.includes("landscap")) return JOB_TYPE_OPTIONS.landscaping;
  if (value.includes("carpent")) return JOB_TYPE_OPTIONS.carpentry;
  if (value.includes("roof")) return JOB_TYPE_OPTIONS.roofing;
  if (value.includes("solar")) return JOB_TYPE_OPTIONS.solar;
  if (
    value.includes("build") ||
    value.includes("renovat") ||
    value.includes("granny")
  ) {
    return JOB_TYPE_OPTIONS.builders;
  }
  return JOB_TYPE_OPTIONS.generic;
}

interface EligibilityFormProps {
  submitMode: "live" | "sandbox";
}

export default function EligibilityForm({
  submitMode,
}: EligibilityFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [abn, setAbn] = useState<AbnSelected | null>(null);
  const [verified, setVerified] = useState(!OTP_REQUIRED);
  const [showOTP, setShowOTP] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AreaOpportunityReport | null>(null);
  const [reportError, setReportError] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({
      ...p,
      [key]: value,
      ...(key === "trade_type" ? { preferred_job_types: [] } : {}),
    }));
    if (key === "phone" && OTP_REQUIRED) {
      setVerified(false);
    }
  }

  function toggleMulti(key: "preferred_job_types" | "current_lead_sources", value: string) {
    setForm((p) => {
      const current = p[key];
      return {
        ...p,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
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

  async function generateReport() {
    setGeneratingReport(true);
    setReport(null);
    setReportError("");

    try {
      const res = await fetch("/api/joinus/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          business_name: form.business_name,
          abn: abn ? abn.abn.replace(/\s/g, "") : "",
          trade_type: form.trade_type,
          service_area: form.service_area,
          website: normaliseUrl(form.website),
          average_job_value: form.average_job_value,
          capacity_per_month: form.capacity_per_month,
          close_rate: form.close_rate,
          can_respond_24h: form.can_respond_24h,
          current_marketing_issue: form.current_marketing_issue,
          gross_margin_range: form.gross_margin_range,
          current_marketing_spend: form.current_marketing_spend,
          preferred_job_types: form.preferred_job_types,
          current_lead_sources: form.current_lead_sources,
          phone: form.phone,
          email: form.email,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        status?: string;
        report?: AreaOpportunityReport;
      };

      if (!res.ok || json.status !== "success" || !json.report) {
        throw new Error("Report generation unavailable");
      }

      setReport(json.report);
    } catch (err) {
      console.error("[joinus] report generation error:", err);
      setReportError("Report unavailable");
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    const reportPromise = generateReport();
    try {
      const [submitResult] = await Promise.allSettled([
        submitMode === "live" ? submitLive() : submitSandbox(),
      ]);
      if (submitResult.status === "rejected") {
        throw submitResult.reason;
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
      void reportPromise;
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SuccessState
        report={report}
        reportError={reportError}
        generatingReport={generatingReport}
      />
    );
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
              <label htmlFor="gross_margin_range" className={LABEL}>
                Approximate gross margin
              </label>
              <select
                id="gross_margin_range"
                value={form.gross_margin_range}
                onChange={(e) => update("gross_margin_range", e.target.value)}
                className={`${INPUT} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select a range…
                </option>
                {GROSS_MARGIN_OPTIONS.map((v) => (
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
                Roughly how many quoted jobs do you usually win?
              </span>
              <PillGroup
                name="close_rate"
                options={CLOSE_RATE_OPTIONS.map((v) => ({ value: v, label: v }))}
                value={form.close_rate}
                onChange={(v) => update("close_rate", v)}
                cols={4}
              />
            </Field>

            <Field>
              <label htmlFor="current_marketing_spend" className={LABEL}>
                Current monthly marketing spend
              </label>
              <select
                id="current_marketing_spend"
                value={form.current_marketing_spend}
                onChange={(e) =>
                  update("current_marketing_spend", e.target.value)
                }
                className={`${INPUT} appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select a range…
                </option>
                {MARKETING_SPEND_OPTIONS.map((v) => (
                  <option key={v} value={v} className="bg-black-deep">
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <span className={LABEL}>Preferred job types</span>
              <MultiSelectGroup
                name="preferred_job_types"
                options={getPreferredJobOptions(form.trade_type)}
                value={form.preferred_job_types}
                onChange={(v) => toggleMulti("preferred_job_types", v)}
              />
            </Field>

            <Field>
              <span className={LABEL}>Current lead sources</span>
              <MultiSelectGroup
                name="current_lead_sources"
                options={LEAD_SOURCE_OPTIONS}
                value={form.current_lead_sources}
                onChange={(v) => toggleMulti("current_lead_sources", v)}
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
              <span className={LABEL}>
                What would you want DirectBuild to improve first?
              </span>
              <PillGroup
                name="current_marketing_issue"
                options={IMPROVEMENT_OPTIONS.map((v) => ({
                  value: v,
                  label: v,
                }))}
                value={form.current_marketing_issue}
                onChange={(v) => update("current_marketing_issue", v)}
                cols={2}
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
                {OTP_REQUIRED && !verified && (
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
                {OTP_REQUIRED && verified && (
                  <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-5 min-h-[52px] text-sm font-semibold text-emerald-300 whitespace-nowrap">
                    <CheckCircle2 size={16} strokeWidth={2} />
                    Phone verified
                  </span>
                )}
              </div>
              {OTP_REQUIRED && (
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
                    {canSubmit
                      ? "Generate report & submit application"
                      : "Submit application"}{" "}
                    <ArrowRight size={18} strokeWidth={2.25} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {showOTP && OTP_REQUIRED && (
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

function MultiSelectGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: string[];
  value: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" aria-label={name}>
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt)}
            className={`rounded-lg border min-h-[52px] px-4 text-left text-sm sm:text-base font-semibold transition-colors cursor-pointer ${
              selected
                ? "border-orange-safety bg-orange-safety/10 text-white"
                : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/30 hover:bg-white/[0.07]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SuccessState({
  report,
  reportError,
  generatingReport,
}: {
  report: AreaOpportunityReport | null;
  reportError: string;
  generatingReport: boolean;
}) {
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

      <div className="mx-auto max-w-[860px] px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[640px] text-center space-y-6 sm:space-y-7">
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

        <OpportunityReport
          report={report}
          loading={generatingReport}
          error={reportError}
        />
      </div>
    </section>
  );
}
