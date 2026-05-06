"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type AreaOpportunityReport = {
  score: number;
  fitLabel: string;
  trade: string;
  serviceArea: string;
  targetExtraJobs?: string;
  requiredQualifiedEnquiries?: string;
  projectedBookedRevenueRange?: string;
  estimatedAdWalletRange?: string;
  estimatedGrossProfitRange?: string | null;
  recommendedActivationLevel?: string;
  scoreBreakdown: {
    competitorGap?: number;
    planningSignal?: number;
    businessEconomics?: number;
    capacityReadiness?: number;
  };
  copy: {
    areaSummary: string;
    competitorSummary: string;
    planningSummary: string;
    revenueScenario: string;
    pipelineRisk: string;
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
    ["Target extra jobs/month", report.targetExtraJobs],
    ["Required qualified enquiries/month", report.requiredQualifiedEnquiries],
    ["Projected booked revenue", report.projectedBookedRevenueRange],
    ["Estimated ad wallet", report.estimatedAdWalletRange],
    ["Estimated gross profit", report.estimatedGrossProfitRange || undefined],
  ].filter((item): item is [string, string] => typeof item[1] === "string");

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

        <p className="rounded-lg border border-orange-safety/20 bg-orange-safety/10 px-4 py-3 text-sm leading-relaxed text-white/72">
          This is the level of ad wallet likely needed to test whether the area
          can produce enough qualified enquiries. It is not a guaranteed cost
          per result.
        </p>

        <div className="grid gap-4">
          <ReportSection title="What this means">
            {report.copy.areaSummary}
          </ReportSection>
          <ReportSection title="Competitor visibility">
            {report.copy.competitorSummary}
          </ReportSection>
          <ReportSection title="Planning data status">
            {report.copy.planningSummary}
          </ReportSection>
          <ReportSection title="Pipeline risk">
            {report.copy.pipelineRisk}
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
