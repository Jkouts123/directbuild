import { getAbsResidentialSignals } from "@/lib/data-sources/absCensus";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceArea = url.searchParams.get("serviceArea") || "Penrith";

  const result = await getAbsResidentialSignals({ serviceArea });

  return Response.json(result);
}
