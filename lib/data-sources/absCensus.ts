type AbsResidentialSignalsInput = {
  serviceArea: string;
};

type AbsResidentialSignalsResult = {
  source: "abs_census";
  status: "success" | "error" | "unavailable";
  serviceArea: string;
  summary: {
    residentialFitSignal: "low" | "moderate" | "strong" | "pending";
    detachedDwellingSignal?: "low" | "moderate" | "strong";
    ownerOccupierSignal?: "low" | "moderate" | "strong";
    householdIncomeSignal?: "low" | "moderate" | "strong";
  };
  notes: string[];
  error?: string;
};

const ABS_DATAFLOW_DISCOVERY_URL =
  "https://data.api.abs.gov.au/rest/dataflow/ABS";

function buildResult(
  status: AbsResidentialSignalsResult["status"],
  serviceArea: string,
  notes: string[],
  error?: string,
): AbsResidentialSignalsResult {
  return {
    source: "abs_census",
    status,
    serviceArea,
    summary: {
      residentialFitSignal: "pending",
    },
    notes,
    ...(error ? { error } : {}),
  };
}

export async function getAbsResidentialSignals(
  input: AbsResidentialSignalsInput,
): Promise<AbsResidentialSignalsResult> {
  const serviceArea = input.serviceArea.trim();

  try {
    const response = await fetch(ABS_DATAFLOW_DISCOVERY_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return buildResult(
        "unavailable",
        serviceArea,
        [
          "ABS Data API discovery was checked, but a usable suburb-level Census query has not been wired yet.",
          "Unavailable ABS data should be treated as pending, not as low residential demand.",
        ],
        `ABS discovery request returned ${response.status}.`,
      );
    }

    return buildResult("unavailable", serviceArea, [
      "ABS Data API is reachable, but service-area to ABS geography mapping is not implemented yet.",
      "A future implementation should map suburb/service area to ASGS geography before requesting Census dwelling, tenure, and income measures.",
      "Unavailable ABS data should be treated as pending, not as low residential demand.",
    ]);
  } catch (error) {
    return buildResult(
      "error",
      serviceArea,
      [
        "ABS residential-fit data could not be checked in this request.",
        "Unavailable ABS data should be treated as pending, not as low residential demand.",
      ],
      error instanceof Error ? error.message : "Unknown ABS Census data error.",
    );
  }
}

// TODO: Connect official ABS Census/Data API once geography mapping is in place.
// Required official source:
// - ABS Data API / Census data products using ASGS geography.
// Required fields:
// - detached or separate-house dwelling share
// - owner-occupier or tenure signal
// - household income signal by suburb-equivalent geography
// - service-area to SA2/SA1/SSC mapping confidence
// Report value:
// - helps DirectBuild separate areas with stronger residential-owner fit from
//   areas where campaigns may need different positioning or manual review.
// Important:
// - if ABS data is unavailable, incomplete, or unmapped, do not treat it as low
//   demand. Keep it pending/unavailable until real mapped data is returned.
