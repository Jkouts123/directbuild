"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Megaphone,
  CurrencyDollar,
  PhoneCall,
  Handshake,
  CheckCircle,
  Briefcase,
  Globe,
  MapPin,
  Clock,
  User,
  Phone,
  Envelope,
  MagnifyingGlass,
  CircleNotch,
  Check,
} from "@phosphor-icons/react";
import PhoneVerify from "../components/PhoneVerify";
import FacebookPixel, { trackFacebookLead } from "../components/FacebookPixel";
import { generateTradieId } from "@/lib/utils/ids";
import { sendJoinUsCapi } from "../actions/joinus-capi";
import { OTP_VERIFICATION_ENABLED } from "@/lib/feature-flags";

// ── Constants ─────────────────────────────────────────────────────────
const TOTAL_STEPS = 11; // steps 1-11 (0 = welcome, 12 = success)

const TRADE_TYPES = [
  "Roofer",
  "Electrician",
  "Plumber",
  "Landscaper",
  "HVAC Installer",
  "Solar Technician",
  "Carpenter",
  "Builder",
  "Other",
];

const YEARS_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
];

const VALUE_PROPS = [
  { icon: Megaphone, text: "Paid Meta ads generating real leads" },
  { icon: PhoneCall, text: "Leads sent directly to your phone" },
  { icon: CurrencyDollar, text: "5% fee only if you win the job" },
  { icon: Handshake, text: "Personal onboarding call within 24h" },
];

// ── Styles ────────────────────────────────────────────────────────────
const INPUT =
  "w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder:text-white/30 focus:border-orange-safety focus:outline-none focus:bg-white/[0.07] transition-colors min-h-[56px]";

const SELECT =
  "w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white focus:border-orange-safety focus:outline-none focus:bg-white/[0.07] transition-colors min-h-[56px] appearance-none cursor-pointer";

const BTN_PRIMARY =
  "w-full flex items-center justify-center gap-2.5 rounded-xl bg-orange-safety px-6 min-h-[56px] text-base font-bold text-black-deep hover:bg-orange-hover active:scale-[0.98] transition-transform cursor-pointer";

const BTN_BACK =
  "flex items-center gap-1.5 text-sm font-medium text-white/40 hover:text-white/70 transition-colors cursor-pointer min-h-[48px]";

// ── Animation ─────────────────────────────────────────────────────────
const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const pageTransition = { type: "spring" as const, stiffness: 300, damping: 30 };

// ── ABN Types & Utilities ─────────────────────────────────────────────
interface AbnResult {
  abn: string;
  name: string;
  entityType: string;
  state: string;
  postcode: string;
  status: string;
}

function formatABN(abn: string): string {
  const d = abn.replace(/\s/g, "");
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
}

function validateWebsite(url: string): { valid: boolean; normalized: string; error: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, normalized: "", error: "" };
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname.includes(".")) {
      return { valid: false, normalized: trimmed, error: "Enter a valid website address (e.g. yourbusiness.com.au)" };
    }
    return { valid: true, normalized: withProtocol, error: "" };
  } catch {
    return { valid: false, normalized: trimmed, error: "Enter a valid website address (e.g. yourbusiness.com.au)" };
  }
}

// ── Form State ────────────────────────────────────────────────────────
interface FormState {
  fullName: string;
  abn: string;
  businessName: string;
  tradeType: string;
  website: string;
  yearsInBusiness: string;
  locationBasedIn: string;
  locationsServiced: string;
  phone: string;
  email: string;
}

const INITIAL: FormState = {
  fullName: "",
  abn: "",
  businessName: "",
  tradeType: "",
  website: "",
  yearsInBusiness: "",
  locationBasedIn: "",
  locationsServiced: "",
  phone: "",
  email: "",
};

// ── Suburb Search (single select, reuses local data) ──────────────────
function SuburbSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [allSuburbs, setAllSuburbs] = useState<
    { suburb: string; state: string; postcode: string }[]
  >([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Load once
  useState(() => {
    fetch("/data/australian-suburbs.json")
      .then((r) => r.json())
      .then((data) => {
        setAllSuburbs(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  });

  // Close on outside click
  useState(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  });

  const filtered = query.trim()
    ? allSuburbs
        .filter(
          (s) =>
            s.suburb.toLowerCase().includes(query.toLowerCase()) ||
            s.postcode.includes(query)
        )
        .slice(0, 15)
    : [];

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          size={20}
          weight="duotone"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <input
          type="text"
          value={open ? query : value || query}
          placeholder={loaded ? "Search your suburb..." : "Loading..."}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          className={`${INPUT} pl-12`}
        />
      </div>
      {open && query.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-gray-dark shadow-2xl max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-sm text-white/30 text-center">No suburbs found</p>
          )}
          {filtered.map((entry) => {
            const display = `${entry.suburb}, ${entry.state} ${entry.postcode}`;
            return (
              <button
                key={display}
                type="button"
                onClick={() => {
                  onChange(display);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors cursor-pointer"
              >
                <MapPin size={14} className="text-orange-safety shrink-0" />
                <span className="text-white">
                  {entry.suburb}
                  <span className="text-white/40">
                    , {entry.state} {entry.postcode}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {value && !open && (
        <p className="mt-2 text-xs text-white/40">
          Selected: <span className="text-orange-safety font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}

const JOINUS_PIXEL_ID = "744412482022839";

// ── Main Component ────────────────────────────────────────────────────
export default function JoinUsPage() {
  const [step, setStep] = useState(0); // 0=welcome, 1-11=form, 12=success
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [abnQuery, setAbnQuery] = useState("");
  const [abnResults, setAbnResults] = useState<AbnResult[]>([]);
  const [abnLooking, setAbnLooking] = useState(false);
  const [abnValid, setAbnValid] = useState(false);
  const [abnError, setAbnError] = useState("");
  const [abnMeta, setAbnMeta] = useState<{
    entityType: string;
    state: string;
    postcode: string;
    status: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const abnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // CAPI PageView — fires once on mount; browser PageView handled by <FacebookPixel>
  useEffect(() => {
    const eventId = `pv-joinus-${Date.now()}`;
    sendJoinUsCapi({
      eventName: "PageView",
      eventId,
      sourceUrl: window.location.href,
      clientUserAgent: navigator.userAgent,
    });
  }, []);

  function goNext() {
    setDir(1);
    setStep((s) => s + 1);
  }
  function goBack() {
    setDir(-1);
    setStep((s) => s - 1);
  }

  // Dual-mode ABN search: 11 digits → direct lookup, ≥3 chars → name search
  function searchABN(query: string) {
    if (abnTimerRef.current) clearTimeout(abnTimerRef.current);
    const digits = query.replace(/\s/g, "");

    setAbnValid(false);
    setAbnError("");
    setAbnResults([]);
    setAbnMeta(null);

    if (!query.trim()) return;

    abnTimerRef.current = setTimeout(async () => {
      setAbnLooking(true);
      try {
        if (/^\d{11}$/.test(digits)) {
          // Direct ABN lookup by number
          const res = await fetch(
            `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${digits}&callback=c`
          );
          const text = await res.text();
          const json = JSON.parse(text.replace(/^c\(/, "").replace(/\)$/, ""));
          if (json.Abn && json.EntityName) {
            selectAbnResult({
              abn: digits,
              name: json.EntityName,
              entityType: json.EntityTypeName || "",
              state: json.AddressState || "",
              postcode: json.AddressPostcode || "",
              status: json.AbnStatus || "",
            });
          } else {
            setAbnError(json.Message || "ABN not found");
          }
        } else if (query.trim().length >= 3) {
          // Name search
          const res = await fetch(
            `https://abr.business.gov.au/json/MatchingNames.aspx?name=${encodeURIComponent(query.trim())}&maxResults=10&callback=c`
          );
          const text = await res.text();
          const json = JSON.parse(text.replace(/^c\(/, "").replace(/\)$/, ""));
          const names: AbnResult[] = (json.Names || []).map(
            (n: { Abn: string; Name: string; State?: string; Postcode?: string; AbnStatus?: string }) => ({
              abn: n.Abn,
              name: n.Name,
              entityType: "",
              state: n.State || "",
              postcode: n.Postcode || "",
              status: n.AbnStatus || "",
            })
          );
          setAbnResults(names);
        }
      } catch {
        setAbnError("Could not connect to ABR. Enter your ABN or business name manually.");
      } finally {
        setAbnLooking(false);
      }
    }, 500);
  }

  function selectAbnResult(result: AbnResult) {
    setForm((p) => ({
      ...p,
      abn: formatABN(result.abn),
      businessName: result.name,
    }));
    setAbnQuery(result.name || formatABN(result.abn));
    setAbnValid(true);
    setAbnError("");
    setAbnResults([]);
    setAbnMeta({
      entityType: result.entityType,
      state: result.state,
      postcode: result.postcode,
      status: result.status,
    });
  }

  function skipAbn() {
    setAbnValid(true);
    setAbnResults([]);
    setAbnError("");
  }

  // Can advance?
  function canAdvance(): boolean {
    switch (step) {
      case 1: return form.fullName.trim().length > 0;
      case 2: return true;
      case 3: return form.businessName.trim().length > 0;
      case 4: return form.tradeType !== "";
      case 5: return validateWebsite(form.website).valid;
      case 6: return form.yearsInBusiness !== "";
      case 7: return form.locationBasedIn.trim().length > 0;
      case 8: return form.locationsServiced.trim().length > 0;
      case 9: return form.phone.trim().length >= 8;
      case 10: return form.email.includes("@");
      default: return true;
    }
  }

  // Submit
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const tradieId = generateTradieId();
      const websiteNormalized = validateWebsite(form.website).normalized || form.website;
      const payload = {
        tradie_id: tradieId,
        full_name: form.fullName,
        abn: form.abn.replace(/\s/g, ""),
        business_name: form.businessName,
        trade_type: form.tradeType,
        website: websiteNormalized,
        years_in_business: form.yearsInBusiness,
        location_based_in: form.locationBasedIn,
        locations_serviced: form.locationsServiced,
        phone: form.phone,
        email: form.email,
        verified_phone: true,
        status: "pending",
        joined_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
      const url =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_JOINUS ||
        "https://dimitrik.app.n8n.cloud/webhook/tradiesignup";
      console.log("[joinus] Submitting to:", url);
      console.log("[joinus] Payload:", JSON.stringify(payload));
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("[joinus] Response status:", res.status, res.statusText);
      if (!res.ok) {
        console.error("[joinus] Webhook failed:", res.status, res.statusText);
        setSubmitError("Something went wrong submitting your application. Please try again.");
        setSubmitting(false);
        return;
      }
      // Browser Lead + CAPI Lead with matching event_id for deduplication
      const leadEventId = crypto.randomUUID();
      trackFacebookLead(leadEventId);
      sendJoinUsCapi({
        eventName: "Lead",
        eventId: leadEventId,
        sourceUrl: window.location.href,
        email: form.email,
        phone: form.phone,
        clientUserAgent: navigator.userAgent,
      });
      setDir(1);
      setStep(12);
    } catch (err) {
      console.error("[joinus] Network error:", err);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // After phone verify — must set step explicitly, not goNext(),
  // because step 99 + 1 = 100 which has no JSX match → blank page
  function handlePhoneVerified() {
    setDir(1);
    setStep(10);
  }

  // Progress (steps 1-11)
  const progress = step >= 1 && step <= 11 ? step / TOTAL_STEPS : 0;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col">
      <FacebookPixel pixelId={JOINUS_PIXEL_ID} />
      {/* Progress bar */}
      {step >= 1 && step <= 11 && (
        <div className="w-full h-1 bg-white/5">
          <motion.div
            className="h-full bg-orange-safety"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 sm:py-16">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={dir}>
            {/* Step 0 — Welcome */}
            {step === 0 && (
              <motion.div
                key="welcome"
                custom={dir}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageTransition}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[family-name:var(--font-heading)] leading-[1.1] tracking-tight">
                    Join the Direct Build<br />tradie network
                  </h1>
                  <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-[50ch]">
                    We&apos;re running paid Meta ads generating homeowner leads across Australia.
                    Join our network and we&apos;ll send leads directly to you — you only pay 5%
                    if you win the job. Takes 2 minutes to apply.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VALUE_PROPS.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <Icon size={20} weight="duotone" className="text-orange-safety shrink-0" />
                      <span className="text-sm text-white/70">{text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={goNext} className={BTN_PRIMARY}>
                  Get started
                  <ArrowRight size={18} weight="bold" />
                </button>
              </motion.div>
            )}

            {/* Step 1 — Full name */}
            {step === 1 && (
              <StepShell key="s1" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What&apos;s your full name?" />
                <div className="relative">
                  <User size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="John Smith"
                    className={`${INPUT} pl-12`}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 2 — ABN search */}
            {step === 2 && (
              <StepShell key="s2" dir={dir} step={step} onBack={goBack}>
                <StepHeader
                  label="Find your business (optional)"
                  sub="Skip ahead if you don&apos;t have your ABN handy — you can provide it later."
                />
                <div className="relative">
                  <MagnifyingGlass size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    value={abnQuery}
                    onChange={(e) => {
                      setAbnQuery(e.target.value);
                      searchABN(e.target.value);
                    }}
                    placeholder="Business name or ABN..."
                    className={`${INPUT} pl-12 pr-12`}
                    autoFocus
                    autoComplete="off"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {abnLooking && <CircleNotch size={18} className="animate-spin text-orange-safety" />}
                    {abnValid && !abnLooking && <Check size={18} weight="bold" className="text-green-400" />}
                  </div>
                </div>

                {/* Dropdown results */}
                {abnResults.length > 0 && !abnValid && (
                  <div className="rounded-xl border border-white/10 bg-gray-dark overflow-hidden -mt-2">
                    {abnResults.map((result) => (
                      <button
                        key={result.abn}
                        type="button"
                        onClick={() => selectAbnResult(result)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{result.name}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            ABN {formatABN(result.abn)}
                            {result.state ? ` · ${result.state}` : ""}
                            {result.postcode ? ` ${result.postcode}` : ""}
                          </p>
                        </div>
                        {result.status && (
                          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${result.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {result.status}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {abnError && <p className="text-xs text-red-400 -mt-2">{abnError}</p>}

                {/* Verified card */}
                {abnValid && abnMeta && (
                  <div className="rounded-xl border border-green-500/25 bg-green-500/5 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Check size={14} weight="bold" className="text-green-400 shrink-0" />
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">ABN verified</span>
                      {abnMeta.status && (
                        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${abnMeta.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {abnMeta.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{form.businessName}</p>
                    <p className="text-xs text-white/40">ABN {form.abn}</p>
                    {(abnMeta.entityType || abnMeta.state) && (
                      <p className="text-xs text-white/40">
                        {[abnMeta.entityType, abnMeta.state && abnMeta.postcode ? `${abnMeta.state} ${abnMeta.postcode}` : abnMeta.state].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-white/30 pt-0.5">Not your business? You can edit the name on the next step.</p>
                  </div>
                )}

                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 3 — Business name */}
            {step === 3 && (
              <StepShell key="s3" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What&apos;s your business name?" sub={abnValid ? "Auto-filled from ABN — edit if needed." : undefined} />
                <div className="relative">
                  <Briefcase size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                    placeholder="Your business name"
                    className={`${INPUT} pl-12`}
                    autoFocus
                  />
                </div>
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 4 — Trade type */}
            {step === 4 && (
              <StepShell key="s4" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What&apos;s your trade?" />
                <select
                  value={form.tradeType}
                  onChange={(e) => setForm((p) => ({ ...p, tradeType: e.target.value }))}
                  className={SELECT}
                  autoFocus
                >
                  <option value="" disabled>Select your trade...</option>
                  {TRADE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 5 — Website */}
            {step === 5 && (
              <StepShell key="s5" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What&apos;s your business website?" />
                <div className="space-y-2">
                  <div className="relative">
                    <Globe size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, website: e.target.value }));
                        const { error } = validateWebsite(e.target.value);
                        setWebsiteError(error);
                      }}
                      placeholder="yourbusiness.com.au"
                      className={`${INPUT} pl-12`}
                      autoComplete="url"
                      autoFocus
                    />
                  </div>
                  {websiteError && (
                    <p className="text-xs text-red-400">{websiteError}</p>
                  )}
                </div>
                <NextButton
                  disabled={!canAdvance()}
                  onClick={() => {
                    // Normalize URL before advancing
                    const { normalized } = validateWebsite(form.website);
                    if (normalized) setForm((p) => ({ ...p, website: normalized }));
                    goNext();
                  }}
                />
              </StepShell>
            )}

            {/* Step 6 — Years in business */}
            {step === 6 && (
              <StepShell key="s6" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="How long have you been operating?" />
                <div className="relative">
                  <Clock size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <select
                    value={form.yearsInBusiness}
                    onChange={(e) => setForm((p) => ({ ...p, yearsInBusiness: e.target.value }))}
                    className={`${SELECT} pl-12`}
                    autoFocus
                  >
                    <option value="" disabled>Select...</option>
                    {YEARS_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 7 — Location based in */}
            {step === 7 && (
              <StepShell key="s7" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="Where are you based?" />
                <SuburbSearchInput
                  value={form.locationBasedIn}
                  onChange={(v) => setForm((p) => ({ ...p, locationBasedIn: v }))}
                />
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 8 — Locations serviced */}
            {step === 8 && (
              <StepShell key="s8" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What areas do you service?" />
                <div className="relative">
                  <MapPin size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    value={form.locationsServiced}
                    onChange={(e) => setForm((p) => ({ ...p, locationsServiced: e.target.value }))}
                    placeholder="e.g. The Shire, St George area or Sydney Metropolitan Area"
                    className={`${INPUT} pl-12`}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-white/30 -mt-1">
                  Be as specific as possible so we can match you with the right jobs in your area.
                </p>
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 9 — Phone (with OTP) */}
            {step === 9 && (
              <StepShell key="s9" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What&apos;s your mobile number?" />
                <div className="relative">
                  <Phone size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="04XX XXX XXX"
                    className={`${INPUT} pl-12`}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setDir(1);
                    // When OTP is disabled, jump straight to email step (10).
                    // Step 99 is the OTP overlay — skip it entirely.
                    setStep(OTP_VERIFICATION_ENABLED ? 99 : 10);
                  }}
                  disabled={!canAdvance()}
                  className={`${BTN_PRIMARY} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {OTP_VERIFICATION_ENABLED ? "Verify with SMS" : "Continue"}
                  <ArrowRight size={18} weight="bold" />
                </button>
              </StepShell>
            )}

            {/* Step 99 — OTP verification overlay */}
            {step === 99 && (
              <motion.div
                key="otp"
                custom={dir}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageTransition}
              >
                <PhoneVerify
                  phone={form.phone}
                  onVerified={handlePhoneVerified}
                  onCancel={() => {
                    setDir(-1);
                    setStep(9);
                  }}
                />
              </motion.div>
            )}

            {/* Step 10 — Email */}
            {step === 10 && (
              <StepShell key="s10" dir={dir} step={step} onBack={() => { setDir(-1); setStep(9); }}>
                <StepHeader label="What&apos;s your email address?" />
                <div className="relative">
                  <Envelope size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="john@example.com.au"
                    className={`${INPUT} pl-12`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {submitError && (
                  <p className="text-xs text-red-400 text-center">{submitError}</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canAdvance() || submitting}
                  className={`${BTN_PRIMARY} ${!canAdvance() || submitting ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {submitting ? (
                    <CircleNotch size={18} className="animate-spin" />
                  ) : (
                    <>
                      Submit application
                      <ArrowRight size={18} weight="bold" />
                    </>
                  )}
                </button>
              </StepShell>
            )}

            {/* Step 12 — Success */}
            {step === 12 && (
              <motion.div
                key="success"
                custom={dir}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageTransition}
                className="text-center space-y-8 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 mx-auto"
                >
                  <CheckCircle size={40} weight="fill" className="text-green-400" />
                </motion.div>

                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-heading)]">
                    You&apos;re officially signed up.
                  </h1>
                  <p className="text-white/60 text-base max-w-md mx-auto leading-relaxed">
                    Your details are now in our contractor network, and our team will be in touch
                    when suitable opportunities become available in your service area.
                  </p>
                  <p className="text-white/35 text-sm max-w-md mx-auto leading-relaxed">
                    We&apos;ll review your details and contact you when there&apos;s a relevant
                    homeowner enquiry that matches your trade and location.
                  </p>
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 text-left space-y-3 max-w-sm mx-auto">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Your details</h3>
                  <SummaryRow label="Name" value={form.fullName} />
                  <SummaryRow label="Business" value={form.businessName} />
                  <SummaryRow label="ABN" value={form.abn} />
                  <SummaryRow label="Trade" value={form.tradeType} />
                  <SummaryRow label="Based in" value={form.locationBasedIn} />
                  <SummaryRow label="Services" value={form.locationsServiced} />
                  <SummaryRow label="Phone" value={form.phone} />
                  <SummaryRow label="Email" value={form.email} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function StepShell({
  children,
  dir,
  step,
  onBack,
}: {
  children: React.ReactNode;
  dir: number;
  step: number;
  onBack: () => void;
}) {
  return (
    <motion.div
      key={`step-${step}`}
      custom={dir}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={pageTransition}
      className="space-y-6"
    >
      <button onClick={onBack} className={BTN_BACK}>
        <ArrowLeft size={16} weight="bold" />
        Back
      </button>
      {children}
    </motion.div>
  );
}

function StepHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="space-y-1">
      <h2
        className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-heading)] tracking-tight"
        dangerouslySetInnerHTML={{ __html: label }}
      />
      {sub && <p className="text-sm text-white/40">{sub}</p>}
    </div>
  );
}

function NextButton({
  disabled,
  onClick,
  label = "Continue",
}: {
  disabled: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${BTN_PRIMARY} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      {label}
      <ArrowRight size={18} weight="bold" />
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="text-white font-medium text-right truncate">{value}</span>
    </div>
  );
}
