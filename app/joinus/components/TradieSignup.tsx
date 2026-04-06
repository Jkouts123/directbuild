"use client";

import { useState, useRef, useCallback } from "react";
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";
import PhoneVerify from "../../components/PhoneVerify";
import MultiSuburbSearch from "./MultiSuburbSearch";

const INPUT =
  "w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none min-h-[48px]";

const SELECT =
  "w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white focus:border-orange-safety focus:outline-none min-h-[48px] appearance-none cursor-pointer";

const LABEL = "block text-sm font-medium text-white/80 mb-1.5";

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

const YEARS_OPTIONS = ["Less than 1", "1-3", "3-5", "5-10", "10+"];

interface FormState {
  fullName: string;
  abn: string;
  businessName: string;
  tradeType: string;
  website: string;
  yearsInBusiness: string;
  locationsBasedIn: string[];
  locationsServiced: string[];
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
  locationsBasedIn: [],
  locationsServiced: [],
  phone: "",
  email: "",
};

export default function TradieSignup() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState(1); // 1=form, 2=verify, 3=success
  const [submitting, setSubmitting] = useState(false);
  const [abnLooking, setAbnLooking] = useState(false);
  const [abnError, setAbnError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const abnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ABN lookup with debounce
  const lookupABN = useCallback((abn: string) => {
    if (abnTimerRef.current) clearTimeout(abnTimerRef.current);
    const digits = abn.replace(/\s/g, "");
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
        // Response is JSONP: c({...})
        const json = JSON.parse(text.replace(/^c\(/, "").replace(/\)$/, ""));
        if (json.Abn && json.EntityName) {
          setForm((p) => ({ ...p, businessName: json.EntityName }));
          setAbnError("");
        } else if (json.Message) {
          setAbnError(json.Message);
        } else {
          setAbnError("ABN not found");
        }
      } catch {
        setAbnError("Could not verify ABN. Enter business name manually.");
      } finally {
        setAbnLooking(false);
      }
    }, 500);
  }, []);

  function handleABNChange(value: string) {
    setForm((p) => ({ ...p, abn: value }));
    lookupABN(value);
  }

  const isFormValid =
    form.fullName.trim().length > 0 &&
    form.abn.replace(/\s/g, "").length === 11 &&
    form.businessName.trim().length > 0 &&
    form.tradeType !== "" &&
    form.yearsInBusiness !== "" &&
    form.locationsBasedIn.length > 0 &&
    form.locationsServiced.length > 0 &&
    form.phone.trim().length >= 8 &&
    form.email.includes("@");

  function handleVerifyClick() {
    setStep(2);
  }

  async function handleVerified() {
    setStep(1);
    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        full_name: form.fullName,
        abn: form.abn.replace(/\s/g, ""),
        business_name: form.businessName,
        trade_type: form.tradeType,
        website: form.website || null,
        years_in_business: form.yearsInBusiness,
        locations_based_in: form.locationsBasedIn,
        locations_serviced: form.locationsServiced,
        phone: form.phone,
        email: form.email,
        verified_phone: true,
        timestamp: new Date().toISOString(),
      };

      // Placeholder n8n webhook — replace with real URL
      const webhookUrl =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_JOINUS ||
        "https://dimitrik.app.n8n.cloud/webhook/tradie-signup";

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Webhook returned", res.status);
      }

      setStep(3);
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // OTP step
  if (step === 2) {
    return (
      <PhoneVerify
        phone={form.phone}
        onVerified={handleVerified}
        onCancel={() => setStep(1)}
      />
    );
  }

  // Success step
  if (step === 3) {
    return (
      <div className="text-center py-16 sm:py-24 space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mx-auto">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-heading)]">
          Thanks {form.fullName.split(" ")[0]} — our team will call you within 24 hours.
        </h2>
        <p className="text-gray-text text-sm max-w-md mx-auto">
          We&apos;re reviewing your application now. Once approved, you&apos;ll start receiving leads
          directly to your phone.
        </p>
      </div>
    );
  }

  // Form step
  return (
    <div className="space-y-6">
      {/* Full name */}
      <div>
        <label className={LABEL}>Full name *</label>
        <div className="relative">
          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="John Smith"
            className={`${INPUT} pl-11`}
            autoComplete="name"
          />
        </div>
      </div>

      {/* ABN */}
      <div>
        <label className={LABEL}>ABN *</label>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="text"
            value={form.abn}
            onChange={(e) => handleABNChange(e.target.value)}
            placeholder="XX XXX XXX XXX"
            maxLength={14}
            className={`${INPUT} pl-11 pr-10`}
            inputMode="numeric"
          />
          {abnLooking && (
            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-orange-safety" />
          )}
        </div>
        {abnError && <p className="text-xs text-red-400 mt-1">{abnError}</p>}
        {!abnError && form.businessName && form.abn.replace(/\s/g, "").length === 11 && (
          <p className="text-xs text-green-400 mt-1">
            Found: {form.businessName}
          </p>
        )}
      </div>

      {/* Business name */}
      <div>
        <label className={LABEL}>Business name *</label>
        <div className="relative">
          <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
            placeholder="Auto-filled from ABN lookup"
            className={`${INPUT} pl-11`}
          />
        </div>
      </div>

      {/* Trade type */}
      <div>
        <label className={LABEL}>Trade type *</label>
        <div className="relative">
          <select
            value={form.tradeType}
            onChange={(e) => setForm((p) => ({ ...p, tradeType: e.target.value }))}
            className={SELECT}
          >
            <option value="" disabled>
              Select your trade...
            </option>
            {TRADE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Website */}
      <div>
        <label className={LABEL}>Business website <span className="text-gray-text font-normal">(optional)</span></label>
        <div className="relative">
          <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://www.example.com.au"
            className={`${INPUT} pl-11`}
            autoComplete="url"
          />
        </div>
      </div>

      {/* Years in business */}
      <div>
        <label className={LABEL}>Years in business *</label>
        <select
          value={form.yearsInBusiness}
          onChange={(e) => setForm((p) => ({ ...p, yearsInBusiness: e.target.value }))}
          className={SELECT}
        >
          <option value="" disabled>
            Select...
          </option>
          {YEARS_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Locations based in */}
      <div>
        <label className={LABEL}>Locations based in *</label>
        <MultiSuburbSearch
          values={form.locationsBasedIn}
          onChange={(v) => setForm((p) => ({ ...p, locationsBasedIn: v }))}
          placeholder="Search where you're based..."
        />
      </div>

      {/* Locations serviced */}
      <div>
        <label className={LABEL}>Locations serviced *</label>
        <MultiSuburbSearch
          values={form.locationsServiced}
          onChange={(v) => setForm((p) => ({ ...p, locationsServiced: v }))}
          placeholder="Search areas you service..."
        />
      </div>

      {/* Phone */}
      <div>
        <label className={LABEL}>Phone number *</label>
        <div className="relative">
          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="04XX XXX XXX"
            className={`${INPUT} pl-11`}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={LABEL}>Email address *</label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text pointer-events-none" />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="john@example.com.au"
            className={`${INPUT} pl-11`}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <p className="text-sm text-red-400 text-center bg-red-400/10 rounded-lg px-4 py-3">
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleVerifyClick}
        disabled={!isFormValid || submitting}
        className={`w-full flex items-center justify-center gap-2 rounded-lg bg-orange-safety px-6 min-h-[56px] text-base font-bold text-black-deep hover:bg-orange-hover cursor-pointer ${
          !isFormValid || submitting ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Verify phone & submit
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <p className="text-xs text-gray-text text-center">
        We&apos;ll send a quick SMS to verify your number. Your details are kept private.
      </p>
    </div>
  );
}
