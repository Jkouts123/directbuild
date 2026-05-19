"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type AreaOpportunityReport = {
  score: number;
  fitLabel: string;
  trade: string;
  serviceArea: string;
  serviceStates?: string[];
  dataCoverageMode?: "nsw_enhanced" | "national";
  primaryRegionId?: string;
  primaryRegionLabel?: string;
  selectedRegionLabels?: string[];
  dataLookupArea?: string;
  planningServiceArea?: string;
  planningCouncilName?: string;
  targetExtraJobs?: string;
  requiredQualifiedEnquiries?: string;
  projectedBookedRevenueRange?: string;
  estimatedAdWalletRange?: string;
  estimatedGrossProfitRange?: string | null;
  recommendedActivationLevel?: string;
  primaryRegion?: {
    id: string;
    label: string;
    state: string;
    defaultCompetitorSearchArea: string;
    regionFitNote: string;
  } | null;
  selectedRegions?: Array<{
    id: string;
    label: string;
    state: string;
  }>;
  regionReviewNote?: string;
  scoreBreakdown: {
    competitorGap?: number;
    planningSignal?: number;
    businessEconomics?: number;
    capacityReadiness?: number;
  };
  signals?: {
    competitors?: {
      status: string;
      summary?: {
        competitorCount?: number;
        averageRating?: number | null;
        averageReviewCount?: number | null;
      };
    };
    planning?: {
      status: string;
      directApplicationCount?: number;
      contextApplicationCount?: number;
      relevantApplicationCount?: number;
      topDirectKeywords?: string[];
      topContextKeywords?: string[];
      topMatchedKeywords?: string[];
      signalStrength?: "low" | "moderate" | "strong";
      dataBasis?: string;
    };
    propertySales?: {
      status: string;
      serviceArea: string;
      salesCount?: number;
      medianSalePrice?: number;
      propertyTurnoverSignal?: "low" | "moderate" | "strong";
    };
  };
  copy: {
    areaSummary: string;
    competitorSummary: string;
    planningSummary: string;
    propertySalesSummary?: string;
    revenueScenario: string;
    pipelineRisk: string;
    mainBottleneck?: string;
    bestNextCampaignAngle?: string;
    directBuildFitSummary?: string;
    scoreBreakdownSummary?: {
      businessEconomics: string;
      capacityReadiness: string;
      competitorPressure: string;
      planningData: string;
    };
    recommendedNextStep: string;
    disclaimers: string[];
  };
};

type OpportunityReportProps = {
  report: AreaOpportunityReport | null;
  loading: boolean;
  error: string;
};

const LOADING_STEPS = [
  "Analysing service area",
  "Checking visible competitors",
  "Reviewing job economics",
  "Calculating pipeline scenario",
  "Preparing DirectBuild report",
];
const MIN_LOADING_MS = 3000;

export default function OpportunityReport({
  report,
  loading,
  error,
}: OpportunityReportProps) {
  const [minimumLoadingDone, setMinimumLoadingDone] = useState(false);
  const shouldShowLoading = loading || !minimumLoadingDone;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumLoadingDone(true);
    }, MIN_LOADING_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (shouldShowLoading) {
    return (
      <ReportShell>
        <ReportLoading />
      </ReportShell>
    );
  }

  if (error || !report) {
    return (
      <ReportShell>
        <div className="space-y-3 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
            Report pending
          </p>
          <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
            We’ll review the opportunity signals manually.
          </h3>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Your application was submitted successfully. The automated report
            was not available in this session, so the DirectBuild team will
            review your trade, area, and intake fit directly.
          </p>
        </div>
      </ReportShell>
    );
  }

  const topCards = [
    ["Opportunity score", `${report.score}/100`],
    ["Recommended activation", report.recommendedActivationLevel],
    ["Target extra jobs/month", report.targetExtraJobs],
    ["Required qualified enquiries/month", report.requiredQualifiedEnquiries],
    ["Projected booked revenue", report.projectedBookedRevenueRange],
    ["Estimated ad wallet", report.estimatedAdWalletRange],
    ["Estimated gross profit", report.estimatedGrossProfitRange || undefined],
  ].filter((item): item is [string, string] => typeof item[1] === "string");
  const competitors = report.signals?.competitors;
  const planning = report.signals?.planning;
  const propertySales = report.signals?.propertySales;
  const isNationalReport =
    report.dataCoverageMode === "national" ||
    (report.primaryRegion?.state && report.primaryRegion.state !== "NSW") ||
    (report.serviceStates &&
      report.serviceStates.length > 0 &&
      !report.serviceStates.some((state) => state.toUpperCase() === "NSW"));
  const planningKeywords =
    planning?.topDirectKeywords && planning.topDirectKeywords.length > 0
      ? planning.topDirectKeywords
      : planning?.topMatchedKeywords || [];
  const planningStrength =
    planning?.signalStrength === "strong"
      ? "Strong"
      : planning?.signalStrength === "moderate"
        ? "Moderate"
        : planning?.signalStrength === "low"
          ? "Light"
          : "Pending";
  const trimmedPlanningKeywords = planningKeywords.slice(0, 4);
  const hasHighValueLowMovement =
    propertySales?.propertyTurnoverSignal === "low" &&
    typeof propertySales.salesCount === "number" &&
    propertySales.salesCount > 0 &&
    typeof propertySales.medianSalePrice === "number" &&
    propertySales.medianSalePrice > 1000000;
  const propertyMovement =
    hasHighValueLowMovement
      ? "Limited but high-value"
      : propertySales?.propertyTurnoverSignal === "strong"
      ? "Strong"
      : propertySales?.propertyTurnoverSignal === "moderate"
        ? "Moderate"
        : propertySales?.propertyTurnoverSignal === "low"
          ? "Low"
          : "Pending";
  const medianSalePrice =
    typeof propertySales?.medianSalePrice === "number"
      ? `$${Math.round(propertySales.medianSalePrice).toLocaleString("en-AU")}`
      : "";
  const averageRating =
    typeof competitors?.summary?.averageRating === "number"
      ? competitors.summary.averageRating.toFixed(1)
      : "n/a";
  const averageReviewCount =
    typeof competitors?.summary?.averageReviewCount === "number"
      ? Math.round(competitors.summary.averageReviewCount).toLocaleString("en-AU")
      : "n/a";

  return (
    <ReportShell>
      <div className="space-y-7 text-left">
        <header className="space-y-3 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
            Area Opportunity Report
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
            {report.fitLabel}
          </h3>
          <p className="text-sm text-white/50">
            {report.trade} · {report.serviceArea}
          </p>
        </header>

        {topCards.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {topCards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-4"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold tracking-[-0.02em] text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        <section className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white/80">
            Lookup focus
          </h4>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <BreakdownItem
              label="Primary region"
              value={report.primaryRegionLabel || report.primaryRegion?.label || report.serviceArea}
            />
            <BreakdownItem
              label="Data lookup area"
              value={report.dataLookupArea || report.primaryRegion?.label || report.serviceArea}
            />
            <BreakdownItem
              label="Planning council"
              value={
                report.planningCouncilName ||
                (isNationalReport ? "Not available for this state yet" : "Pending")
              }
            />
          </div>
        </section>

        <p className="rounded-lg border border-orange-safety/20 bg-orange-safety/10 px-4 py-3 text-sm leading-relaxed text-white/72">
          Use the commercial cards as a test scenario. The ad wallet is a
          starting point to validate enquiry quality, not a promised result.
        </p>
        {report.regionReviewNote && (
          <p className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-relaxed text-white/60">
            {report.regionReviewNote}
          </p>
        )}

        <div className="grid gap-4">
          <ReportSection title="What this means">
            {report.copy.areaSummary}
          </ReportSection>
          {report.copy.scoreBreakdownSummary && (
            <section className="rounded-lg border border-white/10 bg-white/[0.025] p-4 space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white/80">
                Score breakdown
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <BreakdownItem
                  label="Business economics"
                  value={report.copy.scoreBreakdownSummary.businessEconomics}
                />
                <BreakdownItem
                  label="Capacity readiness"
                  value={report.copy.scoreBreakdownSummary.capacityReadiness}
                />
                <BreakdownItem
                  label="Competitor pressure"
                  value={report.copy.scoreBreakdownSummary.competitorPressure}
                />
                <BreakdownItem
                  label="Planning data"
                  value={report.copy.scoreBreakdownSummary.planningData}
                />
              </div>
            </section>
          )}
          <section className="rounded-lg border border-white/10 bg-white/[0.025] p-4 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white/80">
              Local proof signals
            </h4>
            {isNationalReport && (
              <p className="text-sm leading-relaxed text-white/58">
                DirectBuild has assessed this area using competitor visibility
                and your business economics. Planning/property movement layers
                are currently strongest in NSW and will be expanded state by
                state.
              </p>
            )}
            <div
              className={`grid grid-cols-1 gap-3 ${
                isNationalReport ? "lg:grid-cols-4" : "lg:grid-cols-3"
              }`}
            >
              <SignalCard
                title="Planning activity"
                status={
                  planning?.status === "success"
                    ? "Active"
                    : isNationalReport
                      ? "Not available"
                      : "Pending"
                }
                rows={
                  planning?.status === "success"
                    ? [
                        ["Signal", planningStrength],
                        [
                          "Relevant records",
                          String(planning.relevantApplicationCount ?? 0),
                        ],
                        [
                          "Matched work types",
                          trimmedPlanningKeywords.length > 0
                            ? trimmedPlanningKeywords.join(", ")
                            : "n/a",
                        ],
                      ]
                    : [
                        [
                          "Planning activity",
                          isNationalReport
                            ? "Not available for this state yet"
                            : "Pending/incomplete",
                        ],
                      ]
                }
                note={
                  planning?.status === "success"
                    ? "Public NSW planning records show residential improvement activity in this lookup area."
                    : isNationalReport
                      ? "DirectBuild does not claim DA/CDC coverage outside NSW yet."
                      : "Planning records are pending for this lookup area."
                }
              />
              <SignalCard
                title="Property movement"
                status={
                  propertySales?.status === "success"
                    ? "Found"
                    : isNationalReport
                      ? "Not available"
                      : "Pending"
                }
                rows={
                  propertySales?.status === "success"
                    ? [
                        ["Signal", propertyMovement],
                        ["Recent sales", String(propertySales.salesCount ?? 0)],
                        ["Median sale price", medianSalePrice || "n/a"],
                      ]
                    : [
                        [
                          "Property movement",
                          isNationalReport
                            ? "Not available for this state yet"
                            : "Pending/incomplete",
                        ],
                      ]
                }
                note={
                  propertySales?.status === "success"
                    ? "Recent suburb-level sales can indicate upgrade triggers after purchase."
                    : isNationalReport
                      ? "Official property movement layers will be expanded state by state."
                      : "Property movement data is pending for this lookup area."
                }
              />
              <SignalCard
                title="Competitor visibility"
                status={competitors?.status === "success" ? "Found" : "Pending"}
                rows={
                  competitors?.status === "success"
                    ? [
                        [
                          "Visible competitors",
                          String(competitors.summary?.competitorCount ?? 0),
                        ],
                        ["Average rating", averageRating],
                        ["Average review depth", averageReviewCount],
                      ]
                    : [["Status", "Pending/incomplete"]]
                }
                note="This shows market presence, not guaranteed demand."
              />
              {isNationalReport && report.copy.scoreBreakdownSummary && (
                <SignalCard
                  title="Business fit/economics"
                  status="Available"
                  rows={[
                    [
                      "Business economics",
                      report.copy.scoreBreakdownSummary.businessEconomics,
                    ],
                    [
                      "Capacity readiness",
                      report.copy.scoreBreakdownSummary.capacityReadiness,
                    ],
                    ["Response speed", "Included"],
                  ]}
                  note="This uses your job value, capacity, close-rate, and response-speed inputs."
                />
              )}
            </div>
          </section>
          <ReportSection title="Main bottleneck">
            {report.copy.mainBottleneck || "Partner fit should be reviewed before activation."}
          </ReportSection>
          <ReportSection title="Best next campaign angle">
            {report.copy.bestNextCampaignAngle ||
              `Higher-value private residential ${report.trade} enquiries`}
          </ReportSection>
          <ReportSection title="Pipeline risk">
            {report.copy.pipelineRisk}
          </ReportSection>
          <ReportSection title="DirectBuild fit summary">
            {report.copy.directBuildFitSummary ||
              "Your selected region may be suitable for DirectBuild partner review. The first move should be measured activation, qualification, follow-up, quote tracking, and booked-job visibility."}
          </ReportSection>
          <ReportSection title="Recommended next step">
            {report.copy.recommendedNextStep}
          </ReportSection>
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/40">
            Notes
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/45">
            {report.copy.disclaimers.map((disclaimer) => (
              <li key={disclaimer}>{disclaimer}</li>
            ))}
          </ul>
        </div>
      </div>
    </ReportShell>
  );
}

function ReportLoading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, LOADING_STEPS.length - 1));
    }, 600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <Loader2 size={28} className="animate-spin text-orange-safety" />
      <div className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
          Preparing report
        </p>
        <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
          {LOADING_STEPS[step]}
        </h3>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-[52ch]">
          Your application has been received. We’re assembling a cautious
          commercial scenario from the available signals.
        </p>
      </div>
      <div className="grid w-full max-w-md grid-cols-5 gap-1.5">
        {LOADING_STEPS.map((item, index) => (
          <span
            key={item}
            className={`h-1 rounded-full ${
              index <= step ? "bg-orange-safety" : "bg-white/12"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ReportShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-8 lg:p-10">
      {children}
    </div>
  );
}

function SignalCard({
  title,
  status,
  rows,
  note,
}: {
  title: string;
  status: string;
  rows: Array<[string, string]>;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <h5 className="text-sm font-bold text-white/82">{title}</h5>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/52">
          {status}
        </span>
      </div>
      <dl className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] gap-3">
            <dt className="text-xs text-white/45">{label}</dt>
            <dd className="text-right text-xs font-semibold text-white/78">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-white/45">{note}</p>
    </div>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.025] p-4 space-y-2">
      <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white/80">
        {title}
      </h4>
      <p className="text-sm sm:text-base leading-relaxed text-white/62">
        {children}
      </p>
    </section>
  );
}

function BreakdownItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/15 px-3 py-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/38">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white/78">{value}</p>
    </div>
  );
}
