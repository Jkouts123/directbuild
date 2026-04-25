"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  X,
  CheckCircle2,
  Sun,
  Battery,
  Zap,
  Home,
  Layers,
  CircleDot,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import FAQ from "./FAQ";
import SuburbSearch, { type SuburbEntry } from "../../landscaping/components/SuburbSearch";
import { generateEstimate, type EstimateResult } from "../../actions/generate-estimate";
import LoadingPulse from "../../components/LoadingPulse";
import LeadCapture from "../../components/LeadCapture";
import { trackFacebookLead } from "../../components/FacebookPixel";
import { BTN_NEXT, BTN_BACK, INPUT, TILE, TILE_SELECTED } from "../../components/brand-styles";

// ── Constants ─────────────────────────────────────────────────────────
const SYSTEM_SIZES = [
  "3kW",
  "5kW",
  "6.6kW",
  "8kW",
  "10kW",
  "13kW+",
  "Not sure",
];

const PANEL_TIERS = [
  "Standard (Jinko, Trina, Canadian Solar)",
  "Mid-range (LONGi, QCells, REC)",
  "Premium (SunPower, LG, REC Alpha)",
  "No preference",
];

const INVERTER_OPTIONS = [
  "String inverter (standard)",
  "Micro-inverters (per panel)",
  "Hybrid inverter (battery-ready)",
  "Not sure",
];

const BATTERY_OPTIONS = [
  "No battery for now",
  "Small (5kWh – Tesla Powerwall, BYD)",
  "Medium (10kWh)",
  "Large (13–15kWh)",
  "Not sure / want advice",
];

const ROOF_TYPES = [
  "Colorbond / metal",
  "Tile (concrete or terracotta)",
  "Flat / membrane",
  "Slate",
  "Not sure",
];

const ROOF_COMPLEXITY = [
  "Simple single-plane roof",
  "Multi-plane / hip roof",
  "Steep pitch (>30 degrees)",
  "Flat roof (tilt frames needed)",
  "Two-storey roof",
  "Not sure",
];

const EXISTING_SOLAR = [
  "No existing solar",
  "Yes — needs removal and replacement",
  "Yes — adding to existing system",
];

const ELECTRICAL_OPTIONS = [
  "Standard switchboard (no upgrade needed)",
  "Switchboard upgrade required",
  "Three-phase power",
  "Not sure",
];

const SHADING_OPTIONS = [
  "No shading — full sun",
  "Minor shading (morning or afternoon)",
  "Moderate shading (trees / neighbouring buildings)",
  "Heavy shading",
  "Not sure",
];

const BUDGET_OPTIONS = [
  { value: "Under $4,000", desc: "Small 3kW systems", cat: "Entry Level" },
  { value: "$4,000 – $6,000", desc: "Standard 5–6.6kW systems", cat: "Entry Level" },
  { value: "$6,000 – $9,000", desc: "Mid-range 6.6–8kW systems", cat: "Most Popular" },
  { value: "$9,000 – $14,000", desc: "Premium panels or 10kW+ systems", cat: "Most Popular" },
  { value: "$14,000 – $22,000", desc: "Solar + small battery", cat: "Solar + Battery" },
  { value: "$22,000 – $35,000", desc: "Solar + large battery", cat: "Solar + Battery" },
  { value: "$35,000+", desc: "Large or commercial installations", cat: "Premium" },
  { value: "Not sure / just comparing", desc: "", cat: "Premium" },
];

const TIMELINE_OPTIONS = ["ASAP", "Within 1 month", "1–3 months", "Just researching"];

const PROPERTY_STATUS_OPTIONS = [
  "We live here already",
  "Recently purchased and settled",
  "New purchase, not settled yet",
  "Building a new home",
];

const PAYMENT_OPTIONS = [
  "Savings / cash",
  "Green loan / solar finance",
  "Included in mortgage",
  "Not sure yet",
];

const FINANCE_STATUS_OPTIONS = [
  "Approved / green light to proceed",
  "In progress",
  "Advised to wait",
  "Not sure yet",
];

const APPROVAL_TYPE_OPTIONS = [
  "No approvals needed",
  "Strata / body corporate approval",
  "Heritage overlay",
  "Not sure",
];

const APPROVAL_STATUS_OPTIONS = [
  "Already approved",
  "Submitted and pending",
  "Not started yet",
];

// ── Types ─────────────────────────────────────────────────────────────
interface FormState {
  suburb: string;
  suburbState: string;
  postcode: string;
  systemSize: string;
  panelTier: string;
  inverter: string;
  battery: string;
  roofType: string;
  roofComplexity: string;
  existingSolar: string;
  electrical: string;
  shading: string;
  photos: string[];
  budget: string;
  timeline: string;
  propertyStatus: string;
  paymentMethod: string;
  financeStatus: string;
  approvalType: string;
  approvalStatus: string;
  firstName: string;
  phone: string;
  email: string;
}

const INITIAL: FormState = {
  suburb: "",
  suburbState: "",
  postcode: "",
  systemSize: "",
  panelTier: "",
  inverter: "",
  battery: "",
  roofType: "",
  roofComplexity: "",
  existingSolar: "",
  electrical: "",
  shading: "",
  photos: [],
  budget: "",
  timeline: "",
  propertyStatus: "",
  paymentMethod: "",
  financeStatus: "",
  approvalType: "",
  approvalStatus: "",
  firstName: "",
  phone: "",
  email: "",
};

// Styling imported from brand-styles.ts

// ── Shared UI ─────────────────────────────────────────────────────────
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

function TileButton({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={selected ? TILE_SELECTED : TILE}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className={`font-medium ${selected ? "text-orange-safety" : "text-white"}`}>
        {label}
      </span>
    </button>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center space-y-1 mb-6">
      <h3 className="text-xl sm:text-2xl font-bold text-white">{title}</h3>
      {subtitle && <p className="text-sm text-gray-text">{subtitle}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function SolarEstimator() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Steps: 0=FAQ, 1=Suburb, 2=SystemSize, 3=PanelTier, 4=Inverter,
  //         5=Battery, 6=RoofType, 7=RoofComplexity, 8=ExistingSolar,
  //         9=Electrical, 10=Shading, 11=Photos, 12=Budget, 13=Timeline,
  //         14=Readiness, 15=Contact, 16=Result
  const ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const currentLogical = ALL_STEPS.indexOf(step);
  const totalVisible = ALL_STEPS.length;

  function goNext() {
    const idx = ALL_STEPS.indexOf(step);
    if (idx < ALL_STEPS.length - 1) setStep(ALL_STEPS[idx + 1]);
  }

  function goPrev() {
    const idx = ALL_STEPS.indexOf(step);
    if (idx > 0) setStep(ALL_STEPS[idx - 1]);
  }

  function autoAdvance(setter: () => void) {
    setter();
    setTimeout(() => goNext(), 300);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - form.photos.length;
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
      photos: [...prev.photos, ...results].slice(0, 5),
    }));
  }

  function removePhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  // Readiness check
  const showFinanceQ = form.paymentMethod && form.paymentMethod !== "Savings / cash";
  const showApprovalQ = form.approvalType && form.approvalType !== "No approvals needed";
  const readinessComplete =
    !!form.propertyStatus &&
    !!form.paymentMethod &&
    (!showFinanceQ || !!form.financeStatus) &&
    !!form.approvalType &&
    (!showApprovalQ || !!form.approvalStatus);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await generateEstimate({
        serviceType: "solar",
        formData: {
          suburb: form.suburb,
          suburbState: form.suburbState,
          postcode: form.postcode,
          systemSize: form.systemSize,
          panelTier: form.panelTier,
          inverter: form.inverter,
          battery: form.battery,
          roofType: form.roofType,
          roofComplexity: form.roofComplexity,
          existingSolar: form.existingSolar,
          electrical: form.electrical,
          shading: form.shading,
          budget: form.budget,
          timeline: form.timeline,
          propertyStatus: form.propertyStatus,
          paymentMethod: form.paymentMethod,
          financeStatus: form.financeStatus,
          approvalType: form.approvalType,
          approvalStatus: form.approvalStatus,
        },
        contact: {
          firstName: form.firstName,
          phone: form.phone,
          email: form.email,
        },
      });
      setResult(res);
      trackFacebookLead();
      setStep(16);
    } catch (err) {
      console.error("Estimate failed:", err);
      const msg = err instanceof Error && err.message
        ? err.message
        : "Something went wrong generating your estimate. Please try again.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Loading overlay ──
  if (loading) {
    return <LoadingPulse service="solar" />;
  }

  // ── Step 0: FAQ Intro ──
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

  // ── Step 16: Quote Result ──
  if (step === 16 && result) {
    const rebateAdjustedMin = result.stcRebate ? result.minPrice - result.stcRebate : result.minPrice;
    const rebateAdjustedMax = result.stcRebate ? result.maxPrice - result.stcRebate : result.maxPrice;

    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-orange-safety" size={28} />
          <h3 className="text-xl font-bold text-white">Your Solar Estimate</h3>
        </div>

        {/* Rebate-Adjusted Price — LARGEST text on mobile per spec */}
        {result.stcRebate && result.stcRebate > 0 ? (
          <div className="text-center py-6 rounded-xl bg-orange-safety/5 border border-orange-safety/20">
            <p className="text-xs text-gray-text uppercase tracking-wider font-semibold mb-2">
              Rebate-Adjusted Price
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-orange-safety font-[family-name:var(--font-heading)]">
              ${Math.max(0, rebateAdjustedMin).toLocaleString()} – ${Math.max(0, rebateAdjustedMax).toLocaleString()}
            </p>
            <p className="text-sm text-gray-text mt-2">
              After ~${result.stcRebate.toLocaleString()} STC Government Rebate
            </p>
          </div>
        ) : (
          <div className="text-center py-6 rounded-xl bg-orange-safety/5 border border-orange-safety/20">
            <p className="text-xs text-gray-text uppercase tracking-wider font-semibold mb-2">
              Estimated Range
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-orange-safety font-[family-name:var(--font-heading)]">
              ${result.minPrice.toLocaleString()} – ${result.maxPrice.toLocaleString()}
            </p>
          </div>
        )}

        {/* Pre-rebate price (smaller, secondary) */}
        {result.stcRebate && result.stcRebate > 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-text">
              Pre-rebate: <span className="line-through">${result.minPrice.toLocaleString()} – ${result.maxPrice.toLocaleString()}</span>
            </p>
          </div>
        )}

        {result.estimatedSavings && result.estimatedSavings > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3">
            <TrendingUp size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-400">
                Estimated Annual Savings
              </p>
              <p className="text-xs text-green-400/80">
                ~${result.estimatedSavings.toLocaleString()}/year on electricity
              </p>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-text">
          Suburb: <span className="text-white font-medium">{form.suburb}</span>
        </p>

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

        <div className="border-t border-gray-light pt-4 space-y-2">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-orange-safety">Center Estimate</span>
            <span className="text-orange-safety">
              ${result.centerPrice.toLocaleString()}
            </span>
          </div>
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

  // ── Steps 1–15 ──
  return (
    <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8">
      {currentLogical >= 0 && (
        <ProgressBar step={currentLogical + 1} total={totalVisible} />
      )}

      {/* Step 1: Suburb */}
      {step === 1 && (
        <div className="space-y-6">
          <StepHeading
            title="Where is the property?"
            subtitle="We'll match you with CEC-accredited solar installers in your area."
          />
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
          <div className="flex justify-end">
            <button
              onClick={goNext}
              disabled={!form.suburb.trim()}
              className={`${BTN_NEXT} ${!form.suburb.trim() ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: System Size */}
      {step === 2 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="What size solar system are you looking for?"
            subtitle="6.6kW is the most common residential size in Australia."
          />
          <div className="space-y-3">
            {SYSTEM_SIZES.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.systemSize === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, systemSize: opt }))
                  )
                }
                icon={<Sun size={18} className={form.systemSize === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Panel Tier */}
      {step === 3 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="What quality of panels do you prefer?"
            subtitle="Higher-tier panels offer better efficiency and longer warranties."
          />
          <div className="space-y-3">
            {PANEL_TIERS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.panelTier === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, panelTier: opt }))
                  )
                }
                icon={<Layers size={18} className={form.panelTier === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Inverter */}
      {step === 4 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="What type of inverter?"
            subtitle="Choose hybrid if you plan to add a battery later."
          />
          <div className="space-y-3">
            {INVERTER_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.inverter === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, inverter: opt }))
                  )
                }
                icon={<Zap size={18} className={form.inverter === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Battery */}
      {step === 5 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="Would you like battery storage?"
            subtitle="Batteries let you store excess solar for use at night."
          />
          <div className="space-y-3">
            {BATTERY_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.battery === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, battery: opt }))
                  )
                }
                icon={<Battery size={18} className={form.battery === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Roof Type */}
      {step === 6 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="What type of roof do you have?" />
          <div className="space-y-3">
            {ROOF_TYPES.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.roofType === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, roofType: opt }))
                  )
                }
                icon={<Home size={18} className={form.roofType === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 7: Roof Complexity */}
      {step === 7 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="How complex is your roof layout?"
            subtitle="This affects mounting and labour costs."
          />
          <div className="space-y-3">
            {ROOF_COMPLEXITY.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.roofComplexity === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, roofComplexity: opt }))
                  )
                }
                icon={<Layers size={18} className={form.roofComplexity === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 8: Existing Solar */}
      {step === 8 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="Do you have existing solar panels?" />
          <div className="space-y-3">
            {EXISTING_SOLAR.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.existingSolar === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, existingSolar: opt }))
                  )
                }
                icon={<CircleDot size={18} className={form.existingSolar === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 9: Electrical */}
      {step === 9 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="What's the electrical situation?" />
          <div className="space-y-3">
            {ELECTRICAL_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.electrical === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, electrical: opt }))
                  )
                }
                icon={<Zap size={18} className={form.electrical === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 10: Shading */}
      {step === 10 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="How much shading does your roof get?"
            subtitle="Shading affects solar panel output."
          />
          <div className="space-y-3">
            {SHADING_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.shading === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, shading: opt }))
                  )
                }
                icon={<Sun size={18} className={form.shading === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 11: Photos */}
      {step === 11 && (
        <div className="space-y-6">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="Photos (optional)"
            subtitle="Photos are optional but recommended — they help refine panel placement and shading. You can skip this step."
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          {form.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {form.photos.map((src, i) => (
                <div key={i} className="relative group aspect-square">
                  <img
                    src={src}
                    alt={`Upload ${i + 1}`}
                    className="h-full w-full rounded-lg object-cover border border-gray-light"
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
          {form.photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-gray-light bg-gray-mid px-5 py-4 text-sm text-gray-text hover:border-orange-safety/50 hover:text-white transition-colors cursor-pointer w-full justify-center"
            >
              <Camera size={18} />
              Upload Photos ({form.photos.length}/5)
            </button>
          )}
          <div className="rounded-lg bg-gray-mid/50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-text">
              Helpful photos include:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-text">
              {[
                { icon: Home, text: "Full roof view (street side)" },
                { icon: Sun, text: "Roof from backyard" },
                { icon: Zap, text: "Switchboard / meter box" },
                { icon: Layers, text: "Any shading from trees" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={14} className="shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={goNext} className={BTN_NEXT}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 12: Budget */}
      {step === 12 && (() => {
        const grouped = BUDGET_OPTIONS.reduce(
          (acc, b) => {
            if (!acc[b.cat]) acc[b.cat] = [];
            acc[b.cat].push(b);
            return acc;
          },
          {} as Record<string, typeof BUDGET_OPTIONS>
        );

        return (
          <div className="space-y-4">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
            <StepHeading
              title="What budget range are you aiming for?"
              subtitle="This helps tailor system recommendations. STC rebates can further reduce costs."
            />
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, options]) => (
                <div key={cat} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-text uppercase tracking-wide">
                    {cat}
                  </h4>
                  <div className="space-y-2">
                    {options.map((opt) => (
                      <TileButton
                        key={opt.value}
                        label={`${opt.value}${opt.desc ? ` — ${opt.desc}` : ""}`}
                        selected={form.budget === opt.value}
                        onClick={() =>
                          autoAdvance(() =>
                            setForm((p) => ({ ...p, budget: opt.value }))
                          )
                        }
                        icon={
                          <DollarSign
                            size={18}
                            className={
                              form.budget === opt.value
                                ? "text-orange-safety"
                                : "text-gray-text"
                            }
                          />
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Step 13: Timeline */}
      {step === 13 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="When are you looking to install?" />
          <div className="space-y-3">
            {TIMELINE_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.timeline === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, timeline: opt }))
                  )
                }
                icon={<Calendar size={18} className={form.timeline === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 14: Readiness Check */}
      {step === 14 && (
        <div className="space-y-6">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="A few quick questions about your project"
            subtitle="This helps us understand your situation better."
          />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">
              What&apos;s the status of the property?
            </h4>
            <div className="space-y-2">
              {PROPERTY_STATUS_OPTIONS.map((opt) => (
                <TileButton
                  key={opt}
                  label={opt}
                  selected={form.propertyStatus === opt}
                  onClick={() =>
                    setForm((p) => ({ ...p, propertyStatus: opt }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">
              How are you planning to pay?
            </h4>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <TileButton
                  key={opt}
                  label={opt}
                  selected={form.paymentMethod === opt}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      paymentMethod: opt,
                      financeStatus:
                        opt === "Savings / cash" ? "" : p.financeStatus,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {showFinanceQ && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">
                What&apos;s the current finance status?
              </h4>
              <div className="space-y-2">
                {FINANCE_STATUS_OPTIONS.map((opt) => (
                  <TileButton
                    key={opt}
                    label={opt}
                    selected={form.financeStatus === opt}
                    onClick={() =>
                      setForm((p) => ({ ...p, financeStatus: opt }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">
              Does this work need any approvals?
            </h4>
            <div className="space-y-2">
              {APPROVAL_TYPE_OPTIONS.map((opt) => (
                <TileButton
                  key={opt}
                  label={opt}
                  selected={form.approvalType === opt}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      approvalType: opt,
                      approvalStatus:
                        opt === "No approvals needed" ? "" : p.approvalStatus,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          {showApprovalQ && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">
                What&apos;s the approval status?
              </h4>
              <div className="space-y-2">
                {APPROVAL_STATUS_OPTIONS.map((opt) => (
                  <TileButton
                    key={opt}
                    label={opt}
                    selected={form.approvalStatus === opt}
                    onClick={() =>
                      setForm((p) => ({ ...p, approvalStatus: opt }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={goNext}
              disabled={!readinessComplete}
              className={`${BTN_NEXT} ${!readinessComplete ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 15: Contact Details — Full-screen mobile takeover */}
      {step === 15 && (
        <LeadCapture
          firstName={form.firstName}
          phone={form.phone}
          email={form.email}
          onFirstNameChange={(v) => setForm((p) => ({ ...p, firstName: v }))}
          onPhoneChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          onEmailChange={(v) => setForm((p) => ({ ...p, email: v }))}
          onSubmit={handleSubmit}
          onBack={goPrev}
          loading={loading}
          serviceName="Solar"
          error={submitError}
        />
      )}
    </div>
  );
}
