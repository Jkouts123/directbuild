"use client";

import { Loader2 } from "lucide-react";

export type AreaOpportunityReport = {
  score: number;
  fitLabel: string;
  trade: string;
  serviceArea: string;
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

export default function OpportunityReport({
  report,
  loading,
  error,
}: OpportunityReportProps) {
  if (loading) {
    return (
      <ReportShell>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <Loader2 size={28} className="animate-spin text-orange-safety" />
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
              Building your Area Opportunity Report
            </h3>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-[52ch]">
              We’re checking competitor visibility and local planning signals.
              Your application has already been received.
            </p>
          </div>
        </div>
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

  const breakdown = [
    ["Competitor gap", report.scoreBreakdown.competitorGap],
    ["Planning signal", report.scoreBreakdown.planningSignal],
    ["Economics", report.scoreBreakdown.businessEconomics],
    ["Readiness", report.scoreBreakdown.capacityReadiness],
  ].filter((item): item is [string, number] => typeof item[1] === "number");

  return (
    <ReportShell>
      <div className="space-y-8 text-left">
        <header className="space-y-4 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-safety">
            Area Opportunity Report
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-orange-safety/40 bg-orange-safety/10">
              <span className="text-4xl font-bold tracking-[-0.04em] text-white">
                {report.score}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em]">
                {report.fitLabel}
              </h3>
              <p className="text-sm text-white/50">
                {report.trade} · {report.serviceArea}
              </p>
            </div>
          </div>
          <p className="mx-auto max-w-[58ch] text-sm sm:text-base text-white/65 leading-relaxed">
            {report.copy.areaSummary}
          </p>
        </header>

        {breakdown.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {breakdown.map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3 text-center"
              >
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-5">
          <ReportSection title="Competitor Visibility">
            {report.copy.competitorSummary}
          </ReportSection>
          <ReportSection title="Planning Activity">
            {report.copy.planningSummary}
          </ReportSection>
          <ReportSection title="Commercial Scenario">
            {report.copy.revenueScenario}
          </ReportSection>
          <ReportSection title="Pipeline Risk">
            {report.copy.pipelineRisk}
          </ReportSection>
          <ReportSection title="Recommended Next Step">
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
    <section className="space-y-2">
      <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-white/80">
        {title}
      </h4>
      <p className="text-sm sm:text-base leading-relaxed text-white/62">
        {children}
      </p>
    </section>
  );
}
