import { listFeaturedWorksPage } from "@/lib/server/works";

function parseLimit(value: string | null) {
  const limit = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(limit)) {
    return 24;
  }
  return limit;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = await listFeaturedWorksPage({
    cursor: searchParams.get("cursor"),
    limit: parseLimit(searchParams.get("limit")),
  });

  return Response.json(data);
}
