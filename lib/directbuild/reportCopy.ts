type ReportCopyInput = {
  trade: string;
  serviceArea: string;
  fitLabel: string;
  score: number;
  competitorCount: number;
  averageRating: number | null;
  averageReviewCount: number | null;
  competitorStatus: string;
  planningStatus: "success" | "error" | "no_results";
  relevantApplicationCount: number;
  topMatchedKeywords: string[];
  averageJobValue?: string;
  capacityPerMonth?: string;
  closeRate?: string;
  canRespond24h?: string | boolean;
  currentMarketingIssue?: string;
  grossMarginRange?: string;
  currentMarketingSpend?: string;
  preferredJobTypes?: string[];
  currentLeadSources?: string[];
};

export type ReportCopyResult = {
  areaSummary: string;
  competitorSummary: string;
  planningSummary: string;
  revenueScenario: string;
  pipelineRisk: string;
  recommendedNextStep: string;
  disclaimers: string[];
};

function formatMaybeNumber(value: number | null, fallback: string) {
  if (value === null) return fallback;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function isYes(value?: string | boolean) {
  if (typeof value === "boolean") return value;
  return (value || "").trim().toLowerCase() === "yes";
}

function formatCapacity(value?: string) {
  const capacity = (value || "").trim();
  if (!capacity) return "";

  if (/job|month|capacity|per\s*month|\/\s*month|\/\s*mo/i.test(capacity)) {
    return capacity;
  }

  return `${capacity} extra jobs per month`;
}

function buildCompetitorSummary(input: ReportCopyInput) {
  if (input.competitorStatus !== "success") {
    return "Competitor scan pending. This report can still be reviewed, but market visibility should be refreshed before activation.";
  }

  return `Visible competitor set: ${input.competitorCount} ${input.trade} competitor${
    input.competitorCount === 1 ? "" : "s"
  } around ${input.serviceArea}. Avg rating: ${formatMaybeNumber(
    input.averageRating,
    "n/a",
  )}. Avg review depth: ${formatMaybeNumber(
    input.averageReviewCount,
    "n/a",
  )}. This is a market visibility signal, not a demand guarantee.`;
}

function buildPlanningSummary(input: ReportCopyInput) {
  if (input.planningStatus === "error") {
    return "Planning activity data is unavailable/pending access for this report. Treat the planning layer as incomplete rather than weak demand.";
  }

  if (input.planningStatus === "no_results") {
    return "No matching recent planning applications were found from the available scan. Treat this as limited planning context, not evidence of low homeowner demand.";
  }

  const keywordText =
    input.topMatchedKeywords.length > 0
      ? ` Top matched keywords included ${input.topMatchedKeywords.join(", ")}.`
      : "";

  return `Planning scan: ${input.relevantApplicationCount} relevant recent application signal${
    input.relevantApplicationCount === 1 ? "" : "s"
  }.${keywordText} Supporting context only, not a forecast.`;
}

function buildRevenueScenario(input: ReportCopyInput) {
  const parts = [];
  const capacity = formatCapacity(input.capacityPerMonth);

  if (input.averageJobValue) {
    parts.push(`average job value band of ${input.averageJobValue}`);
  }
  if (capacity) {
    parts.push(`available capacity of ${capacity}`);
  }
  if (input.closeRate) {
    parts.push(`close-rate assumption of ${input.closeRate}`);
  }

  if (parts.length === 0) {
    return "A commercial scenario needs job value, capacity, and close-rate inputs before it should be quantified. DirectBuild would treat those as planning assumptions, not forecast revenue.";
  }

  return `Based on ${parts.join(
    " and ",
  )}. Use the cards above as a test scenario, then validate against enquiry quality, follow-up speed, quote conversion, and booked jobs.`;
}

function buildPipelineRisk(input: ReportCopyInput) {
  const improvementArea = input.currentMarketingIssue?.trim();

  if (improvementArea) {
    return `Your first improvement area is ${improvementArea.toLowerCase()}. DirectBuild should focus on qualification, follow-up, quote tracking, and outcome visibility before scaling ad spend.`;
  }

  if (!isYes(input.canRespond24h)) {
    return "Response speed is the first operational risk. DirectBuild should tighten qualification and follow-up before increasing enquiry volume.";
  }

  if (!input.capacityPerMonth) {
    return "Capacity is not yet clear. DirectBuild should confirm available monthly slots before testing paid acquisition.";
  }

  return "Primary pipeline risk is execution quality. Visibility only becomes commercial value when enquiries are qualified, followed up, quoted, and tracked through to booked work.";
}

export function buildReportCopy(input: ReportCopyInput): ReportCopyResult {
  return {
    areaSummary: `${input.serviceArea} is assessed as a ${input.fitLabel.toLowerCase()} for ${input.trade}. Score: ${input.score}/100, based on supplied business inputs and available market signals.`,
    competitorSummary: buildCompetitorSummary(input),
    planningSummary: buildPlanningSummary(input),
    revenueScenario: buildRevenueScenario(input),
    pipelineRisk: buildPipelineRisk(input),
    recommendedNextStep:
      "Confirm the job mix, economics, and service-area coverage. Then run a measured DirectBuild activation with qualification, follow-up, quote tracking, and booked-job visibility in place.",
    disclaimers: [
      "Scenario only, based on supplied inputs and available signals.",
      "Not a guarantee of demand, lead volume, revenue, profit, or booked work.",
      "Competitor visibility is a market presence signal, not a full market-size estimate.",
      "Ad wallet estimates are subject to campaign testing and actual enquiry quality.",
    ],
  };
}
