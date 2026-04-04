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
type WorkType =
  | "full-replacement"
  | "partial-replacement"
  | "roof-repair"
  | "storm-damage"
  | "roof-cleaning"
  | "roof-painting"
  | "inspection"
  | "gutter-fascia"
  | "insulation";

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  "full-replacement": "Full Roof Replacement",
  "partial-replacement": "Partial Roof Replacement",
  "roof-repair": "Roof Repair",
  "storm-damage": "Storm Damage Repair",
  "roof-cleaning": "Roof Cleaning",
  "roof-painting": "Roof Painting",
  inspection: "Roof Inspection Only",
  "gutter-fascia": "Gutter & Fascia Replacement",
  insulation: "Insulation Upgrade",
};

const CURRENT_MATERIALS = [
  "Concrete Tiles",
  "Terracotta Tiles",
  "Colorbond / Metal",
  "Tin / Zincalume",
  "Slate",
  "Asphalt Shingles",
  "Not Sure",
];

const DESIRED_MATERIALS = [
  "Colorbond",
  "Concrete Tiles",
  "Terracotta Tiles",
  "Metal / Zincalume",
  "Slate (Premium)",
  "Not Sure",
];

const ROOF_SIZES = [
  "Small (0-100 sqm)",
  "Medium (100-200 sqm)",
  "Large (200-300 sqm)",
  "Extra Large (300+ sqm)",
  "Not Sure",
];

const ROOF_PITCHES = ["Low Pitch", "Medium Pitch", "Steep Pitch"];

const ROOF_SHAPES = [
  "Gable",
  "Hip",
  "Dutch Gable",
  "Flat",
  "Skillion / Shed",
  "Combination / Irregular",
];

const ACCESS_LEVELS = [
  "Easy access",
  "Moderate access",
  "Difficult access (tight space, obstacles)",
  "Requires scaffolding",
];

const ASBESTOS_OPTIONS = ["Yes", "No", "Not sure"];

const EXTRAS = [
  "Fascia / Barge Boards",
  "Gutters & Downpipes",
  "Roof Ventilation",
  "Insulation Upgrade",
  "Skylight Installation",
  "Roof Painting",
  "Repointing / Rebedding",
  "None",
];

const REPAIR_ISSUES = ["Leak", "Storm damage", "Cracked tiles", "Flashing issues", "Other"];

const STOREY_COUNTS = ["Single storey", "Double storey", "Three+ storeys"];

const GUTTER_METRES = ["Less than 20m", "20-40m", "40-60m", "60+ metres", "Not sure"];

const INSURANCE_OPTIONS = ["Yes, I'm lodging a claim", "No", "Not sure yet"];

const SAFETY_OPTIONS = [
  "Safe - no active leaks",
  "Minor leak - manageable",
  "Active leak - urgent",
  "Structural concerns - very urgent",
];

const BUDGET_OPTIONS = [
  "Under $5,000",
  "$5,000 - $10,000",
  "$10,000 - $20,000",
  "$20,000 - $35,000",
  "$35,000 - $50,000",
  "$50,000 - $80,000",
  "$80,000+",
];

const TIMELINE_OPTIONS = [
  "ASAP (urgent)",
  "Within 1 month",
  "Within 3 months",
  "Just comparing quotes",
];

// ── Types ──────────────────────────────────────────────────────────────
interface FormState {
  suburb: string;
  suburbState: string;
  postcode: string;
  workTypes: WorkType[];
  currentMaterial: string;
  desiredMaterial: string;
  roofSize: string;
  roofPitch: string;
  roofShape: string;
  accessLevel: string;
  asbestos: string;
  extras: string[];
  repairIssues: string[];
  storeyCount: string;
  gutterMetres: string;
  insuranceClaim: string;
  safetyStatus: string;
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
  workTypes: [],
  currentMaterial: "",
  desiredMaterial: "",
  roofSize: "",
  roofPitch: "",
  roofShape: "",
  accessLevel: "",
  asbestos: "",
  extras: [],
  repairIssues: [],
  storeyCount: "",
  gutterMetres: "",
  insuranceClaim: "",
  safetyStatus: "",
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
  | "work_type"
  | "current_material"
  | "desired_material"
  | "roof_size"
  | "roof_pitch"
  | "roof_shape"
  | "access_level"
  | "asbestos"
  | "extras"
  | "repair_issues"
  | "storey_count"
  | "gutter_metres"
  | "insurance_claim"
  | "safety_status"
  | "photos"
  | "budget"
  | "timeline"
  | "contact";

function buildSteps(form: FormState): StepId[] {
  const steps: StepId[] = ["suburb", "work_type"];
  const wt = form.workTypes;
  const isReplacement = wt.includes("full-replacement") || wt.includes("partial-replacement");
  const isRepair = wt.includes("roof-repair");
  const isGutter = wt.includes("gutter-fascia");
  const isStorm = wt.includes("storm-damage");
  const isInsulationOnly = wt.includes("insulation") && wt.length === 1;

  if (isReplacement) {
    steps.push("current_material", "desired_material", "roof_size", "roof_pitch", "roof_shape", "access_level", "asbestos", "extras");
  } else if (isRepair) {
    steps.push("repair_issues", "current_material", "access_level", "roof_shape");
  } else if (isGutter) {
    steps.push("storey_count", "gutter_metres", "access_level", "roof_pitch");
  } else if (isInsulationOnly) {
    steps.push("storey_count");
  } else if (isStorm) {
    steps.push("insurance_claim", "safety_status", "current_material", "access_level");
  } else {
    steps.push("current_material", "roof_size", "roof_pitch", "access_level");
  }

  if (isStorm && (isReplacement || isRepair)) {
    if (!steps.includes("insurance_claim")) {
      steps.push("insurance_claim", "safety_status");
    }
  }

  steps.push("photos", "budget", "timeline", "contact");
  return steps;
}

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

// ── Main Component ────────────────────────────────────────────────────
export default function RoofingEstimator() {
  const [stepIdx, setStepIdx] = useState(-1); // -1 = FAQ intro
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = buildSteps(form);
  const currentStepId = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx] : null;
  const totalSteps = steps.length;

  function goNext() {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
  }
  function goPrev() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }
  function autoAdvance(setter: () => void) {
    setter();
    setTimeout(goNext, 300);
  }

  function toggleWorkType(wt: WorkType) {
    setForm((p) => ({
      ...p,
      workTypes: p.workTypes.includes(wt)
        ? p.workTypes.filter((w) => w !== wt)
        : [...p.workTypes, wt],
    }));
  }

  function toggleExtra(e: string) {
    setForm((p) => {
      if (e === "None") return { ...p, extras: ["None"] };
      const filtered = p.extras.filter((x) => x !== "None");
      return {
        ...p,
        extras: filtered.includes(e) ? filtered.filter((x) => x !== e) : [...filtered, e],
      };
    });
  }

  function toggleRepairIssue(issue: string) {
    setForm((p) => ({
      ...p,
      repairIssues: p.repairIssues.includes(issue)
        ? p.repairIssues.filter((x) => x !== issue)
        : [...p.repairIssues, issue],
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
        serviceType: "roofing",
        formData: {
          suburb: form.suburb,
          suburbState: form.suburbState,
          postcode: form.postcode,
          workTypes: form.workTypes,
          currentMaterial: form.currentMaterial,
          desiredMaterial: form.desiredMaterial,
          roofSize: form.roofSize,
          roofPitch: form.roofPitch,
          roofShape: form.roofShape,
          accessLevel: form.accessLevel,
          asbestos: form.asbestos,
          extras: form.extras,
          repairIssues: form.repairIssues,
          storeyCount: form.storeyCount,
          gutterMetres: form.gutterMetres,
          insuranceClaim: form.insuranceClaim,
          safetyStatus: form.safetyStatus,
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
      setStepIdx(steps.length); // result screen
    } catch (err) {
      console.error("Estimate failed:", err);
      setSubmitError("Something went wrong generating your estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Loading overlay ──
  if (loading) {
    return <LoadingPulse service="roofing" />;
  }

  // ── FAQ Intro ──
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
  if (stepIdx >= steps.length && result) {
    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-orange-safety" size={28} />
          <h3 className="text-xl font-bold text-white">Your Roofing Estimate</h3>
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
          <StepHeading title="Where is the property?" subtitle="Enter the suburb for your roofing job." />
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

      {/* Work Type */}
      {currentStepId === "work_type" && (
        <div className="space-y-6">
          <StepHeading title="What do you need?" subtitle="Select all that apply." />
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(WORK_TYPE_LABELS) as [WorkType, string][]).map(([key, label]) => (
              <label key={key} className={CHECKBOX_LABEL}>
                <input
                  type="checkbox"
                  checked={form.workTypes.includes(key)}
                  onChange={() => toggleWorkType(key)}
                  className="h-4 w-4 rounded border-gray-light bg-gray-mid accent-orange-safety"
                />
                <span className="text-sm text-white">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={goNext}
              disabled={form.workTypes.length === 0}
              className={`${BTN_NEXT} ${form.workTypes.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Current Material */}
      {currentStepId === "current_material" && (
        <div className="space-y-6">
          <StepHeading title="Current roof material?" />
          <div className="grid gap-3">
            {CURRENT_MATERIALS.map((m) => (
              <TileButton
                key={m}
                label={m}
                selected={form.currentMaterial === m}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, currentMaterial: m })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Desired Material */}
      {currentStepId === "desired_material" && (
        <div className="space-y-6">
          <StepHeading title="What material would you like?" />
          <div className="grid gap-3">
            {DESIRED_MATERIALS.map((m) => (
              <TileButton
                key={m}
                label={m}
                selected={form.desiredMaterial === m}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, desiredMaterial: m })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Roof Size */}
      {currentStepId === "roof_size" && (
        <div className="space-y-6">
          <StepHeading title="What size is the roof?" />
          <div className="grid gap-3">
            {ROOF_SIZES.map((s) => (
              <TileButton
                key={s}
                label={s}
                selected={form.roofSize === s}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, roofSize: s })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Roof Pitch */}
      {currentStepId === "roof_pitch" && (
        <div className="space-y-6">
          <StepHeading title="Roof pitch?" />
          <div className="grid gap-3">
            {ROOF_PITCHES.map((p) => (
              <TileButton
                key={p}
                label={p}
                selected={form.roofPitch === p}
                onClick={() => autoAdvance(() => setForm((prev) => ({ ...prev, roofPitch: p })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Roof Shape */}
      {currentStepId === "roof_shape" && (
        <div className="space-y-6">
          <StepHeading title="Roof shape?" />
          <div className="grid gap-3 sm:grid-cols-2">
            {ROOF_SHAPES.map((s) => (
              <TileButton
                key={s}
                label={s}
                selected={form.roofShape === s}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, roofShape: s })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Access Level */}
      {currentStepId === "access_level" && (
        <div className="space-y-6">
          <StepHeading title="Site access level?" />
          <div className="grid gap-3">
            {ACCESS_LEVELS.map((a) => (
              <TileButton
                key={a}
                label={a}
                selected={form.accessLevel === a}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, accessLevel: a })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Asbestos */}
      {currentStepId === "asbestos" && (
        <div className="space-y-6">
          <StepHeading title="Does the roof contain asbestos?" subtitle="Homes built before 1990 may contain asbestos sheeting." />
          <div className="grid gap-3">
            {ASBESTOS_OPTIONS.map((a) => (
              <TileButton
                key={a}
                label={a}
                selected={form.asbestos === a}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, asbestos: a })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Extras */}
      {currentStepId === "extras" && (
        <div className="space-y-6">
          <StepHeading title="Any extras?" subtitle="Select all that apply." />
          <div className="grid gap-3 sm:grid-cols-2">
            {EXTRAS.map((e) => (
              <label key={e} className={CHECKBOX_LABEL}>
                <input
                  type="checkbox"
                  checked={form.extras.includes(e)}
                  onChange={() => toggleExtra(e)}
                  className="h-4 w-4 rounded border-gray-light bg-gray-mid accent-orange-safety"
                />
                <span className="text-sm text-white">{e}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={goNext}
              disabled={form.extras.length === 0}
              className={`${BTN_NEXT} ${form.extras.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Repair Issues */}
      {currentStepId === "repair_issues" && (
        <div className="space-y-6">
          <StepHeading title="What issues are you experiencing?" subtitle="Select all that apply." />
          <div className="grid gap-3 sm:grid-cols-2">
            {REPAIR_ISSUES.map((issue) => (
              <label key={issue} className={CHECKBOX_LABEL}>
                <input
                  type="checkbox"
                  checked={form.repairIssues.includes(issue)}
                  onChange={() => toggleRepairIssue(issue)}
                  className="h-4 w-4 rounded border-gray-light bg-gray-mid accent-orange-safety"
                />
                <span className="text-sm text-white">{issue}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={goNext}
              disabled={form.repairIssues.length === 0}
              className={`${BTN_NEXT} ${form.repairIssues.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Storey Count */}
      {currentStepId === "storey_count" && (
        <div className="space-y-6">
          <StepHeading title="How many storeys?" />
          <div className="grid gap-3">
            {STOREY_COUNTS.map((s) => (
              <TileButton
                key={s}
                label={s}
                selected={form.storeyCount === s}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, storeyCount: s })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Gutter Metres */}
      {currentStepId === "gutter_metres" && (
        <div className="space-y-6">
          <StepHeading title="How many metres of guttering?" />
          <div className="grid gap-3">
            {GUTTER_METRES.map((g) => (
              <TileButton
                key={g}
                label={g}
                selected={form.gutterMetres === g}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, gutterMetres: g })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Insurance Claim */}
      {currentStepId === "insurance_claim" && (
        <div className="space-y-6">
          <StepHeading title="Are you lodging an insurance claim?" />
          <div className="grid gap-3">
            {INSURANCE_OPTIONS.map((o) => (
              <TileButton
                key={o}
                label={o}
                selected={form.insuranceClaim === o}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, insuranceClaim: o })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Safety Status */}
      {currentStepId === "safety_status" && (
        <div className="space-y-6">
          <StepHeading title="Current safety status?" />
          <div className="grid gap-3">
            {SAFETY_OPTIONS.map((s) => (
              <TileButton
                key={s}
                label={s}
                selected={form.safetyStatus === s}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, safetyStatus: s })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Photos */}
      {currentStepId === "photos" && (
        <div className="space-y-6">
          <StepHeading
            title="Roof Photos"
            subtitle="Upload at least one photo of your roof for an accurate estimate. (Up to 5)"
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
              Upload Roof Photos ({form.photos.length}/5)
            </button>
          )}
          {form.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {form.photos.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`Roof photo ${i + 1}`}
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
            <button
              onClick={goNext}
              disabled={form.photos.length === 0}
              className={`${BTN_NEXT} ${form.photos.length === 0 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Budget */}
      {currentStepId === "budget" && (
        <div className="space-y-6">
          <StepHeading title="What's your budget?" />
          <div className="grid gap-3">
            {BUDGET_OPTIONS.map((b) => (
              <TileButton
                key={b}
                label={b}
                selected={form.budget === b}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, budget: b })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {currentStepId === "timeline" && (
        <div className="space-y-6">
          <StepHeading title="When do you need this done?" />
          <div className="grid gap-3">
            {TIMELINE_OPTIONS.map((t) => (
              <TileButton
                key={t}
                label={t}
                selected={form.timeline === t}
                onClick={() => autoAdvance(() => setForm((p) => ({ ...p, timeline: t })))}
              />
            ))}
          </div>
          <div className="flex justify-start">
            <button onClick={goPrev} className={BTN_BACK}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
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
          serviceName="Roofing"
          error={submitError}
        />
      )}
    </div>
  );
}
