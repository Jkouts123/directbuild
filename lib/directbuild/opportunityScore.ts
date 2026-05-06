export type PlanningStatus = "success" | "error" | "no_results";

export type OpportunityScoreInput = {
  competitorCount: number;
  averageRating: number | null;
  averageReviewCount: number | null;
  planningStatus: PlanningStatus;
  relevantApplicationCount: number;
  averageJobValue?: string;
  capacityPerMonth?: string;
  closeRate?: string;
  canRespond24h?: string | boolean;
};

export type OpportunityScoreResult = {
  score: number;
  fitLabel:
    | "Strong opportunity"
    | "Promising opportunity"
    | "Needs review"
    | "Weak fit";
  scoreBreakdown: {
    competitorGap: number;
    planningSignal: number;
    businessEconomics: number;
    capacityReadiness: number;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreCompetitorGap(input: OpportunityScoreInput) {
  let score = 0;

  if (input.competitorCount <= 0) score += 10;
  else if (input.competitorCount <= 5) score += 10;
  else if (input.competitorCount <= 12) score += 8;
  else score += 5;

  if (input.averageRating === null) score += 5;
  else if (input.averageRating < 4) score += 8;
  else if (input.averageRating < 4.4) score += 6;
  else score += 3;

  if (input.averageReviewCount === null) score += 5;
  else if (input.averageReviewCount < 30) score += 7;
  else if (input.averageReviewCount < 100) score += 5;
  else score += 2;

  return clamp(score, 0, 25);
}

function scorePlanningSignal(input: OpportunityScoreInput) {
  if (input.planningStatus === "error") return 13;
  if (input.planningStatus === "no_results") return 8;

  if (input.relevantApplicationCount >= 8) return 25;
  if (input.relevantApplicationCount >= 5) return 21;
  if (input.relevantApplicationCount >= 3) return 17;
  if (input.relevantApplicationCount >= 1) return 13;

  return 10;
}

function scoreAverageJobValue(value?: string) {
  const normalised = (value || "").toLowerCase();

  if (!normalised) return 12;
  if (normalised.includes("100")) return 24;
  if (normalised.includes("50")) return 22;
  if (normalised.includes("20")) return 18;
  if (normalised.includes("5")) return 13;
  if (normalised.includes("under")) return 7;

  return 12;
}

function scoreCloseRate(closeRate?: string) {
  const match = (closeRate || "").match(/\d+(\.\d+)?/);
  if (!match) return 3;

  const value = Number(match[0]);
  if (!Number.isFinite(value)) return 3;
  if (value >= 40) return 6;
  if (value >= 25) return 5;
  if (value >= 15) return 4;
  if (value > 0) return 2;

  return 3;
}

function scoreBusinessEconomics(input: OpportunityScoreInput) {
  return clamp(
    scoreAverageJobValue(input.averageJobValue) + scoreCloseRate(input.closeRate),
    0,
    30,
  );
}

function parseCapacity(capacity?: string) {
  const value = (capacity || "").toLowerCase();
  if (!value) return null;
  if (value.includes("10")) return 10;
  if (value.includes("6")) return 6;
  if (value.includes("3")) return 3;
  if (value.includes("1")) return 1;

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function canRespondFast(value?: string | boolean) {
  if (typeof value === "boolean") return value;

  const normalised = (value || "").trim().toLowerCase();
  return ["yes", "true", "y", "1", "within 24 hours"].includes(normalised);
}

function scoreCapacityReadiness(input: OpportunityScoreInput) {
  const capacity = parseCapacity(input.capacityPerMonth);
  let score = 0;

  if (capacity === null) score += 6;
  else if (capacity >= 10) score += 12;
  else if (capacity >= 6) score += 10;
  else if (capacity >= 3) score += 8;
  else if (capacity >= 1) score += 5;

  score += canRespondFast(input.canRespond24h) ? 8 : 3;

  return clamp(score, 0, 20);
}

function getFitLabel(
  score: number,
): OpportunityScoreResult["fitLabel"] {
  if (score >= 75) return "Strong opportunity";
  if (score >= 58) return "Promising opportunity";
  if (score >= 40) return "Needs review";
  return "Weak fit";
}

export function calculateOpportunityScore(
  input: OpportunityScoreInput,
): OpportunityScoreResult {
  const scoreBreakdown = {
    competitorGap: scoreCompetitorGap(input),
    planningSignal: scorePlanningSignal(input),
    businessEconomics: scoreBusinessEconomics(input),
    capacityReadiness: scoreCapacityReadiness(input),
  };
  const score =
    scoreBreakdown.competitorGap +
    scoreBreakdown.planningSignal +
    scoreBreakdown.businessEconomics +
    scoreBreakdown.capacityReadiness;

  return {
    score: clamp(Math.round(score), 0, 100),
    fitLabel: getFitLabel(score),
    scoreBreakdown,
  };
}
