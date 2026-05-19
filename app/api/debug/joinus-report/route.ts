import { getServiceRegionById } from "@/lib/directbuild/serviceRegions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trade = url.searchParams.get("trade") || "Carpentry";
  const regionId =
    url.searchParams.get("regionId") || "nsw-sydney-western-sydney";
  const region = getServiceRegionById(regionId);
  const serviceArea = region?.label || url.searchParams.get("serviceArea") || "";
  const serviceStates = region ? [region.state] : [];

  const reportResponse = await fetch(new URL("/api/joinus/generate-report", url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trade_type: trade,
      service_area: serviceArea,
      service_states: serviceStates,
      service_region_ids: region ? [region.id] : [],
      average_job_value: "$15,000-$30,000",
      capacity_per_month: "3-5",
      close_rate: "15-25%",
      can_respond_24h: "Yes",
      gross_margin_range: "15-25%",
      preferred_job_types: ["Decks", "Renovation work"],
      current_marketing_issue: "More private homeowner enquiries",
    }),
  });

  const json = await reportResponse.json().catch(() => ({}));

  return Response.json(json, { status: reportResponse.status });
}
