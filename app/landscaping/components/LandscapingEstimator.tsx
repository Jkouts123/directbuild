"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  X,
  CheckCircle2,
} from "lucide-react";
import FAQ from "./FAQ";
import SuburbSearch, { type SuburbEntry } from "./SuburbSearch";
import { generateEstimate, type EstimateResult } from "../../actions/generate-estimate";
import LoadingPulse from "../../components/LoadingPulse";
import LeadCapture from "../../components/LeadCapture";
import { trackFacebookLead } from "../../components/FacebookPixel";
import {
  BTN_NEXT,
  BTN_BACK,
  TILE,
  TILE_SELECTED,
  CHECKBOX_LABEL,
  UPLOAD_BTN_LARGE,
} from "../../components/brand-styles";

// ── Types ──────────────────────────────────────────────────────────────
type Service = "Turf" | "Paving" | "Retaining Walls" | "Decking";
type SizePreset = "small" | "medium" | "large" | "estate";
type AccessWidth = "doorway" | "1m-path" | "wide-open";
type Slope = "flat" | "slight" | "steep";
type SiteState = "clean-dirt" | "old-concrete" | "heavy-overgrowth";

const SIZE_OPTIONS: { value: SizePreset; label: string; desc: string }[] = [
  { value: "small", label: "Small", desc: "Courtyard / Small Patch — up to 30m²" },
  { value: "medium", label: "Medium", desc: "Standard Backyard — ~30–80m²" },
  { value: "large", label: "Large", desc: "Large Property — 80–150m²" },
  { value: "estate", label: "Estate", desc: "Over 150m²" },
];

const ACCESS_OPTIONS: { value: AccessWidth; label: string }[] = [
  { value: "doorway", label: "Standard Doorway (narrow — hand digging only)" },
  { value: "1m-path", label: "1m Side Path (tight — small machinery)" },
  { value: "wide-open", label: "Wide Open Access (truck / excavator)" },
];

const SLOPE_OPTIONS: { value: Slope; label: string }[] = [
  { value: "flat", label: "Perfectly Flat" },
  { value: "slight", label: "Slight Slope" },
  { value: "steep", label: "Steep / Requires Retaining" },
];

const SITE_STATE_OPTIONS: { value: SiteState; label: string }[] = [
  { value: "clean-dirt", label: "Clean Dirt (ready to go)" },
  { value: "old-concrete", label: "Old Concrete / Pavers to Remove" },
  { value: "heavy-overgrowth", label: "Heavy Overgrowth / Trees to Clear" },
];

interface FormState {
  suburb: string;
  suburbState: string;
  postcode: string;
  services: Service[];
  sizePreset: SizePreset | "";
  turfType: string;
  pavingMaterial: string;
  wallMaterial: string;
  deckingMaterial: string;
  accessWidth: AccessWidth | "";
  slope: Slope | "";
  siteState: SiteState | "";
  photos: string[];
  firstName: string;
  phone: string;
  email: string;
}

const INITIAL: FormState = {
  suburb: "",
  suburbState: "",
  postcode: "",
  services: [],
  sizePreset: "",
  turfType: "",
  pavingMaterial: "",
  wallMaterial: "",
  deckingMaterial: "",
  accessWidth: "",
  slope: "",
  siteState: "",
  photos: [],
  firstName: "",
  phone: "",
  email: "",
};

const RADIO_LABEL =
  "flex items-center gap-3 rounded-lg border border-gray-light bg-gray-mid px-4 min-h-[48px] cursor-pointer hover:border-orange-safety/50 text-sm";

// ── Progress Bar ───────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < step ? "bg-orange-safety" : "bg-gray-light"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function LandscapingEstimator() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── helpers ──
  function toggleService(s: Service) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(s)
        ? prev.services.filter((x) => x !== s)
        : [...prev.services, s],
    }));
  }

  function autoAdvance(setter: () => void) {
    setter();
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 350);
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return form.suburb.trim().length > 0 && form.services.length > 0;
      case 2:
        return form.sizePreset !== "";
      case 3: {
        for (const s of form.services) {
          if (s === "Turf" && !form.turfType) return false;
          if (s === "Paving" && !form.pavingMaterial) return false;
          if (s === "Retaining Walls" && !form.wallMaterial) return false;
          if (s === "Decking" && !form.deckingMaterial) return false;
        }
        return true;
      }
      case 4:
        return form.accessWidth !== "" && form.slope !== "" && form.siteState !== "";
      default:
        return true;
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - form.photos.length;
    const toProcess = files.slice(0, remaining);

    const base64Promises = toProcess.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );

    const results = await Promise.all(base64Promises);
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...results].slice(0, 3),
    }));
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await generateEstimate({
        serviceType: "landscaping",
        formData: {
          suburb: form.suburb,
          suburbState: form.suburbState,
          postcode: form.postcode,
          services: form.services,
          sizePreset: form.sizePreset,
          turfType: form.services.includes("Turf") ? form.turfType : undefined,
          pavingMaterial: form.services.includes("Paving") ? form.pavingMaterial : undefined,
          wallMaterial: form.services.includes("Retaining Walls") ? form.wallMaterial : undefined,
          deckingMaterial: form.services.includes("Decking") ? form.deckingMaterial : undefined,
          accessWidth: form.accessWidth,
          slope: form.slope,
          siteState: form.siteState,
        },
        images: form.photos.length > 0 ? form.photos : undefined,
        contact: {
          firstName: form.firstName,
          phone: form.phone,
          email: form.email,
        },
      });
      setResult(res);
      trackFacebookLead();
      setStep(8);
    } catch (err) {
      console.error("Estimate failed:", err);
      setSubmitError("Something went wrong generating your estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Loading overlay ──
  if (loading) {
    return <LoadingPulse service="landscaping" />;
  }

  // ── Step 0: FAQ + Intro ──
  if (step === 0) {
    return (
      <div className="space-y-8">
        <div>
          <button onClick={() => setStep(1)} className={`${BTN_NEXT} w-full sm:w-auto px-10 min-h-[56px] text-base`}>
            Start Your Free Quote
            <ArrowRight size={18} />
          </button>
        </div>
        <FAQ />
      </div>
    );
  }

  // ── Step 7: Contact Details — Full-screen mobile takeover ──
  if (step === 7) {
    return (
      <LeadCapture
        firstName={form.firstName}
        phone={form.phone}
        email={form.email}
        onFirstNameChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
        onPhoneChange={(v) => setForm((p) => ({ ...p, phone: v }))}
        onEmailChange={(v) => setForm((p) => ({ ...p, email: v }))}
        onSubmit={handleSubmit}
        onBack={() => setStep(6)}
        loading={loading}
        serviceName="Landscaping"
        error={submitError}
      />
    );
  }

  // ── Step 8: Quote Result ──
  if (step === 8 && result) {
    const needsExcavation = form.siteState === "old-concrete" || form.slope === "steep";
    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-orange-safety" size={28} />
          <h3 className="text-xl font-bold text-white">
            Your Landscaping Estimate
          </h3>
        </div>

        <p className="text-sm text-gray-text">
          Suburb: <span className="text-white font-medium">{form.suburb}</span>
        </p>

        {/* Price range */}
        <div className="rounded-xl border border-orange-safety/30 bg-orange-safety/5 p-5 text-center space-y-2">
          <p className="text-sm text-gray-text">Estimated Range</p>
          <p className="text-3xl font-extrabold text-orange-safety">
            ${result.minPrice.toLocaleString()} &ndash; ${result.maxPrice.toLocaleString()}
          </p>
          <p className="text-xs text-gray-text">
            Centre estimate: ${result.centerPrice.toLocaleString()}
          </p>
        </div>

        {needsExcavation && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <p className="text-sm font-semibold text-amber-400">
              Includes Excavation & Waste Removal
            </p>
            <p className="text-xs text-gray-text mt-1">
              Your site conditions require demolition, excavation, or heavy clearing.
              This typically adds $2,000–$5,000 to the total cost.
            </p>
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-gray-text leading-relaxed">{result.summary}</p>

        {/* Line items */}
        <div className="space-y-3">
          {result.lineItems.map((li, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-gray-light bg-gray-mid px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{li.label}</p>
                <p className="text-xs text-gray-text">{li.description}</p>
              </div>
              <p className="text-sm font-bold text-white">
                ${li.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-text italic">{result.disclaimer}</p>

        <button
          onClick={() => {
            setStep(0);
            setForm(INITIAL);
            setResult(null);
          }}
          className={BTN_BACK}
        >
          <ArrowLeft size={16} />
          Start Over
        </button>
      </div>
    );
  }

  // ── Steps 1–6 ──
  return (
    <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8">
      <ProgressBar step={step} total={7} />

      {/* ── Step 1: Suburb + Service Selection ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              What do you need?
            </h3>
            <p className="text-sm text-gray-text">
              Select your suburb and services to get started.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Suburb *
            </label>
            <SuburbSearch
              value={form.suburb}
              onChange={(display: string, entry: SuburbEntry) =>
                setForm((p) => ({
                  ...p,
                  suburb: display,
                  suburbState: entry.state,
                  postcode: entry.postcode,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Services Required *
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                ["Turf", "Paving", "Retaining Walls", "Decking"] as Service[]
              ).map((s) => (
                <label key={s} className={CHECKBOX_LABEL}>
                  <input
                    type="checkbox"
                    checked={form.services.includes(s)}
                    onChange={() => toggleService(s)}
                    className="h-4 w-4 rounded border-gray-light bg-gray-mid text-orange-safety accent-orange-safety"
                  />
                  <span className="text-sm text-white">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canAdvance()}
              className={`${BTN_NEXT} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Select Size ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              How big is the area?
            </h3>
            <p className="text-sm text-gray-text">
              Select the size that best matches your project.
            </p>
          </div>

          <div className="grid gap-3">
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, sizePreset: opt.value }))
                  )
                }
                className={form.sizePreset === opt.value ? TILE_SELECTED : TILE}
              >
                <div>
                  <p className="font-semibold text-white">{opt.label}</p>
                  <p className="text-xs text-gray-text">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canAdvance()}
              className={`${BTN_NEXT} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Material Selection ── */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Choose your materials
            </h3>
            <p className="text-sm text-gray-text">
              Select a material for each service.
            </p>
          </div>

          {form.services.includes("Turf") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">
                Turf Type
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {["Sir Walter", "Kikuyu", "Synthetic", "Not Sure"].map((t) => (
                  <label key={t} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="turfType"
                      checked={form.turfType === t}
                      onChange={() =>
                        setForm((p) => ({ ...p, turfType: t }))
                      }
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {form.services.includes("Paving") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">
                Paving Material
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {["Concrete", "Brick", "Natural Stone", "Not Sure"].map((m) => (
                  <label key={m} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="pavingMaterial"
                      checked={form.pavingMaterial === m}
                      onChange={() =>
                        setForm((p) => ({ ...p, pavingMaterial: m }))
                      }
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {form.services.includes("Retaining Walls") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">
                Wall Material
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {["Timber", "Concrete", "Besser Block", "Not Sure"].map((m) => (
                  <label key={m} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="wallMaterial"
                      checked={form.wallMaterial === m}
                      onChange={() =>
                        setForm((p) => ({ ...p, wallMaterial: m }))
                      }
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {form.services.includes("Decking") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">
                Decking Material
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {["Merbau", "Treated Pine", "Composite", "Not Sure"].map((m) => (
                  <label key={m} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="deckingMaterial"
                      checked={form.deckingMaterial === m}
                      onChange={() =>
                        setForm((p) => ({ ...p, deckingMaterial: m }))
                      }
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canAdvance()}
              className={`${BTN_NEXT} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Site Condition ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Site Conditions
            </h3>
            <p className="text-sm text-gray-text">
              These details affect machinery, labour, and waste costs.
            </p>
          </div>

          {/* Access Width */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              How wide is the narrowest access to the yard? *
            </label>
            <div className="grid gap-3">
              {ACCESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setForm((p) => ({ ...p, accessWidth: opt.value }))
                  }
                  className={form.accessWidth === opt.value ? TILE_SELECTED : TILE}
                >
                  <span className="text-white text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slope */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              How flat is the area? *
            </label>
            <div className="grid gap-3">
              {SLOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setForm((p) => ({ ...p, slope: opt.value }))
                  }
                  className={form.slope === opt.value ? TILE_SELECTED : TILE}
                >
                  <span className="text-white text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current State */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              What is there now? *
            </label>
            <div className="grid gap-3">
              {SITE_STATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setForm((p) => ({ ...p, siteState: opt.value }))
                  }
                  className={form.siteState === opt.value ? TILE_SELECTED : TILE}
                >
                  <span className="text-white text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Excavation warning */}
          {(form.siteState === "old-concrete" || form.slope === "steep") && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <p className="text-sm text-amber-400">
                Your site may require excavation, demolition, or machinery — this will be included in your quote.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              disabled={!canAdvance()}
              className={`${BTN_NEXT} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Photos ── */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Site Photos
            </h3>
            <p className="text-sm text-gray-text">
              Upload at least one photo so we can verify slope, access, and existing structures. (Up to 3)
            </p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {form.photos.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={UPLOAD_BTN_LARGE}
              >
                <Camera size={28} />
                Upload Site Photos ({form.photos.length}/3)
              </button>
            )}

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {form.photos.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`Site photo ${i + 1}`}
                      className="h-24 w-full rounded-lg object-cover border border-gray-light"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(4)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(6)}
              disabled={form.photos.length === 0}
              className={`${BTN_NEXT} ${form.photos.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 6: Review ── */}
      {step === 6 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Review Your Details
            </h3>
            <p className="text-sm text-gray-text">
              Confirm everything before we generate your estimate.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
              <p className="text-xs text-gray-text">Suburb</p>
              <p className="text-sm font-medium text-white">{form.suburb}</p>
              <p className="text-xs text-gray-text mt-0.5">
                {form.suburbState} &middot; {form.postcode}
              </p>
            </div>

            <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
              <p className="text-xs text-gray-text">Services</p>
              <p className="text-sm font-medium text-white">
                {form.services.join(", ")}
              </p>
            </div>

            <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
              <p className="text-xs text-gray-text">Project Size</p>
              <p className="text-sm font-medium text-white">
                {SIZE_OPTIONS.find((o) => o.value === form.sizePreset)?.label} —{" "}
                {SIZE_OPTIONS.find((o) => o.value === form.sizePreset)?.desc}
              </p>
            </div>

            {form.services.includes("Turf") && (
              <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
                <p className="text-xs text-gray-text">Turf</p>
                <p className="text-sm font-medium text-white">{form.turfType}</p>
              </div>
            )}

            {form.services.includes("Paving") && (
              <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
                <p className="text-xs text-gray-text">Paving</p>
                <p className="text-sm font-medium text-white">{form.pavingMaterial}</p>
              </div>
            )}

            {form.services.includes("Retaining Walls") && (
              <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
                <p className="text-xs text-gray-text">Retaining Walls</p>
                <p className="text-sm font-medium text-white">{form.wallMaterial}</p>
              </div>
            )}

            {form.services.includes("Decking") && (
              <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
                <p className="text-xs text-gray-text">Decking</p>
                <p className="text-sm font-medium text-white">{form.deckingMaterial}</p>
              </div>
            )}

            <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
              <p className="text-xs text-gray-text">Site Conditions</p>
              <p className="text-sm font-medium text-white">
                Access: {ACCESS_OPTIONS.find((o) => o.value === form.accessWidth)?.label}
              </p>
              <p className="text-sm font-medium text-white">
                Slope: {SLOPE_OPTIONS.find((o) => o.value === form.slope)?.label}
              </p>
              <p className="text-sm font-medium text-white">
                Current state: {SITE_STATE_OPTIONS.find((o) => o.value === form.siteState)?.label}
              </p>
            </div>

            {form.photos.length > 0 && (
              <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
                <p className="text-xs text-gray-text mb-2">
                  Photos ({form.photos.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {form.photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Site photo ${i + 1}`}
                      className="h-16 w-full rounded object-cover border border-gray-light"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(5)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button onClick={() => setStep(7)} className={BTN_NEXT}>
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
