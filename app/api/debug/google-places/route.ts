import { getLocalCompetitors } from "@/lib/data-sources/googlePlaces";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trade = url.searchParams.get("trade") || "landscaper";
  const serviceArea = url.searchParams.get("serviceArea") || "Penrith";

  const result = await getLocalCompetitors({
    trade,
    serviceArea,
  });

  return Response.json(result);
}
