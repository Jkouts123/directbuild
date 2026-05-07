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
  regionFitNote?: string;
  selectedRegionLabels?: string[];
  primaryRegionLabel?: string;
  planningDataPending?: boolean;
  scoreBreakdown?: {
    competitorGap: number;
    planningSignal: number;
    businessEconomics: number;
    capacityReadiness: number;
  };
};

export type ReportCopyResult = {
  areaSummary: string;
  competitorSummary: string;
  planningSummary: string;
  revenueScenario: string;
  pipelineRisk: string;
  mainBottleneck: string;
  bestNextCampaignAngle: string;
  directBuildFitSummary: string;
  scoreBreakdownSummary: {
    businessEconomics: "Strong" | "Moderate" | "Needs review";
    capacityReadiness: "Strong" | "Moderate" | "Needs review";
    competitorPressure: "Light" | "Moderate" | "Competitive" | "Pending";
    planningData: "Available" | "Pending" | "Incomplete";
  };
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

function buildMainBottleneck(input: ReportCopyInput) {
  if (!input.capacityPerMonth) return "Low spare capacity";
  if (!isYes(input.canRespond24h)) {
    return "Follow-up and quote tracking should be reviewed first";
  }
  if (!input.averageJobValue || /under/i.test(input.averageJobValue)) {
    return "Job value may be low for paid acquisition";
  }
  if ((input.selectedRegionLabels?.length || 0) > 1) {
    return "Needs tighter region focus";
  }
  if (input.competitorStatus !== "success") return "Competitor scan pending";
  if (input.competitorCount >= 12) return "Competitor-heavy region";
  if (input.planningStatus !== "success") return "Planning/property data pending";
  if (!input.preferredJobTypes || input.preferredJobTypes.length === 0) {
    return "Needs clearer job-type targeting";
  }
  return "Follow-up and quote tracking should be reviewed first";
}

function buildBestNextCampaignAngle(input: ReportCopyInput) {
  const firstPreferredJob = input.preferredJobTypes?.[0];
  if (firstPreferredJob) return `${firstPreferredJob} for private homeowners`;

  const trade = input.trade.toLowerCase();
  if (trade.includes("landscap")) return "Backyard upgrades and retaining walls";
  if (trade.includes("carpent")) {
    return "Decks and outdoor carpentry for private homeowners";
  }
  if (trade.includes("roof")) return "Roof repairs and re-roofing enquiries";
  if (trade.includes("solar")) return "Residential solar and battery enquiries";
  if (trade.includes("build") || trade.includes("renovat")) {
    return "Higher-value residential renovation enquiries";
  }

  return `Higher-value private residential ${input.trade} enquiries`;
}

function buildFitSummary(input: ReportCopyInput) {
  const multipleRegions = (input.selectedRegionLabels?.length || 0) > 1;
  const regionLine = input.regionFitNote ? `${input.regionFitNote} ` : "";
  const multiRegionLine = multipleRegions
    ? "Because you selected multiple regions, DirectBuild would review which region should be activated first based on fit, competition, response capacity, and job economics. "
    : "";

  return `${regionLine}${multiRegionLine}Your selected region may be suitable for DirectBuild partner review. The right first move is not broad scaling; it is a measured activation where DirectBuild qualifies enquiries, supports follow-up, tracks quotes, and connects marketing activity to booked-job outcomes.`;
}

function labelScore(
  score: number,
  strongAt: number,
  moderateAt: number,
): "Strong" | "Moderate" | "Needs review" {
  if (score >= strongAt) return "Strong";
  if (score >= moderateAt) return "Moderate";
  return "Needs review";
}

function buildScoreBreakdownSummary(
  input: ReportCopyInput,
): ReportCopyResult["scoreBreakdownSummary"] {
  const competitorPressure =
    input.competitorStatus !== "success"
      ? "Pending"
      : input.competitorCount >= 12
        ? "Competitive"
        : input.competitorCount >= 6
          ? "Moderate"
          : "Light";
  const planningData =
    input.planningStatus === "success"
      ? "Available"
      : input.planningStatus === "error"
        ? "Pending"
        : "Incomplete";

  return {
    businessEconomics: input.scoreBreakdown
      ? labelScore(input.scoreBreakdown.businessEconomics, 22, 14)
      : labelScore(input.score, 75, 58),
    capacityReadiness: input.scoreBreakdown
      ? labelScore(input.scoreBreakdown.capacityReadiness, 16, 10)
      : isYes(input.canRespond24h)
        ? labelScore(input.score, 58, 40)
        : "Needs review",
    competitorPressure,
    planningData,
  };
}

export function buildReportCopy(input: ReportCopyInput): ReportCopyResult {
  const multipleRegions = (input.selectedRegionLabels?.length || 0) > 1;
  const regionFocus = input.primaryRegionLabel || input.serviceArea;

  return {
    areaSummary: `${
      multipleRegions
        ? "Because multiple regions were selected, DirectBuild should review which region to activate first rather than spreading spend too thin. "
        : ""
    }You appear best suited to a measured DirectBuild activation, not broad scaling yet. The first move should be validating ${regionFocus}, qualifying enquiries properly, and tracking quotes through to booked-job outcomes before increasing ad spend.`,
    competitorSummary: buildCompetitorSummary(input),
    planningSummary: buildPlanningSummary(input),
    revenueScenario: buildRevenueScenario(input),
    pipelineRisk: buildPipelineRisk(input),
    mainBottleneck: buildMainBottleneck(input),
    bestNextCampaignAngle: buildBestNextCampaignAngle(input),
    directBuildFitSummary: buildFitSummary(input),
    scoreBreakdownSummary: buildScoreBreakdownSummary(input),
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
