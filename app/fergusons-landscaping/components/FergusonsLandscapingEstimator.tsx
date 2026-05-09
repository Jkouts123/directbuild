"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import SuburbSearch, { type SuburbEntry } from "../../landscaping/components/SuburbSearch";
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
  INPUT,
} from "../../components/brand-styles";

// ── Constants ──────────────────────────────────────────────────────────
const SCOPES = [
  "Backyard transformation",
  "Front yard transformation",
  "Paving",
  "Turf",
  "Retaining walls",
  "Drainage",
  "Planting",
  "Irrigation",
  "Fencing",
  "Pool surrounds",
  "Tree removal",
  "Demolition/removal",
  "Lighting",
  "Outdoor upgrade",
  "Not sure",
] as const;
type Scope = (typeof SCOPES)[number];

const ZONES = [
  "Front yard",
  "Backyard",
  "Side yard",
  "Pool area",
  "Driveway",
  "Full property",
] as const;
type Zone = (typeof ZONES)[number];

type SizePreset = "small" | "medium" | "large" | "estate";
const SIZE_OPTIONS: { value: SizePreset; label: string; desc: string }[] = [
  { value: "small", label: "Small", desc: "Courtyard / single area — up to 30m²" },
  { value: "medium", label: "Medium", desc: "Standard backyard — 30–80m²" },
  { value: "large", label: "Large", desc: "Large property — 80–150m²" },
  { value: "estate", label: "Estate", desc: "Estate / acreage — 150m²+" },
];

const TURF_OPTIONS = ["Sir Walter", "Kikuyu", "Couch", "Synthetic", "Not sure"];
const PAVING_OPTIONS = [
  "Concrete paver",
  "Brick",
  "Porcelain",
  "Natural stone",
  "Sandstone",
  "Limestone",
  "Not sure",
];
const RETAINING_OPTIONS = [
  "Timber sleepers",
  "Concrete sleepers",
  "Stone",
  "Block",
  "Not sure",
];
const FENCING_OPTIONS = ["Timber", "Colorbond", "Aluminium", "Not sure"];

type AccessWidth = "wide-easy" | "standard" | "tight-side" | "very-tight" | "unknown";
const ACCESS_OPTIONS: { value: AccessWidth; label: string }[] = [
  { value: "wide-easy", label: "Wide / easy access" },
  { value: "standard", label: "Standard access" },
  { value: "tight-side", label: "Tight side access" },
  { value: "very-tight", label: "Very tight / manual only" },
  { value: "unknown", label: "Unknown" },
];

type MachineryAccess = "easy" | "limited" | "not-possible" | "unknown";
const MACHINERY_OPTIONS: { value: MachineryAccess; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "limited", label: "Limited" },
  { value: "not-possible", label: "Not possible" },
  { value: "unknown", label: "Unknown" },
];

type Slope = "flat" | "slight" | "moderate" | "steep" | "unknown";
const SLOPE_OPTIONS: { value: Slope; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "slight", label: "Slight slope" },
  { value: "moderate", label: "Moderate slope" },
  { value: "steep", label: "Steep" },
  { value: "unknown", label: "Unknown" },
];

type Drainage = "none-known" | "minor" | "moderate" | "severe" | "unknown";
const DRAINAGE_OPTIONS: { value: Drainage; label: string }[] = [
  { value: "none-known", label: "No known drainage issues" },
  { value: "minor", label: "Minor pooling / wet spots" },
  { value: "moderate", label: "Moderate drainage issues" },
  { value: "severe", label: "Severe — water sits or floods" },
  { value: "unknown", label: "Unknown" },
];

const EXISTING_CONDITIONS = [
  "Old paving to remove",
  "Old turf to remove",
  "Existing retaining to remove",
  "Garden clearing",
  "Concrete breaking",
  "Possible service obstructions",
] as const;
type ExistingCondition = (typeof EXISTING_CONDITIONS)[number];

type Timeline = "asap" | "1-3" | "3-6" | "exploring";
const TIMELINE_OPTIONS: { value: Timeline; label: string }[] = [
  { value: "asap", label: "ASAP" },
  { value: "1-3", label: "1–3 months" },
  { value: "3-6", label: "3–6 months" },
  { value: "exploring", label: "Just exploring" },
];

type Budget =
  | "under-10k"
  | "10-25k"
  | "25-50k"
  | "50-100k"
  | "100k+"
  | "not-sure";
const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: "under-10k", label: "Under $10k" },
  { value: "10-25k", label: "$10k – $25k" },
  { value: "25-50k", label: "$25k – $50k" },
  { value: "50-100k", label: "$50k – $100k" },
  { value: "100k+", label: "$100k+" },
  { value: "not-sure", label: "Not sure" },
];

interface FormState {
  suburb: string;
  suburbState: string;
  postcode: string;
  scopes: Scope[];
  zones: Zone[];
  sizePreset: SizePreset | "";
  totalAreaSqm: string;
  turfAreaSqm: string;
  pavingAreaSqm: string;
  retainingLengthM: string;
  retainingMaxHeightM: string;
  fencingLengthM: string;
  treeCount: string;
  turfType: string;
  pavingMaterial: string;
  retainingMaterial: string;
  fencingMaterial: string;
  accessWidth: AccessWidth | "";
  machineryAccess: MachineryAccess | "";
  slope: Slope | "";
  drainage: Drainage | "";
  existingConditions: ExistingCondition[];
  timeline: Timeline | "";
  budget: Budget | "";
  photos: string[];
  firstName: string;
  phone: string;
  email: string;
}

const INITIAL: FormState = {
  suburb: "",
  suburbState: "",
  postcode: "",
  scopes: [],
  zones: [],
  sizePreset: "",
  totalAreaSqm: "",
  turfAreaSqm: "",
  pavingAreaSqm: "",
  retainingLengthM: "",
  retainingMaxHeightM: "",
  fencingLengthM: "",
  treeCount: "",
  turfType: "",
  pavingMaterial: "",
  retainingMaterial: "",
  fencingMaterial: "",
  accessWidth: "",
  machineryAccess: "",
  slope: "",
  drainage: "",
  existingConditions: [],
  timeline: "",
  budget: "",
  photos: [],
  firstName: "",
  phone: "",
  email: "",
};

const RADIO_LABEL =
  "flex items-center gap-3 rounded-lg border border-gray-light bg-gray-mid px-4 min-h-[48px] cursor-pointer hover:border-orange-safety/50 text-sm";

const TOTAL_STEPS = 7;

// Soft warning threshold: keeps base64 payload comfortably under the 4MB
// server-action body limit (base64 carries ~33% overhead).
const PAYLOAD_WARN_THRESHOLD = 3_500_000;

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

// ── Image compression ──────────────────────────────────────────────────
async function compressImage(
  file: File,
  maxDim = 1000,
  quality = 0.6,
): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(dataUrl);
  } catch {
    return dataUrl; // unreadable image — fall back to original
  }
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = src;
  });
}

// ── Main Component ─────────────────────────────────────────────────────
export default function FergusonsLandscapingEstimator() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalPayloadSize = form.photos.reduce((sum, p) => sum + p.length, 0);
  const payloadTooLarge = totalPayloadSize > PAYLOAD_WARN_THRESHOLD;

  function toggleScope(s: Scope) {
    setForm((prev) => {
      const has = prev.scopes.includes(s);
      let next: Scope[];
      if (s === "Not sure") {
        next = has ? [] : ["Not sure"];
      } else if (has) {
        next = prev.scopes.filter((x) => x !== s);
      } else {
        next = [...prev.scopes.filter((x) => x !== "Not sure"), s];
      }
      return { ...prev, scopes: next };
    });
  }

  function toggleZone(z: Zone) {
    setForm((prev) => {
      const has = prev.zones.includes(z);
      let next: Zone[];
      if (z === "Full property") {
        next = has ? [] : ["Full property"];
      } else if (has) {
        next = prev.zones.filter((x) => x !== z);
      } else {
        next = [...prev.zones.filter((x) => x !== "Full property"), z];
      }
      return { ...prev, zones: next };
    });
  }

  function toggleExisting(c: ExistingCondition) {
    setForm((prev) => ({
      ...prev,
      existingConditions: prev.existingConditions.includes(c)
        ? prev.existingConditions.filter((x) => x !== c)
        : [...prev.existingConditions, c],
    }));
  }

  function showMaterialsStep(): boolean {
    return (
      form.scopes.includes("Turf") ||
      form.scopes.includes("Paving") ||
      form.scopes.includes("Retaining walls") ||
      form.scopes.includes("Fencing")
    );
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return form.suburb.trim().length > 0 && form.scopes.length > 0;
      case 2:
        return form.zones.length > 0 && form.sizePreset !== "";
      case 3: {
        if (form.scopes.includes("Turf") && !form.turfType) return false;
        if (form.scopes.includes("Paving") && !form.pavingMaterial) return false;
        if (form.scopes.includes("Retaining walls") && !form.retainingMaterial) return false;
        if (form.scopes.includes("Fencing") && !form.fencingMaterial) return false;
        return true;
      }
      case 4:
        return (
          form.accessWidth !== "" &&
          form.machineryAccess !== "" &&
          form.slope !== "" &&
          form.drainage !== ""
        );
      case 5:
        return form.timeline !== "" && form.budget !== "";
      case 6:
        return form.photos.length > 0 && !compressing;
      default:
        return true;
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - form.photos.length;
    const toProcess = files.slice(0, remaining);

    setCompressing(true);
    try {
      const compressed = await Promise.all(toProcess.map((f) => compressImage(f)));
      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...compressed].slice(0, 5),
      }));
    } catch (err) {
      console.error("Photo compression failed:", err);
    } finally {
      setCompressing(false);
      // Reset input so re-selecting the same file still triggers onChange
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setSubmitError("");
    try {
      const res = await generateEstimate({
        serviceType: "landscaping",
        formData: {
          sourcePage: "/fergusons-landscaping",
          partnerName: "Ferguson's Landscapes",
          projectIntent: "sydney_premium_landscaping_cost_check",
          suburb: form.suburb,
          suburbState: form.suburbState,
          postcode: form.postcode,
          scopes: form.scopes,
          zones: form.zones,
          sizePreset: form.sizePreset,
          totalAreaSqm: form.totalAreaSqm || undefined,
          turfAreaSqm: form.turfAreaSqm || undefined,
          pavingAreaSqm: form.pavingAreaSqm || undefined,
          retainingLengthM: form.retainingLengthM || undefined,
          retainingMaxHeightM: form.retainingMaxHeightM || undefined,
          fencingLengthM: form.fencingLengthM || undefined,
          treeCount: form.treeCount || undefined,
          turfType: form.scopes.includes("Turf") ? form.turfType : undefined,
          pavingMaterial: form.scopes.includes("Paving") ? form.pavingMaterial : undefined,
          retainingMaterial: form.scopes.includes("Retaining walls")
            ? form.retainingMaterial
            : undefined,
          fencingMaterial: form.scopes.includes("Fencing") ? form.fencingMaterial : undefined,
          accessWidth: form.accessWidth,
          machineryAccess: form.machineryAccess,
          slope: form.slope,
          drainage: form.drainage,
          existingConditions: form.existingConditions,
          timeline: form.timeline,
          budget: form.budget,
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
      setStep(9);
    } catch (err) {
      console.error("Estimate failed:", err);
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong generating your estimate. Please try again.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingPulse service="landscaping" />;
  }

  // ── Step 8: Lead capture ──
  if (step === 8) {
    return (
      <LeadCapture
        firstName={form.firstName}
        phone={form.phone}
        email={form.email}
        onFirstNameChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
        onPhoneChange={(v) => setForm((p) => ({ ...p, phone: v }))}
        onEmailChange={(v) => setForm((p) => ({ ...p, email: v }))}
        onSubmit={handleSubmit}
        onBack={() => setStep(7)}
        loading={loading}
        serviceName="Landscaping"
        error={submitError}
      />
    );
  }

  // ── Step 9: Result ──
  if (step === 9 && result) {
    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-orange-safety" size={28} />
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Your AI-assisted preliminary quote estimate
          </h3>
        </div>

        <p className="text-sm text-gray-text">
          Suburb: <span className="text-white font-medium">{form.suburb}</span>
        </p>

        <div className="rounded-xl border border-orange-safety/30 bg-orange-safety/5 p-5 text-center space-y-2">
          <p className="text-sm text-gray-text">Estimated range</p>
          <p className="text-3xl font-extrabold text-orange-safety">
            ${result.minPrice.toLocaleString()} &ndash; ${result.maxPrice.toLocaleString()}
          </p>
          <p className="text-xs text-gray-text">
            Centre estimate: ${result.centerPrice.toLocaleString()}
          </p>
        </div>

        <p className="text-sm text-gray-text leading-relaxed">{result.summary}</p>

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

        <p className="text-xs text-gray-text italic leading-relaxed">
          This is an AI-assisted preliminary quote estimate, not a final fixed quote. Final
          pricing may change after site inspection, measurements, access review, design
          decisions and confirmation of scope.
        </p>

        <button
          onClick={() => {
            setStep(1);
            setForm(INITIAL);
            setResult(null);
          }}
          className={BTN_BACK}
        >
          <ArrowLeft size={16} />
          Start over
        </button>
      </div>
    );
  }

  // ── Steps 1–7 ──
  return (
    <div
      id="estimator"
      className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8"
    >
      <ProgressBar step={Math.min(step, TOTAL_STEPS)} total={TOTAL_STEPS} />

      {/* Step 1: Suburb + scopes */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Where and what?</h3>
            <p className="text-sm text-gray-text">
              Tell us your Sydney suburb and what you&apos;re thinking about. Pick all that
              apply.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Sydney suburb *
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
              Project scope (multi-select) *
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {SCOPES.map((s) => (
                <label key={s} className={CHECKBOX_LABEL}>
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(s)}
                    onChange={() => toggleScope(s)}
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

      {/* Step 2: Zones + sizing */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Zones &amp; sizing</h3>
            <p className="text-sm text-gray-text">
              Where on the property and roughly how big? Optional measurements help us narrow
              the estimate.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Project zones (multi-select) *
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {ZONES.map((z) => (
                <label key={z} className={CHECKBOX_LABEL}>
                  <input
                    type="checkbox"
                    checked={form.zones.includes(z)}
                    onChange={() => toggleZone(z)}
                    className="h-4 w-4 rounded border-gray-light bg-gray-mid text-orange-safety accent-orange-safety"
                  />
                  <span className="text-sm text-white">{z}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Approximate project size *
            </label>
            <div className="grid gap-3">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm((p) => ({ ...p, sizePreset: opt.value }))}
                  className={form.sizePreset === opt.value ? TILE_SELECTED : TILE}
                >
                  <div>
                    <p className="font-semibold text-white">{opt.label}</p>
                    <p className="text-xs text-gray-text">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Optional measurements (leave blank if unsure)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Total project area (m²)"
                value={form.totalAreaSqm}
                onChange={(v) => setForm((p) => ({ ...p, totalAreaSqm: v }))}
              />
              {form.scopes.includes("Turf") && (
                <NumberField
                  label="Turf area (m²)"
                  value={form.turfAreaSqm}
                  onChange={(v) => setForm((p) => ({ ...p, turfAreaSqm: v }))}
                />
              )}
              {form.scopes.includes("Paving") && (
                <NumberField
                  label="Paving area (m²)"
                  value={form.pavingAreaSqm}
                  onChange={(v) => setForm((p) => ({ ...p, pavingAreaSqm: v }))}
                />
              )}
              {form.scopes.includes("Retaining walls") && (
                <>
                  <NumberField
                    label="Retaining wall length (m)"
                    value={form.retainingLengthM}
                    onChange={(v) => setForm((p) => ({ ...p, retainingLengthM: v }))}
                  />
                  <NumberField
                    label="Retaining wall max height (m)"
                    value={form.retainingMaxHeightM}
                    onChange={(v) => setForm((p) => ({ ...p, retainingMaxHeightM: v }))}
                  />
                </>
              )}
              {form.scopes.includes("Fencing") && (
                <NumberField
                  label="Fencing length (m)"
                  value={form.fencingLengthM}
                  onChange={(v) => setForm((p) => ({ ...p, fencingLengthM: v }))}
                />
              )}
              {form.scopes.includes("Tree removal") && (
                <NumberField
                  label="Trees to remove (count)"
                  value={form.treeCount}
                  onChange={(v) => setForm((p) => ({ ...p, treeCount: v }))}
                />
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(showMaterialsStep() ? 3 : 4)}
              disabled={!canAdvance()}
              className={`${BTN_NEXT} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Materials */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Material preferences</h3>
            <p className="text-sm text-gray-text">
              Choose any preferences you have. Pick &quot;Not sure&quot; if you&apos;d like
              guidance.
            </p>
          </div>

          {form.scopes.includes("Turf") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">Turf</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {TURF_OPTIONS.map((t) => (
                  <label key={t} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="turfType"
                      checked={form.turfType === t}
                      onChange={() => setForm((p) => ({ ...p, turfType: t }))}
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {form.scopes.includes("Paving") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">Paving</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAVING_OPTIONS.map((m) => (
                  <label key={m} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="pavingMaterial"
                      checked={form.pavingMaterial === m}
                      onChange={() => setForm((p) => ({ ...p, pavingMaterial: m }))}
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {form.scopes.includes("Retaining walls") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">
                Retaining walls
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {RETAINING_OPTIONS.map((m) => (
                  <label key={m} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="retainingMaterial"
                      checked={form.retainingMaterial === m}
                      onChange={() => setForm((p) => ({ ...p, retainingMaterial: m }))}
                      className="accent-orange-safety"
                    />
                    <span className="text-white">{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {form.scopes.includes("Fencing") && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-orange-safety mb-1">Fencing</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {FENCING_OPTIONS.map((m) => (
                  <label key={m} className={RADIO_LABEL}>
                    <input
                      type="radio"
                      name="fencingMaterial"
                      checked={form.fencingMaterial === m}
                      onChange={() => setForm((p) => ({ ...p, fencingMaterial: m }))}
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

      {/* Step 4: Site conditions */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Site conditions</h3>
            <p className="text-sm text-gray-text">
              These details affect access, machinery, labour, drainage and waste costs.
            </p>
          </div>

          <ConditionGroup
            label="Property access *"
            options={ACCESS_OPTIONS}
            value={form.accessWidth}
            onChange={(v) => setForm((p) => ({ ...p, accessWidth: v }))}
          />
          <ConditionGroup
            label="Machinery access *"
            options={MACHINERY_OPTIONS}
            value={form.machineryAccess}
            onChange={(v) => setForm((p) => ({ ...p, machineryAccess: v }))}
          />
          <ConditionGroup
            label="Slope *"
            options={SLOPE_OPTIONS}
            value={form.slope}
            onChange={(v) => setForm((p) => ({ ...p, slope: v }))}
          />
          <ConditionGroup
            label="Drainage *"
            options={DRAINAGE_OPTIONS}
            value={form.drainage}
            onChange={(v) => setForm((p) => ({ ...p, drainage: v }))}
          />

          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Existing conditions (multi-select)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {EXISTING_CONDITIONS.map((c) => (
                <label key={c} className={CHECKBOX_LABEL}>
                  <input
                    type="checkbox"
                    checked={form.existingConditions.includes(c)}
                    onChange={() => toggleExisting(c)}
                    className="h-4 w-4 rounded border-gray-light bg-gray-mid text-orange-safety accent-orange-safety"
                  />
                  <span className="text-sm text-white">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(showMaterialsStep() ? 3 : 2)}
              className={BTN_BACK}
            >
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

      {/* Step 5: Timeline + budget */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Timeline &amp; budget</h3>
            <p className="text-sm text-gray-text">
              These help us pitch the right scope and contractor for your project.
            </p>
          </div>

          <ConditionGroup
            label="When would you like to start? *"
            options={TIMELINE_OPTIONS}
            value={form.timeline}
            onChange={(v) => setForm((p) => ({ ...p, timeline: v }))}
          />

          <ConditionGroup
            label="Budget band *"
            options={BUDGET_OPTIONS}
            value={form.budget}
            onChange={(v) => setForm((p) => ({ ...p, budget: v }))}
          />

          <div className="flex justify-between">
            <button onClick={() => setStep(4)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(6)}
              disabled={!canAdvance()}
              className={`${BTN_NEXT} ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Photos */}
      {step === 6 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Site photos</h3>
            <p className="text-sm text-gray-text">
              Upload up to 5 photos. The AI will review visible access, slope, existing
              surfaces, vegetation, structures and likely site complexity.
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

            {form.photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={compressing}
                className={`${UPLOAD_BTN_LARGE} ${compressing ? "opacity-60 pointer-events-none" : ""}`}
              >
                {compressing ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Compressing photos…
                  </>
                ) : (
                  <>
                    <Camera size={28} />
                    Upload site photos ({form.photos.length}/5)
                  </>
                )}
              </button>
            )}

            <p className="mt-2 text-xs text-gray-text">
              Photos are resized and compressed in your browser before upload (max ~1000px,
              JPEG quality 0.6) to keep submissions fast.
            </p>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {form.photos.map((src, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {form.photos.length === 0 && (
            <p className="text-xs text-orange-safety">
              At least one site photo is required to continue.
            </p>
          )}

          {payloadTooLarge && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <p className="text-sm font-semibold text-amber-400">
                Photos are still large after compression
              </p>
              <p className="text-xs text-gray-text mt-1">
                Total payload is {(totalPayloadSize / 1024 / 1024).toFixed(1)}MB and may be
                rejected by the server. Try removing one or two photos before continuing.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(5)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setStep(7)}
              disabled={form.photos.length === 0 || compressing}
              className={`${BTN_NEXT} ${form.photos.length === 0 || compressing ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Review */}
      {step === 7 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Review your details</h3>
            <p className="text-sm text-gray-text">
              Confirm everything before we generate your AI-assisted preliminary estimate.
            </p>
          </div>

          <div className="space-y-3">
            <SummaryCard label="Suburb">
              <p className="text-sm font-medium text-white">{form.suburb}</p>
              <p className="text-xs text-gray-text mt-0.5">
                {form.suburbState} &middot; {form.postcode}
              </p>
            </SummaryCard>

            <SummaryCard label="Project scope">
              <p className="text-sm font-medium text-white">{form.scopes.join(", ")}</p>
            </SummaryCard>

            <SummaryCard label="Zones">
              <p className="text-sm font-medium text-white">{form.zones.join(", ")}</p>
            </SummaryCard>

            <SummaryCard label="Project size">
              <p className="text-sm font-medium text-white">
                {SIZE_OPTIONS.find((o) => o.value === form.sizePreset)?.label} —{" "}
                {SIZE_OPTIONS.find((o) => o.value === form.sizePreset)?.desc}
              </p>
            </SummaryCard>

            {(form.totalAreaSqm ||
              form.turfAreaSqm ||
              form.pavingAreaSqm ||
              form.retainingLengthM ||
              form.retainingMaxHeightM ||
              form.fencingLengthM ||
              form.treeCount) && (
              <SummaryCard label="Measurements">
                <ul className="text-sm text-white space-y-0.5">
                  {form.totalAreaSqm && <li>Total area: {form.totalAreaSqm} m²</li>}
                  {form.turfAreaSqm && <li>Turf area: {form.turfAreaSqm} m²</li>}
                  {form.pavingAreaSqm && <li>Paving area: {form.pavingAreaSqm} m²</li>}
                  {form.retainingLengthM && (
                    <li>Retaining length: {form.retainingLengthM} m</li>
                  )}
                  {form.retainingMaxHeightM && (
                    <li>Retaining max height: {form.retainingMaxHeightM} m</li>
                  )}
                  {form.fencingLengthM && <li>Fencing length: {form.fencingLengthM} m</li>}
                  {form.treeCount && <li>Trees to remove: {form.treeCount}</li>}
                </ul>
              </SummaryCard>
            )}

            {form.scopes.includes("Turf") && form.turfType && (
              <SummaryCard label="Turf">
                <p className="text-sm font-medium text-white">{form.turfType}</p>
              </SummaryCard>
            )}
            {form.scopes.includes("Paving") && form.pavingMaterial && (
              <SummaryCard label="Paving">
                <p className="text-sm font-medium text-white">{form.pavingMaterial}</p>
              </SummaryCard>
            )}
            {form.scopes.includes("Retaining walls") && form.retainingMaterial && (
              <SummaryCard label="Retaining walls">
                <p className="text-sm font-medium text-white">{form.retainingMaterial}</p>
              </SummaryCard>
            )}
            {form.scopes.includes("Fencing") && form.fencingMaterial && (
              <SummaryCard label="Fencing">
                <p className="text-sm font-medium text-white">{form.fencingMaterial}</p>
              </SummaryCard>
            )}

            <SummaryCard label="Site conditions">
              <p className="text-sm text-white">
                Access: {ACCESS_OPTIONS.find((o) => o.value === form.accessWidth)?.label}
              </p>
              <p className="text-sm text-white">
                Machinery:{" "}
                {MACHINERY_OPTIONS.find((o) => o.value === form.machineryAccess)?.label}
              </p>
              <p className="text-sm text-white">
                Slope: {SLOPE_OPTIONS.find((o) => o.value === form.slope)?.label}
              </p>
              <p className="text-sm text-white">
                Drainage: {DRAINAGE_OPTIONS.find((o) => o.value === form.drainage)?.label}
              </p>
              {form.existingConditions.length > 0 && (
                <p className="text-sm text-white mt-1">
                  Existing: {form.existingConditions.join(", ")}
                </p>
              )}
            </SummaryCard>

            <SummaryCard label="Timeline & budget">
              <p className="text-sm text-white">
                Timeline: {TIMELINE_OPTIONS.find((o) => o.value === form.timeline)?.label}
              </p>
              <p className="text-sm text-white">
                Budget: {BUDGET_OPTIONS.find((o) => o.value === form.budget)?.label}
              </p>
            </SummaryCard>

            {form.photos.length > 0 && (
              <SummaryCard label={`Photos (${form.photos.length})`}>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {form.photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`Site photo ${i + 1}`}
                      className="h-16 w-full rounded object-cover border border-gray-light"
                    />
                  ))}
                </div>
              </SummaryCard>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(6)} className={BTN_BACK}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button onClick={() => setStep(8)} className={BTN_NEXT}>
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-text mb-1">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </label>
  );
}

function ConditionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-3">{label}</label>
      <div className="grid gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={value === opt.value ? TILE_SELECTED : TILE}
          >
            <span className="text-white text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-light bg-gray-mid px-4 py-3">
      <p className="text-xs text-gray-text">{label}</p>
      {children}
    </div>
  );
}
