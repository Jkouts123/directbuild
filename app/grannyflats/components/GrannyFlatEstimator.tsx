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
import SuburbSearch, { type SuburbEntry } from "../../landscaping/components/SuburbSearch";
import { generateEstimate, type EstimateResult } from "../../actions/generate-estimate";
import LoadingPulse from "../../components/LoadingPulse";
import LeadCapture from "../../components/LeadCapture";
import { BTN_NEXT, BTN_BACK, INPUT, TILE, TILE_SELECTED, CHECKBOX_LABEL, UPLOAD_BTN_LARGE } from "../../components/brand-styles";

// ── Options (from reference) ──────────────────────────────────────────
const SIZES = ["Under 40m² (studio)", "40-60m² (1 bed)", "60-80m² (2 bed)", "80m²+"];
const BEDROOMS = ["Studio (no separate bedroom)", "1 bedroom", "2 bedrooms"];
const BLOCK_CONDITIONS = [
  "Flat, easy access",
  "Slight slope",
  "Steep block",
  "Restricted access (tight driveway / crane required)",
];
const CONSTRUCTION_TYPES = ["Brick veneer", "Lightweight / cladding", "Hebel / panel", "Not sure"];
const CEILING_HEIGHTS = ["Standard 2.4m", "2.7m", "Raked / cathedral", "Not sure"];
const FOUNDATION_TYPES = ["Concrete slab", "Raised on piers", "Not sure"];
const DISTANCE_OPTIONS = ["Under 10m", "10-20m", "20m+", "Not sure"];
const HOT_WATER_OPTIONS = ["Electric", "Gas", "Heat pump", "Connect to existing", "Not sure"];
const APPROVAL_METHODS = ["CDC", "DA", "Not sure"];
const OVERLAY_RISKS = ["Bushfire zone", "Flood zone", "None", "Not sure"];
const WINDOW_TYPES = ["Standard aluminium", "Double glazed", "Architectural", "Not sure"];
const FINISH_LEVELS = ["Basic rental spec", "Mid-range owner spec", "High-end finish"];
const INCLUSIONS = [
  "Bathroom",
  "Kitchen",
  "Built-in wardrobes",
  "Air conditioning",
  "Separate electricity meter",
  "New sewer connection",
  "Water connection",
  "Stormwater works",
];
const FLOORING_TYPES = ["Carpet", "Hybrid / laminate", "Tiles", "Polished concrete"];
const BUDGET_OPTIONS = [
  "$180,000 - $220,000",
  "$220,000 - $250,000",
  "$250,000+",
  "Not sure",
];
const TIMELINE_OPTIONS = ["Within 3 months", "3-6 months", "6-12 months", "Just researching"];

// ── Types ──────────────────────────────────────────────────────────────
interface FormState {
  suburb: string;
  suburbState: string;
  postcode: string;
  size: string;
  bedrooms: string;
  blockCondition: string;
  constructionType: string;
  ceilingHeight: string;
  foundation: string;
  distanceToHouse: string;
  hotWater: string;
  approvalMethod: string;
  overlayRisk: string;
  windowType: string;
  finishLevel: string;
  inclusions: string[];
  flooringType: string;
  budget: string;
  timeline: string;
  photos: string[];
  firstName: string;
  phone: string;
  email: string;
}

const INITIAL: FormState = {
  suburb: "",
  suburbState: "",
  postcode: "",
  size: "",
  bedrooms: "",
  blockCondition: "",
  constructionType: "",
  ceilingHeight: "",
  foundation: "",
  distanceToHouse: "",
  hotWater: "",
  approvalMethod: "",
  overlayRisk: "",
  windowType: "",
  finishLevel: "",
  inclusions: [],
  flooringType: "",
  budget: "",
  timeline: "",
  photos: [],
  firstName: "",
  phone: "",
  email: "",
};

// ── Step IDs ──────────────────────────────────────────────────────────
type StepId =
  | "suburb"
  | "size"
  | "bedrooms"
  | "block_condition"
  | "construction_type"
  | "ceiling_height"
  | "foundation"
  | "distance"
  | "hot_water"
  | "approval_method"
  | "overlay_risk"
  | "window_type"
  | "finish_level"
  | "inclusions"
  | "flooring"
  | "photos"
  | "budget"
  | "timeline"
  | "contact";

const STEP_LIST: StepId[] = [
  "suburb",
  "size",
  "bedrooms",
  "block_condition",
  "construction_type",
  "ceiling_height",
  "foundation",
  "distance",
  "hot_water",
  "approval_method",
  "overlay_risk",
  "window_type",
  "finish_level",
  "inclusions",
  "flooring",
  "photos",
  "budget",
  "timeline",
  "contact",
];

// Styling imported from brand-styles.ts

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < current ? "bg-orange-safety" : "bg-gray-light"
          }`}
        />
      ))}
    </div>
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

function TileButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={selected ? TILE_SELECTED : TILE}>
      <span className={`font-medium ${selected ? "text-orange-safety" : "text-white"}`}>
        {label}
      </span>
    </button>
  );
}

// Helper: renders a single-select tile step with auto-advance
function SingleSelectStep({
  title,
  subtitle,
  options,
  value,
  onSelect,
  onBack,
}: {
  title: string;
  subtitle?: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeading title={title} subtitle={subtitle} />
      <div className="grid gap-3">
        {options.map((o) => (
          <TileButton key={o} label={o} selected={value === o} onClick={() => onSelect(o)} />
        ))}
      </div>
      <div className="flex justify-start">
        <button onClick={onBack} className={BTN_BACK}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function GrannyFlatEstimator() {
  const [stepIdx, setStepIdx] = useState(-1); // -1 = FAQ
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSteps = STEP_LIST.length;
  const currentStepId = stepIdx >= 0 && stepIdx < totalSteps ? STEP_LIST[stepIdx] : null;

  function goNext() {
    if (stepIdx < totalSteps - 1) setStepIdx(stepIdx + 1);
  }
  function goPrev() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }
  function autoAdvance(setter: () => void) {
    setter();
    setTimeout(goNext, 300);
  }

  function toggleInclusion(inc: string) {
    setForm((p) => ({
      ...p,
      inclusions: p.inclusions.includes(inc)
        ? p.inclusions.filter((x) => x !== inc)
        : [...p.inclusions, inc],
    }));
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
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...results].slice(0, 5) }));
  }

  function removePhoto(index: number) {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await generateEstimate({
        serviceType: "granny-flats",
        formData: {
          suburb: form.suburb,
          suburbState: form.suburbState,
          postcode: form.postcode,
          size: form.size,
          bedrooms: form.bedrooms,
          blockCondition: form.blockCondition,
          constructionType: form.constructionType,
          ceilingHeight: form.ceilingHeight,
          foundation: form.foundation,
          distanceToHouse: form.distanceToHouse,
          hotWater: form.hotWater,
          approvalMethod: form.approvalMethod,
          overlayRisk: form.overlayRisk,
          windowType: form.windowType,
          finishLevel: form.finishLevel,
          inclusions: form.inclusions,
          flooringType: form.flooringType,
          budget: form.budget,
          timeline: form.timeline,
        },
        images: form.photos.length > 0 ? form.photos : undefined,
        contact: {
          firstName: form.firstName,
          phone: form.phone,
          email: form.email,
        },
      });
      setResult(res);
      setStepIdx(totalSteps); // result screen
    } catch (err) {
      console.error("Estimate failed:", err);
      setSubmitError("Something went wrong generating your estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── FAQ Intro ──
  // ── Loading overlay ──
  if (loading) {
    return <LoadingPulse service="granny flat" />;
  }

  if (stepIdx === -1) {
    return (
      <div className="space-y-8">
        <div>
          <button onClick={() => setStepIdx(0)} className={`${BTN_NEXT} w-full sm:w-auto px-10 min-h-[56px] text-base`}>
            Start Your Free Quote
            <ArrowRight size={18} />
          </button>
        </div>
        <FAQ />
      </div>
    );
  }

  // ── Result Screen ──
  if (stepIdx >= totalSteps && result) {
    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-orange-safety" size={28} />
          <h3 className="text-xl font-bold text-white">Your Granny Flat Estimate</h3>
        </div>

        <div className="rounded-xl border border-orange-safety/30 bg-orange-safety/5 p-5 text-center space-y-2">
          <p className="text-sm text-gray-text">Estimated Range</p>
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
              <p className="text-sm font-bold text-white">${li.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-text italic">{result.disclaimer}</p>

        <button
          onClick={() => {
            setStepIdx(-1);
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

  // ── Dynamic Steps ──
  return (
    <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8">
      <ProgressBar current={stepIdx + 1} total={totalSteps} />

      {/* Suburb */}
      {currentStepId === "suburb" && (
        <div className="space-y-6">
          <StepHeading title="Where is the property?" subtitle="Enter the suburb for your granny flat build." />
          <SuburbSearch
            value={form.suburb}
            onChange={(display: string, entry: SuburbEntry) =>
              setForm((p) => ({ ...p, suburb: display, suburbState: entry.state, postcode: entry.postcode }))
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

      {/* Size */}
      {currentStepId === "size" && (
        <SingleSelectStep
          title="What size granny flat?"
          options={SIZES}
          value={form.size}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, size: v })))}
          onBack={goPrev}
        />
      )}

      {/* Bedrooms */}
      {currentStepId === "bedrooms" && (
        <SingleSelectStep
          title="How many bedrooms?"
          subtitle="This affects layout complexity and cost."
          options={BEDROOMS}
          value={form.bedrooms}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, bedrooms: v })))}
          onBack={goPrev}
        />
      )}

      {/* Block Condition */}
      {currentStepId === "block_condition" && (
        <SingleSelectStep
          title="Block condition?"
          subtitle="Site access and slope affect foundations and delivery costs."
          options={BLOCK_CONDITIONS}
          value={form.blockCondition}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, blockCondition: v })))}
          onBack={goPrev}
        />
      )}

      {/* Construction Type */}
      {currentStepId === "construction_type" && (
        <SingleSelectStep
          title="Preferred construction type?"
          options={CONSTRUCTION_TYPES}
          value={form.constructionType}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, constructionType: v })))}
          onBack={goPrev}
        />
      )}

      {/* Ceiling Height */}
      {currentStepId === "ceiling_height" && (
        <SingleSelectStep
          title="Ceiling height?"
          options={CEILING_HEIGHTS}
          value={form.ceilingHeight}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, ceilingHeight: v })))}
          onBack={goPrev}
        />
      )}

      {/* Foundation */}
      {currentStepId === "foundation" && (
        <SingleSelectStep
          title="Foundation type?"
          options={FOUNDATION_TYPES}
          value={form.foundation}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, foundation: v })))}
          onBack={goPrev}
        />
      )}

      {/* Distance to House */}
      {currentStepId === "distance" && (
        <SingleSelectStep
          title="Distance from main dwelling?"
          subtitle="Affects service connection costs."
          options={DISTANCE_OPTIONS}
          value={form.distanceToHouse}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, distanceToHouse: v })))}
          onBack={goPrev}
        />
      )}

      {/* Hot Water */}
      {currentStepId === "hot_water" && (
        <SingleSelectStep
          title="Hot water system?"
          options={HOT_WATER_OPTIONS}
          value={form.hotWater}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, hotWater: v })))}
          onBack={goPrev}
        />
      )}

      {/* Approval Method */}
      {currentStepId === "approval_method" && (
        <SingleSelectStep
          title="Approval pathway?"
          subtitle="CDC is faster; DA may be needed for heritage or bushfire zones."
          options={APPROVAL_METHODS}
          value={form.approvalMethod}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, approvalMethod: v })))}
          onBack={goPrev}
        />
      )}

      {/* Overlay Risk */}
      {currentStepId === "overlay_risk" && (
        <SingleSelectStep
          title="Any property overlays?"
          subtitle="Bushfire or flood zones add compliance costs."
          options={OVERLAY_RISKS}
          value={form.overlayRisk}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, overlayRisk: v })))}
          onBack={goPrev}
        />
      )}

      {/* Window Type */}
      {currentStepId === "window_type" && (
        <SingleSelectStep
          title="Window and glazing quality?"
          options={WINDOW_TYPES}
          value={form.windowType}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, windowType: v })))}
          onBack={goPrev}
        />
      )}

      {/* Finish Level */}
      {currentStepId === "finish_level" && (
        <SingleSelectStep
          title="Overall finish level?"
          subtitle="This is the biggest cost driver."
          options={FINISH_LEVELS}
          value={form.finishLevel}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, finishLevel: v })))}
          onBack={goPrev}
        />
      )}

      {/* Inclusions */}
      {currentStepId === "inclusions" && (
        <div className="space-y-6">
          <StepHeading title="What's included?" subtitle="Select everything the build should include." />
          <div className="grid gap-3 sm:grid-cols-2">
            {INCLUSIONS.map((inc) => (
              <label key={inc} className={CHECKBOX_LABEL}>
                <input
                  type="checkbox"
                  checked={form.inclusions.includes(inc)}
                  onChange={() => toggleInclusion(inc)}
                  className="h-4 w-4 rounded border-gray-light bg-gray-mid accent-orange-safety"
                />
                <span className="text-sm text-white">{inc}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={goNext} className={BTN_NEXT}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Flooring */}
      {currentStepId === "flooring" && (
        <SingleSelectStep
          title="Flooring type?"
          options={FLOORING_TYPES}
          value={form.flooringType}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, flooringType: v })))}
          onBack={goPrev}
        />
      )}

      {/* Photos */}
      {currentStepId === "photos" && (
        <div className="space-y-6">
          <StepHeading
            title="Site Photos"
            subtitle="Upload up to 5 photos of the block/site for a more accurate estimate."
          />
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
              className={UPLOAD_BTN_LARGE}
            >
              <Camera size={28} />
              Upload Site Photos ({form.photos.length}/5)
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
          <div className="flex justify-between">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={goNext} className={BTN_NEXT}>
              {form.photos.length === 0 ? "Skip" : "Continue"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Budget */}
      {currentStepId === "budget" && (
        <SingleSelectStep
          title="What's your budget?"
          options={BUDGET_OPTIONS}
          value={form.budget}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, budget: v })))}
          onBack={goPrev}
        />
      )}

      {/* Timeline */}
      {currentStepId === "timeline" && (
        <SingleSelectStep
          title="When do you want to start?"
          options={TIMELINE_OPTIONS}
          value={form.timeline}
          onSelect={(v) => autoAdvance(() => setForm((p) => ({ ...p, timeline: v })))}
          onBack={goPrev}
        />
      )}

      {/* Contact — Full-screen mobile takeover */}
      {currentStepId === "contact" && (
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
          serviceName="Granny Flat"
          error={submitError}
        />
      )}
    </div>
  );
}
