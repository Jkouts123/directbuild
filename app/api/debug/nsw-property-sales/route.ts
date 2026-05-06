import { getNswPropertySalesSignals } from "@/lib/data-sources/nswPropertySales";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceArea = url.searchParams.get("serviceArea") || "Penrith";

  const result = await getNswPropertySalesSignals({ serviceArea });

  return Response.json(result);
}
