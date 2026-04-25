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
const TOTAL_STEPS = 13; // steps 1-13 (0 = welcome, 14 = success, 99 = OTP overlay)

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

const CAPACITY_OPTIONS = ["1-2", "3-5", "6-9", "10+"];
const JOB_SIZE_OPTIONS = ["Under $5k", "$5k-$20k", "$20k-$50k", "$50k+"];

const VALUE_PROPS = [
  { icon: Megaphone, text: "Active paid campaigns generating real homeowner enquiries" },
  { icon: PhoneCall, text: "Matched enquiries sent direct to your phone" },
  { icon: CurrencyDollar, text: "No retainers — 5% only if the job proceeds" },
  { icon: Handshake, text: "Personal onboarding call if accepted" },
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
  capacityPerMonth: string;
  preferredJobSize: string;
  canRespond24h: string;
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
  capacityPerMonth: "",
  preferredJobSize: "",
  canRespond24h: "",
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

  // Dual-mode ABN search proxied through /api/abn-lookup (GUID server-side).
  // 11 digits → direct ABN lookup; ≥3 chars → business name search.
  function searchABN(query: string) {
    if (abnTimerRef.current) clearTimeout(abnTimerRef.current);
    const digits = query.replace(/\s/g, "");

    setAbnValid(false);
    setAbnError("");
    setAbnResults([]);
    setAbnMeta(null);

    if (!query.trim()) return;
    if (!/^\d{11}$/.test(digits) && query.trim().length < 3) return;

    abnTimerRef.current = setTimeout(async () => {
      setAbnLooking(true);
      try {
        const res = await fetch(
          `/api/abn-lookup?q=${encodeURIComponent(query.trim())}`
        );
        const json = (await res.json()) as {
          results: AbnResult[];
          error?: string;
        };

        if (!res.ok) {
          setAbnError("Lookup unavailable. Enter your ABN or business name manually.");
          return;
        }

        // Single, exact ABN match → auto-select
        if (/^\d{11}$/.test(digits) && json.results.length === 1) {
          selectAbnResult(json.results[0]);
          return;
        }

        if (json.error && json.results.length === 0) {
          setAbnError(json.error);
          return;
        }

        setAbnResults(json.results);
      } catch {
        setAbnError("Could not reach lookup. Enter your ABN or business name manually.");
      } finally {
        setAbnLooking(false);
      }
    }, 400);
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
      case 2: return true; // ABN search optional — user may not have it handy
      case 3: return form.businessName.trim().length > 0;
      case 4: return form.tradeType !== "";
      case 5: return validateWebsite(form.website).valid;
      case 6: return form.yearsInBusiness !== "";
      case 7: return form.locationBasedIn.trim().length > 0;
      case 8: return form.locationsServiced.trim().length > 0;
      case 9: return form.capacityPerMonth !== "";
      case 10: return form.preferredJobSize !== "";
      case 11: return form.canRespond24h !== "";
      case 12: return form.phone.trim().length >= 8;
      case 13: return form.email.includes("@");
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
        capacity_per_month: form.capacityPerMonth,
        preferred_job_size: form.preferredJobSize,
        can_respond_24h: form.canRespond24h,
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
      setStep(14);
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
    setStep(13);
  }

  // Progress (steps 1-13)
  const progress = step >= 1 && step <= 13 ? step / TOTAL_STEPS : 0;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col">
      <FacebookPixel pixelId={JOINUS_PIXEL_ID} />
      {/* Progress bar */}
      {step >= 1 && step <= 13 && (
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
                    Apply to join our<br />contractor network
                  </h1>
                  <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-[50ch]">
                    We work with a limited number of tradies per area. No monthly retainers —
                    we only get paid if the job proceeds. This form puts you forward for review
                    against incoming homeowner enquiries in your service area.
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
                <StepHeader label="Your full name" />
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
                  label="Verify your business"
                  sub="Search by business name or ABN. We use this to confirm you&apos;re operating under a registered Australian business."
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
                <StepHeader label="Trading name" sub={abnValid ? "Auto-filled from ABN — edit if needed." : "The name you operate under."} />
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
                <StepHeader label="Primary trade" sub="What type of work do you want to be considered for?" />
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
                <StepHeader label="Business presence" sub="Website or online presence we can use to verify your business — Instagram or Facebook page is fine." />
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
                <StepHeader label="Business experience" sub="How long have you been operating under this business?" />
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
                <StepHeader label="Where you&apos;re based" sub="The suburb you primarily operate from." />
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
                <StepHeader label="Service area" sub="Where can you reliably take on new work? Be specific — this is what we match incoming homeowner enquiries against." />
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
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 9 — Current capacity (pills) */}
            {step === 9 && (
              <StepShell key="s9" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="Current capacity" sub="How many additional jobs could you realistically take on per month?" />
                <PillGrid
                  options={CAPACITY_OPTIONS}
                  value={form.capacityPerMonth}
                  onChange={(v) => setForm((p) => ({ ...p, capacityPerMonth: v }))}
                  cols={2}
                />
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 10 — Preferred job size (pills) */}
            {step === 10 && (
              <StepShell key="s10" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="Preferred job size" sub="What size jobs are you looking to win more of?" />
                <PillGrid
                  options={JOB_SIZE_OPTIONS}
                  value={form.preferredJobSize}
                  onChange={(v) => setForm((p) => ({ ...p, preferredJobSize: v }))}
                  cols={2}
                />
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 11 — 24h response (yes/no pills) */}
            {step === 11 && (
              <StepShell key="s11" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="Response speed" sub="Can you reliably respond to new homeowner enquiries within 24 hours?" />
                <PillGrid
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                  value={form.canRespond24h}
                  onChange={(v) => setForm((p) => ({ ...p, canRespond24h: v }))}
                  cols={2}
                />
                <NextButton disabled={!canAdvance()} onClick={goNext} />
              </StepShell>
            )}

            {/* Step 12 — Phone (with OTP) */}
            {step === 12 && (
              <StepShell key="s12" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="Mobile number" sub="We&apos;ll send a 6-digit verification code by SMS." />
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
                    // When OTP is disabled, jump straight to email step (13).
                    // Step 99 is the OTP overlay — skip it entirely.
                    setStep(OTP_VERIFICATION_ENABLED ? 99 : 13);
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
                    setStep(12);
                  }}
                />
              </motion.div>
            )}

            {/* Step 13 — Email */}
            {step === 13 && (
              <StepShell key="s13" dir={dir} step={step} onBack={() => { setDir(-1); setStep(12); }}>
                <StepHeader label="Email address" sub="Used for onboarding and to send you matched enquiries." />
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

            {/* Step 14 — Success */}
            {step === 14 && (
              <motion.div
                key="success"
                custom={dir}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={pageTransition}
                className="space-y-8 py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 mx-auto"
                >
                  <CheckCircle size={40} weight="fill" className="text-green-400" />
                </motion.div>

                <div className="space-y-4 text-center">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-heading)] tracking-tight">
                    You&apos;re in the priority<br />contractor pool.
                  </h1>
                  <p className="text-white/60 text-base max-w-md mx-auto leading-relaxed">
                    We&apos;ve added you to our priority pool for{" "}
                    <span className="text-white font-medium">{form.tradeType || "your trade"}</span>{" "}
                    in{" "}
                    <span className="text-white font-medium">{form.locationBasedIn || "your area"}</span>.
                    We work with a limited number of tradies per area, so when a homeowner enquiry
                    comes in for your trade and service area, we contact our priority pool first.
                  </p>
                </div>

                {/* How it works */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 max-w-md mx-auto space-y-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                    How it works
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "We match new homeowner enquiries by trade and service area.",
                      "If there’s a fit, we contact you first — usually the same day.",
                      "We prioritise tradies who respond within 24 hours and deliver the work properly.",
                      "If the job proceeds, that’s when we get paid. No retainers. No upfront fees.",
                    ].map((line) => (
                      <li key={line} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-safety" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 text-left space-y-3 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Your details</h3>
                  <SummaryRow label="Name" value={form.fullName} />
                  <SummaryRow label="Business" value={form.businessName} />
                  <SummaryRow label="ABN" value={form.abn} />
                  <SummaryRow label="Trade" value={form.tradeType} />
                  <SummaryRow label="Based in" value={form.locationBasedIn} />
                  <SummaryRow label="Services" value={form.locationsServiced} />
                  <SummaryRow label="Capacity" value={form.capacityPerMonth ? `${form.capacityPerMonth} jobs/mo` : ""} />
                  <SummaryRow label="Job size" value={form.preferredJobSize} />
                  <SummaryRow label="24h reply" value={form.canRespond24h === "yes" ? "Yes" : form.canRespond24h === "no" ? "No" : ""} />
                  <SummaryRow label="Phone" value={form.phone} />
                  <SummaryRow label="Email" value={form.email} />
                </div>

                <p className="text-center text-sm text-white/50 max-w-md mx-auto">
                  If there&apos;s a fit, our team will contact you directly.
                </p>
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

type PillOption = string | { value: string; label: string };

function PillGrid({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
  cols?: 2 | 3;
}) {
  const gridClass = cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${gridClass} gap-2.5`}>
      {options.map((opt) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-xl border px-4 py-4 text-base font-semibold transition-colors min-h-[64px] cursor-pointer ${
              selected
                ? "border-orange-safety bg-orange-safety/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
