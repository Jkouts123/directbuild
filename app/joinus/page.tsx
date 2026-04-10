"use client";

import { useState, useRef, useCallback } from "react";
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

// ── Main Component ────────────────────────────────────────────────────
export default function JoinUsPage() {
  const [step, setStep] = useState(0); // 0=welcome, 1-11=form, 12=success
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [abnLooking, setAbnLooking] = useState(false);
  const [abnValid, setAbnValid] = useState(false);
  const [abnError, setAbnError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const abnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goNext() {
    setDir(1);
    setStep((s) => s + 1);
  }
  function goBack() {
    setDir(-1);
    setStep((s) => s - 1);
  }

  // ABN lookup
  const lookupABN = useCallback((abn: string) => {
    if (abnTimerRef.current) clearTimeout(abnTimerRef.current);
    const digits = abn.replace(/\s/g, "");
    setAbnValid(false);
    if (digits.length !== 11) {
      setAbnError("");
      return;
    }
    abnTimerRef.current = setTimeout(async () => {
      setAbnLooking(true);
      setAbnError("");
      try {
        const res = await fetch(
          `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${digits}&callback=c`
        );
        const text = await res.text();
        const json = JSON.parse(text.replace(/^c\(/, "").replace(/\)$/, ""));
        if (json.Abn && json.EntityName) {
          setForm((p) => ({ ...p, businessName: json.EntityName }));
          setAbnValid(true);
          setAbnError("");
        } else {
          setAbnError(json.Message || "ABN not found");
        }
      } catch {
        setAbnError("Could not verify ABN. Enter business name manually.");
      } finally {
        setAbnLooking(false);
      }
    }, 500);
  }, []);

  // Can advance?
  function canAdvance(): boolean {
    switch (step) {
      case 1: return form.fullName.trim().length > 0;
      case 2: return form.abn.replace(/\s/g, "").length === 11;
      case 3: return form.businessName.trim().length > 0;
      case 4: return form.tradeType !== "";
      case 5: return form.website.trim().length > 0;
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
    try {
      const payload = {
        full_name: form.fullName,
        abn: form.abn.replace(/\s/g, ""),
        business_name: form.businessName,
        trade_type: form.tradeType,
        website: form.website,
        years_in_business: form.yearsInBusiness,
        location_based_in: form.locationBasedIn,
        locations_serviced: form.locationsServiced,
        phone: form.phone,
        email: form.email,
        verified_phone: true,
        timestamp: new Date().toISOString(),
      };
      const url =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_JOINUS ||
        "https://dimitrik.app.n8n.cloud/webhook/tradie-signup";
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // non-blocking
    }
    setSubmitting(false);
    setDir(1);
    setStep(12);
  }

  // After phone verify
  function handlePhoneVerified() {
    goNext(); // go to email step
  }

  // Progress (steps 1-11)
  const progress = step >= 1 && step <= 11 ? step / TOTAL_STEPS : 0;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col">
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

            {/* Step 2 — ABN */}
            {step === 2 && (
              <StepShell key="s2" dir={dir} step={step} onBack={goBack}>
                <StepHeader label="What&apos;s your ABN?" />
                <div className="relative">
                  <MagnifyingGlass size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    value={form.abn}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, abn: e.target.value }));
                      lookupABN(e.target.value);
                    }}
                    placeholder="XX XXX XXX XXX"
                    maxLength={14}
                    className={`${INPUT} pl-12 pr-12`}
                    inputMode="numeric"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {abnLooking && <CircleNotch size={18} className="animate-spin text-orange-safety" />}
                    {abnValid && !abnLooking && <Check size={18} weight="bold" className="text-green-400" />}
                  </div>
                </div>
                {abnError && <p className="text-xs text-red-400 -mt-2">{abnError}</p>}
                {abnValid && (
                  <p className="text-xs text-green-400 -mt-2">
                    Found: <span className="font-medium">{form.businessName}</span>
                  </p>
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
                <div className="relative">
                  <Globe size={20} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://yourbusiness.com.au"
                    className={`${INPUT} pl-12`}
                    autoComplete="url"
                    autoFocus
                  />
                </div>
                <NextButton disabled={!canAdvance()} onClick={goNext} />
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
                    setStep(99); // OTP screen
                  }}
                  disabled={!canAdvance()}
                  className={`${BTN_PRIMARY} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
                >
                  Verify with SMS
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

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-heading)]">
                    You&apos;re in, {form.fullName.split(" ")[0]}!
                  </h1>
                  <p className="text-white/50 text-base max-w-md mx-auto">
                    Our team will call you within 24 hours to match you with jobs in your area.
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
