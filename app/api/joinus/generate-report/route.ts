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
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringOrBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  return asString(value);
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
    });

    return Response.json({
      status: "success",
      report: {
        score: score.score,
        fitLabel: score.fitLabel,
        trade,
        serviceArea,
        scoreBreakdown: score.scoreBreakdown,
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
