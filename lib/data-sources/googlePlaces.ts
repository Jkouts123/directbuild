type GetLocalCompetitorsInput = {
  trade: string;
  serviceArea: string;
  pageSize?: number;
};

type LocalCompetitor = {
  name: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  website?: string;
};

type GetLocalCompetitorsResult = {
  source: "google_places";
  status: "success" | "error" | "missing_api_key";
  query: string;
  competitors: LocalCompetitor[];
  summary: {
    competitorCount: number;
    averageRating: number | null;
    averageReviewCount: number | null;
  };
  error?: string;
};

type GooglePlacesTextSearchResponse = {
  places?: Array<{
    displayName?: {
      text?: string;
    };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    websiteUri?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK =
  "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri";

function buildEmptyResult(
  status: GetLocalCompetitorsResult["status"],
  query: string,
  error?: string,
): GetLocalCompetitorsResult {
  return {
    source: "google_places",
    status,
    query,
    competitors: [],
    summary: {
      competitorCount: 0,
      averageRating: null,
      averageReviewCount: null,
    },
    ...(error ? { error } : {}),
  };
}

function normalisePageSize(pageSize?: number) {
  if (!Number.isFinite(pageSize)) return 10;
  return Math.max(1, Math.min(Math.trunc(pageSize || 10), 20));
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function getLocalCompetitors(
  input: GetLocalCompetitorsInput,
): Promise<GetLocalCompetitorsResult> {
  const trade = input.trade.trim();
  const serviceArea = input.serviceArea.trim();
  const query = `${trade} ${serviceArea} NSW Australia`;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return buildEmptyResult("missing_api_key", query, "GOOGLE_MAPS_API_KEY is not set.");
  }

  try {
    const response = await fetch(PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: normalisePageSize(input.pageSize),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as
      GooglePlacesTextSearchResponse;

    if (!response.ok) {
      return buildEmptyResult(
        "error",
        query,
        data.error?.message ||
          `Google Places request failed with status ${response.status}.`,
      );
    }

    const competitors = (data.places || [])
      .map((place): LocalCompetitor | null => {
        const name = place.displayName?.text?.trim();
        if (!name) return null;

        return {
          name,
          ...(place.formattedAddress
            ? { address: place.formattedAddress }
            : {}),
          ...(typeof place.rating === "number" ? { rating: place.rating } : {}),
          ...(typeof place.userRatingCount === "number"
            ? { reviewCount: place.userRatingCount }
            : {}),
          ...(place.websiteUri ? { website: place.websiteUri } : {}),
        };
      })
      .filter((competitor): competitor is LocalCompetitor => competitor !== null);

    return {
      source: "google_places",
      status: "success",
      query,
      competitors,
      summary: {
        competitorCount: competitors.length,
        averageRating: average(
          competitors
            .map((competitor) => competitor.rating)
            .filter((rating): rating is number => typeof rating === "number"),
        ),
        averageReviewCount: average(
          competitors
            .map((competitor) => competitor.reviewCount)
            .filter(
              (reviewCount): reviewCount is number =>
                typeof reviewCount === "number",
            ),
        ),
      },
    };
  } catch (error) {
    return buildEmptyResult(
      "error",
      query,
      error instanceof Error ? error.message : "Unknown Google Places error.",
    );
  }
}
