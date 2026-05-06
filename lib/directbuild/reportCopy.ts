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
    return `Competitor visibility for ${input.serviceArea} is pending because the Google Places scan returned ${input.competitorStatus}. The report can still be reviewed, but this signal should be refreshed before making a spend or capacity decision.`;
  }

  return `Google Places shows ${input.competitorCount} visible ${input.trade} competitor${
    input.competitorCount === 1 ? "" : "s"
  } around ${input.serviceArea}, with an average rating of ${formatMaybeNumber(
    input.averageRating,
    "not available",
  )} and average review depth of ${formatMaybeNumber(
    input.averageReviewCount,
    "not available",
  )}. This is a market visibility signal: it indicates how crowded the visible search surface is, not guaranteed homeowner demand.`;
}

function buildPlanningSummary(input: ReportCopyInput) {
  if (input.planningStatus === "error") {
    return "NSW Planning activity data is unavailable/pending access for this report. Treat the planning layer as incomplete rather than weak demand; it should be refreshed once DA data access is resolved.";
  }

  if (input.planningStatus === "no_results") {
    return "The NSW Planning scan did not find matching recent applications for the supplied area and trade keywords. This is a limited planning-activity signal, not evidence that homeowner demand is absent.";
  }

  const keywordText =
    input.topMatchedKeywords.length > 0
      ? ` Top matched keywords included ${input.topMatchedKeywords.join(", ")}.`
      : "";

  return `NSW Planning returned ${input.relevantApplicationCount} relevant recent planning application signal${
    input.relevantApplicationCount === 1 ? "" : "s"
  } for this trade and area.${keywordText} Treat this as supporting context, not a forecast.`;
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

  return `Commercial scenario: using the supplied ${parts.join(
    " and ",
  )}, DirectBuild can model a cautious pipeline view. The scenario should be validated against enquiry quality, follow-up speed, quote conversion, and booked-job outcomes.`;
}

function buildPipelineRisk(input: ReportCopyInput) {
  const risks = [];

  if (!isYes(input.canRespond24h)) {
    risks.push("response speed may reduce conversion if new enquiries are not followed up within 24 hours");
  }
  if (input.currentMarketingIssue?.trim()) {
    risks.push(`the stated marketing constraint is: ${input.currentMarketingIssue.trim()}`);
  }
  if (!input.capacityPerMonth) {
    risks.push("available monthly capacity has not been supplied");
  }

  if (risks.length === 0) {
    return "Primary pipeline risk is execution quality. Search visibility only becomes commercial value when enquiries are qualified, followed up quickly, quoted clearly, and tracked through to booked work.";
  }

  return `Pipeline risks: ${risks.join(
    "; ",
  )}. DirectBuild should reduce leakage through qualification, follow-up discipline, quote tracking, and booked-job visibility.`;
}

export function buildReportCopy(input: ReportCopyInput): ReportCopyResult {
  return {
    areaSummary: `${input.serviceArea} is currently assessed as a ${input.fitLabel.toLowerCase()} for ${input.trade}, with an opportunity score of ${input.score}/100. This is a directional read from the available visibility, planning, and business-readiness signals.`,
    competitorSummary: buildCompetitorSummary(input),
    planningSummary: buildPlanningSummary(input),
    revenueScenario: buildRevenueScenario(input),
    pipelineRisk: buildPipelineRisk(input),
    recommendedNextStep:
      "Recommended next step: review the signal quality with DirectBuild, confirm service-area coverage and job economics, then run a measured intake where enquiries are qualified, followed up, quoted, and tracked through to booked-job visibility.",
    disclaimers: [
      "This report uses signals and supplied assumptions; it is not a guarantee of demand, leads, revenue, or booked work.",
      "Competitor visibility from Google Places is a market presence signal, not a complete market-size estimate.",
      "Planning activity may be incomplete or unavailable depending on NSW Planning open-data access and council reporting coverage.",
      "Revenue scenarios should be validated against actual enquiry quality, quote rate, close rate, and job value.",
    ],
  };
}
