import { getLocalCompetitors } from "@/lib/data-sources/googlePlaces";
import { getNswPlanningSignals } from "@/lib/data-sources/nswPlanning";
import { calculateOpportunityScore } from "@/lib/directbuild/opportunityScore";
import { buildReportCopy } from "@/lib/directbuild/reportCopy";
import { getSearchTradeLabel } from "@/lib/directbuild/tradeKeywords";

type ReportRequestBody = {
  full_name?: unknown;
  business_name?: unknown;
  abn?: unknown;
  trade_type?: unknown;
  service_area?: unknown;
  locations_serviced?: unknown;
  average_job_value?: unknown;
  capacity_per_month?: unknown;
  close_rate?: unknown;
  can_respond_24h?: unknown;
  website?: unknown;
  current_marketing_issue?: unknown;
  gross_margin_range?: unknown;
  current_marketing_spend?: unknown;
  preferred_job_types?: unknown;
  current_lead_sources?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringOrBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  return asString(value);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseMoneyRange(value: string) {
  const lower = value.toLowerCase();
  const numbers = value
    .match(/\d[\d,]*/g)
    ?.map((part) => Number(part.replace(/,/g, "")))
    .filter((number) => Number.isFinite(number));

  if (!numbers || numbers.length === 0) return null;
  if (lower.includes("under")) return { min: 0, max: numbers[0] };
  if (lower.includes("+")) return { min: numbers[0], max: null };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };

  return { min: numbers[0], max: numbers[1] };
}

function parseCapacityRange(value: string) {
  const numbers = value
    .match(/\d+/g)
    ?.map(Number)
    .filter((number) => Number.isFinite(number));

  if (!numbers || numbers.length === 0) return null;
  if (value.includes("+")) return { min: numbers[0], max: null };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };

  return { min: numbers[0], max: numbers[1] };
}

function parsePercent(value: string) {
  const match = value.match(/\d+(\.\d+)?/);
  if (!match) return null;

  const percent = Number(match[0]);
  if (!Number.isFinite(percent) || percent <= 0) return null;

  return percent / 100;
}

function parseMarginRange(value: string) {
  const lower = value.toLowerCase();
  if (!value || lower.includes("not sure")) return null;

  const numbers = value.match(/\d+(\.\d+)?/g)?.map(Number);
  if (!numbers || numbers.length === 0) return null;
  if (lower.includes("under")) return { min: 0, max: numbers[0] / 100 };
  if (lower.includes("+")) return { min: numbers[0] / 100, max: null };
  if (numbers.length === 1) return { min: numbers[0] / 100, max: numbers[0] / 100 };

  return { min: numbers[0] / 100, max: numbers[1] / 100 };
}

function formatNumberRange(min: number, max: number | null, suffix = "") {
  const minRounded = Math.ceil(min);
  if (max === null) return `${minRounded}+${suffix}`;

  const maxRounded = Math.ceil(max);
  if (minRounded === maxRounded) return `${minRounded}${suffix}`;
  return `${minRounded}–${maxRounded}${suffix}`;
}

function formatMoneyRange(min: number, max: number | null) {
  if (max === null) return `${formatCurrency(min)}+`;
  if (Math.round(min) === Math.round(max)) return formatCurrency(min);
  return `${formatCurrency(min)}–${formatCurrency(max)}`;
}

function calculateCommercialScenario(input: {
  score: number;
  capacityPerMonth: string;
  averageJobValue: string;
  closeRate: string;
  grossMarginRange: string;
}) {
  const capacity = parseCapacityRange(input.capacityPerMonth);
  const jobValue = parseMoneyRange(input.averageJobValue);
  const closeRate = parsePercent(input.closeRate);
  const margin = parseMarginRange(input.grossMarginRange);

  const targetExtraJobs = capacity
    ? formatNumberRange(capacity.min, capacity.max, " jobs/month")
    : "Capacity input needed";
  const requiredQualifiedEnquiries =
    capacity && closeRate
      ? formatNumberRange(
          capacity.min / closeRate,
          capacity.max === null ? null : capacity.max / closeRate,
          " enquiries/month",
        )
      : "Close-rate input needed";
  const projectedBookedRevenueRange =
    capacity && jobValue
      ? formatMoneyRange(
          capacity.min * jobValue.min,
          capacity.max === null || jobValue.max === null
            ? null
            : capacity.max * jobValue.max,
        )
      : "Job value and capacity inputs needed";
  const estimatedGrossProfitRange =
    capacity && jobValue && margin
      ? formatMoneyRange(
          capacity.min * jobValue.min * margin.min,
          capacity.max === null || jobValue.max === null || margin.max === null
            ? null
            : capacity.max * jobValue.max * margin.max,
        )
      : null;

  const jobValueForWallet = jobValue
    ? jobValue.max === null
      ? jobValue.min
      : (jobValue.min + jobValue.max) / 2
    : null;
  const baseWallet =
    jobValueForWallet === null
      ? null
      : jobValueForWallet < 7500
        ? { min: 750, max: 1500 }
        : jobValueForWallet < 15000
          ? { min: 1500, max: 3000 }
          : jobValueForWallet < 30000
            ? { min: 2500, max: 5000 }
            : { min: 4000, max: 8000 };
  const enquiryMin = capacity && closeRate ? capacity.min / closeRate : null;
  const walletMultiplier =
    enquiryMin === null ? 1 : enquiryMin >= 20 ? 1.5 : enquiryMin >= 10 ? 1.25 : 1;
  const estimatedAdWalletRange = baseWallet
    ? formatMoneyRange(baseWallet.min * walletMultiplier, baseWallet.max * walletMultiplier)
    : "Average job value input needed";
  const recommendedActivationLevel =
    input.score >= 75
      ? "Priority measured activation"
      : input.score >= 58
        ? "Controlled test activation"
        : input.score >= 40
          ? "Manual review before activation"
          : "Improve inputs before activation";

  return {
    targetExtraJobs,
    requiredQualifiedEnquiries,
    projectedBookedRevenueRange,
    estimatedAdWalletRange,
    estimatedGrossProfitRange,
    recommendedActivationLevel,
  };
}

function errorResponse(message: string, status = 400) {
  return Response.json(
    {
      status: "error",
      error: message,
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | ReportRequestBody
      | null;

    if (!body) {
      return errorResponse("Request body must be valid JSON.");
    }

    const trade = asString(body.trade_type);
    const serviceArea = asString(body.service_area);

    if (!trade) {
      return errorResponse("trade_type is required.");
    }

    if (!serviceArea) {
      return errorResponse("service_area is required.");
    }

    const searchTrade = getSearchTradeLabel(trade);

    const [competitorResult, planningResult] = await Promise.all([
      getLocalCompetitors({
        trade: searchTrade,
        serviceArea,
      }).catch((error) => ({
        source: "google_places" as const,
        status: "error" as const,
        query: `${searchTrade} ${serviceArea} NSW Australia`,
        competitors: [],
        summary: {
          competitorCount: 0,
          averageRating: null,
          averageReviewCount: null,
        },
        error:
          error instanceof Error
            ? error.message
            : "Unknown Google Places error.",
      })),
      getNswPlanningSignals({
        trade,
        serviceArea,
      }).catch((error) => ({
        source: "nsw_planning" as const,
        status: "error" as const,
        query: `${trade} ${serviceArea} NSW development applications`,
        serviceArea,
        relevantApplications: [],
        summary: {
          relevantApplicationCount: 0,
          topMatchedKeywords: [],
          signalStrength: "low" as const,
        },
        error:
          error instanceof Error
            ? error.message
            : "Unknown NSW Planning data error.",
      })),
    ]);

    const score = calculateOpportunityScore({
      competitorCount: competitorResult.summary.competitorCount,
      averageRating: competitorResult.summary.averageRating,
      averageReviewCount: competitorResult.summary.averageReviewCount,
      planningStatus: planningResult.status,
      relevantApplicationCount:
        planningResult.summary.relevantApplicationCount,
      averageJobValue: asString(body.average_job_value),
      capacityPerMonth: asString(body.capacity_per_month),
      closeRate: asString(body.close_rate),
      canRespond24h: asStringOrBoolean(body.can_respond_24h),
    });

    const copy = buildReportCopy({
      trade,
      serviceArea,
      fitLabel: score.fitLabel,
      score: score.score,
      competitorCount: competitorResult.summary.competitorCount,
      averageRating: competitorResult.summary.averageRating,
      averageReviewCount: competitorResult.summary.averageReviewCount,
      competitorStatus: competitorResult.status,
      planningStatus: planningResult.status,
      relevantApplicationCount:
        planningResult.summary.relevantApplicationCount,
      topMatchedKeywords: planningResult.summary.topMatchedKeywords,
      averageJobValue: asString(body.average_job_value),
      capacityPerMonth: asString(body.capacity_per_month),
      closeRate: asString(body.close_rate),
      canRespond24h: asStringOrBoolean(body.can_respond_24h),
      currentMarketingIssue: asString(body.current_marketing_issue),
      grossMarginRange: asString(body.gross_margin_range),
      currentMarketingSpend: asString(body.current_marketing_spend),
      preferredJobTypes: asStringArray(body.preferred_job_types),
      currentLeadSources: asStringArray(body.current_lead_sources),
    });
    const scenario = calculateCommercialScenario({
      score: score.score,
      capacityPerMonth: asString(body.capacity_per_month),
      averageJobValue: asString(body.average_job_value),
      closeRate: asString(body.close_rate),
      grossMarginRange: asString(body.gross_margin_range),
    });

    return Response.json({
      status: "success",
      report: {
        score: score.score,
        fitLabel: score.fitLabel,
        trade,
        serviceArea,
        scoreBreakdown: score.scoreBreakdown,
        ...scenario,
        signals: {
          competitors: competitorResult,
          planning: planningResult,
        },
        copy,
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unknown report generation error.",
      },
      { status: 500 },
    );
  }
}
