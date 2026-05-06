import { getNswPlanningSignals } from "@/lib/data-sources/nswPlanning";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trade = url.searchParams.get("trade") || "landscaping";
  const serviceArea = url.searchParams.get("serviceArea") || "Penrith";

  const result = await getNswPlanningSignals({
    trade,
    serviceArea,
  });

  return Response.json(result);
}
