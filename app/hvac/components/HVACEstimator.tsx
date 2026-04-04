"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Wind,
  Gauge,
  Home,
  Wrench,
  Zap,
  Star,
  Plus,
  Check,
  DollarSign,
  Calendar,
} from "lucide-react";
import FAQ from "./FAQ";
import SuburbSearch, { type SuburbEntry } from "../../landscaping/components/SuburbSearch";
import { generateEstimate, type EstimateResult } from "../../actions/generate-estimate";
import LoadingPulse from "../../components/LoadingPulse";
import LeadCapture from "../../components/LeadCapture";
import { BTN_NEXT, BTN_BACK, INPUT, TILE, TILE_SELECTED } from "../../components/brand-styles";

// ── Constants ─────────────────────────────────────────────────────────
const WORK_TYPES = [
  "Split system installation",
  "Ducted system installation",
  "Multi-split system",
  "Replacement of existing system",
  "Repairs / troubleshooting",
  "Not sure yet",
];

const SYSTEM_SIZES = [
  "Under 3.5kW (bedroom / small room)",
  "3.5–5.0kW (medium room)",
  "5.0–7.0kW (large living area)",
  "7.0–10kW (open plan / large area)",
  "10kW+ (whole home / ducted)",
  "Not sure",
];

const DUCTED_HIDDEN_SIZES = [
  "Under 3.5kW (bedroom / small room)",
  "3.5–5.0kW (medium room)",
];

const PROPERTY_TYPES = [
  "Apartment / unit",
  "Single-storey house",
  "Double-storey house",
  "Townhouse",
  "Commercial space",
];

const INSTALL_COMPLEXITY = [
  "Back-to-back install (indoor & outdoor units close together)",
  "Standard install",
  "Long pipe run required",
  "Difficult access",
  "Ceiling / roof cavity work required",
  "Not sure",
];

const ELECTRICAL_OPTIONS = [
  "Existing power is suitable",
  "Electrical upgrade required",
  "Not sure",
];

const BRAND_OPTIONS = [
  "No preference",
  "Mitsubishi Electric",
  "Daikin",
  "Fujitsu",
  "Actron",
  "Panasonic",
  "Other / not sure",
];

const EXTRAS_OPTIONS = [
  "Removal of existing unit",
  "New ducting required",
  "Zoning (ducted systems)",
  "Wi-Fi / smart controller",
  "Noise reduction / isolation pads",
  "Ongoing servicing / maintenance",
];

const DUCTED_ONLY_EXTRAS = ["New ducting required", "Zoning (ducted systems)"];

const BUDGET_OPTIONS = [
  { value: "Under $2,500", desc: "Basic split systems, simple installs", cat: "Small / Simple Systems" },
  { value: "$2,500 – $5,000", desc: "Most split system installs", cat: "Small / Simple Systems" },
  { value: "$5,000 – $8,000", desc: "Larger splits, small multi-split systems", cat: "Standard Home Installations" },
  { value: "$8,000 – $12,000", desc: "Entry-level ducted systems", cat: "Standard Home Installations" },
  { value: "$12,000 – $20,000", desc: "Most ducted installs for homes", cat: "Large / Ducted Systems" },
  { value: "$20,000 – $35,000", desc: "Large homes, zoning, complex installs", cat: "Large / Ducted Systems" },
  { value: "$35,000+", desc: "High-end ducted or commercial systems", cat: "Premium / Not Budget-Constrained" },
  { value: "Not sure / just comparing options", desc: "", cat: "Premium / Not Budget-Constrained" },
];

const HIGH_BUDGETS = ["$8,000 – $12,000", "$12,000 – $20,000", "$20,000 – $35,000", "$35,000+"];

const TIMELINE_OPTIONS = ["ASAP", "Within 1 month", "1–3 months", "Just researching"];

const PROPERTY_STATUS_OPTIONS = [
  "We live here already",
  "Recently purchased and settled",
  "New purchase, not settled yet",
  "Building a new home",
];

const PAYMENT_OPTIONS = [
  "Savings / cash",
  "Included in a home loan or refinance",
  "Waiting on finance approval",
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
  "Strata approval",
  "Builder approval (new build)",
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
  workType: string;
  systemSize: string;
  propertyType: string;
  installComplexity: string;
  electrical: string;
  brand: string;
  extras: string[];
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
  workType: "",
  systemSize: "",
  propertyType: "",
  installComplexity: "",
  electrical: "",
  brand: "",
  extras: [],
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

// ── Progress Bar ──────────────────────────────────────────────────────
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

// ── Tile Button ───────────────────────────────────────────────────────
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

// ── Step Heading ──────────────────────────────────────────────────────
function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center space-y-1 mb-6">
      <h3 className="text-xl sm:text-2xl font-bold text-white">{title}</h3>
      {subtitle && <p className="text-sm text-gray-text">{subtitle}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function HVACEstimator() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isRepairs = form.workType === "Repairs / troubleshooting";
  const isDucted = form.workType === "Ducted system installation";

  // Steps: 0=FAQ, 1=Suburb, 2=WorkType, 3=SystemSize, 4=PropertyType,
  //         5=Complexity, 6=Electrical, 7=Brand, 8=Extras,
  //         10=Budget, 11=Timeline, 12=Readiness, 13=Contact, 14=Result
  // Repairs skip: 3 (size), 8 (extras)
  function getVisibleSteps(): number[] {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13];
    if (isRepairs) return all.filter((s) => s !== 3 && s !== 8);
    return all;
  }

  const visibleSteps = getVisibleSteps();
  const currentLogical = visibleSteps.indexOf(step);
  const totalVisible = visibleSteps.length;

  function goNext() {
    const idx = visibleSteps.indexOf(step);
    if (idx < visibleSteps.length - 1) setStep(visibleSteps[idx + 1]);
  }

  function goPrev() {
    const idx = visibleSteps.indexOf(step);
    if (idx > 0) setStep(visibleSteps[idx - 1]);
  }

  function autoAdvance(setter: () => void) {
    setter();
    setTimeout(() => goNext(), 300);
  }

  function toggleExtra(extra: string) {
    setForm((prev) => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter((e) => e !== extra)
        : [...prev.extras, extra],
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await generateEstimate({
        serviceType: "hvac",
        formData: {
          suburb: form.suburb,
          suburbState: form.suburbState,
          postcode: form.postcode,
          workType: form.workType,
          systemSize: form.systemSize,
          propertyType: form.propertyType,
          installComplexity: form.installComplexity,
          electrical: form.electrical,
          brand: form.brand,
          extras: form.extras,
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
      setStep(14);
    } catch (err) {
      console.error("Estimate failed:", err);
      setSubmitError("Something went wrong generating your estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Readiness check completion
  const showFinanceQ = form.paymentMethod && form.paymentMethod !== "Savings / cash";
  const showApprovalQ = form.approvalType && form.approvalType !== "No approvals needed";
  const readinessComplete =
    !!form.propertyStatus &&
    !!form.paymentMethod &&
    (!showFinanceQ || !!form.financeStatus) &&
    !!form.approvalType &&
    (!showApprovalQ || !!form.approvalStatus);

  // ── Loading overlay ──
  if (loading) {
    return <LoadingPulse service="HVAC" />;
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

  // ── Step 14: Quote Result ──
  if (step === 14 && result) {
    return (
      <div className="rounded-2xl border border-gray-light bg-gray-dark p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="text-orange-safety" size={28} />
          <h3 className="text-xl font-bold text-white">Your HVAC Estimate</h3>
        </div>

        <div className="text-center py-4 border-b border-gray-light">
          <p className="text-sm text-gray-text mb-1">Estimated Range</p>
          <p className="text-3xl font-bold text-orange-safety">
            ${result.minPrice.toLocaleString()} – ${result.maxPrice.toLocaleString()}
          </p>
        </div>

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

  // ── Steps 1–13 ──
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
            subtitle="We'll match you with HVAC installers in your area."
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

      {/* Step 2: Work Type */}
      {step === 2 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="What type of air conditioning work do you need?" />
          <div className="space-y-3">
            {WORK_TYPES.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.workType === opt}
                onClick={() =>
                  autoAdvance(() => setForm((p) => ({ ...p, workType: opt })))
                }
                icon={<Wind size={18} className={form.workType === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: System Size (skipped for repairs) */}
      {step === 3 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="What size system are you looking for?" />
          <div className="space-y-3">
            {SYSTEM_SIZES.filter(
              (s) => !isDucted || !DUCTED_HIDDEN_SIZES.includes(s)
            ).map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.systemSize === opt}
                onClick={() =>
                  autoAdvance(() => setForm((p) => ({ ...p, systemSize: opt })))
                }
                icon={<Gauge size={18} className={form.systemSize === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Property Type */}
      {step === 4 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="What type of property is this for?" />
          <div className="space-y-3">
            {PROPERTY_TYPES.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.propertyType === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, propertyType: opt }))
                  )
                }
                icon={<Home size={18} className={form.propertyType === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Install Complexity */}
      {step === 5 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="How complex is the installation?"
            subtitle={
              isRepairs
                ? "This helps us understand what the repair may involve."
                : undefined
            }
          />
          <div className="space-y-3">
            {INSTALL_COMPLEXITY.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.installComplexity === opt}
                onClick={() =>
                  autoAdvance(() =>
                    setForm((p) => ({ ...p, installComplexity: opt }))
                  )
                }
                icon={<Wrench size={18} className={form.installComplexity === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Electrical */}
      {step === 6 && (
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

      {/* Step 7: Brand Preference */}
      {step === 7 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="Do you have a brand preference?" />
          <div className="space-y-3">
            {BRAND_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.brand === opt}
                onClick={() =>
                  autoAdvance(() => setForm((p) => ({ ...p, brand: opt })))
                }
                icon={<Star size={18} className={form.brand === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 8: Extras (skipped for repairs) */}
      {step === 8 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="Do you need any of the following?"
            subtitle="Select all that apply."
          />
          <div className="space-y-3">
            {EXTRAS_OPTIONS.filter(
              (e) => isDucted || !DUCTED_ONLY_EXTRAS.includes(e)
            ).map((opt) => {
              const selected = form.extras.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleExtra(opt)}
                  className={selected ? TILE_SELECTED : TILE}
                >
                  <span className="shrink-0">
                    {selected ? (
                      <Check size={18} className="text-orange-safety" />
                    ) : (
                      <Plus size={18} className="text-gray-text" />
                    )}
                  </span>
                  <span
                    className={`font-medium ${selected ? "text-orange-safety" : "text-white"}`}
                  >
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
          {form.extras.length > 0 && (
            <p className="text-sm text-center text-gray-text">
              {form.extras.length} selected
            </p>
          )}
          <div className="flex justify-end">
            <button onClick={goNext} className={BTN_NEXT}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 10: Budget */}
      {step === 10 && (() => {
        const filteredBudgets = isRepairs
          ? BUDGET_OPTIONS.filter((b) => !HIGH_BUDGETS.includes(b.value))
          : BUDGET_OPTIONS;

        const grouped = filteredBudgets.reduce(
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
              title="What budget range are you aiming to stay within?"
              subtitle="This helps tailor system size and scope — final pricing depends on site conditions."
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

      {/* Step 11: Timeline */}
      {step === 11 && (
        <div className="space-y-4">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading title="When are you looking to have this done?" />
          <div className="space-y-3">
            {TIMELINE_OPTIONS.map((opt) => (
              <TileButton
                key={opt}
                label={opt}
                selected={form.timeline === opt}
                onClick={() =>
                  autoAdvance(() => setForm((p) => ({ ...p, timeline: opt })))
                }
                icon={<Calendar size={18} className={form.timeline === opt ? "text-orange-safety" : "text-gray-text"} />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 12: Readiness Check */}
      {step === 12 && (
        <div className="space-y-6">
          <button onClick={goPrev} className={BTN_BACK}>
            <ArrowLeft size={16} /> Back
          </button>
          <StepHeading
            title="A few quick questions about your project"
            subtitle="This helps us understand your situation better."
          />

          {/* Q1: Property Status */}
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

          {/* Q2: Payment Method */}
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

          {/* Q3: Finance Status (conditional) */}
          {showFinanceQ && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">
                If finance is involved, what&apos;s the current status?
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

          {/* Q4: Approvals */}
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

          {/* Q5: Approval Status (conditional) */}
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

      {/* Step 13: Contact Details — Full-screen mobile takeover */}
      {step === 13 && (
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
          serviceName="HVAC"
          error={submitError}
        />
      )}
    </div>
  );
}
