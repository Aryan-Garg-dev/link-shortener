import { getDB } from "@/lib/db";
import { redis } from "@/lib/redis";
import env from "@/lib/env";
import { AnalyticsParams, getAnalytics } from "@/lib/actions/server";
import { withCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics?period=daily
 * GET /api/analytics?period=monthly
 * GET /api/analytics?period=yearly
 * GET /api/analytics?from=2025-11-02&to=2025-11-10
 * GET /api/analytics?from=2025-11-02&to=2025-11-10
 */

type Period = "daily" | "monthly" | "yearly";

export async function GET(req: Request){
  if (req.headers.get("x-analytics-key") !== env.ANALYTICS_SECRET)
    return new Response("Unauthorized", { status: 401 });

  let params: AnalyticsParams;

  try {
    const { searchParams } = new URL(req.url);

    try {
      params = getParams(searchParams);
    } catch (error){
      return new Response((error as Error).message, { status: 400 })
    }

    const analytics = await getAnalytics(params);

    return Response.json(analytics, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch(err){
    return Response.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

const getParams = (searchParams: URLSearchParams): AnalyticsParams => {
  const [limitParam, fromParam, toParam, periodParam] = [
    Number(searchParams.get("limit")),
    searchParams.get("from"),
    searchParams.get("to"),
    searchParams.get("period") as Period | null
  ]

  if (fromParam && periodParam)
    throw new Error("Use either 'from/to' OR 'period' param, not both.")

  let from: Date;
  let to: Date = new Date();

  const now = new Date();

  if (periodParam){
    switch (periodParam){
      case "daily":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case "monthly":
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break;

      case "yearly":
        from = new Date(now.getFullYear(), 0, 1)
        break;

      default:
        throw new Error("Invalid period")
    }
  } else {
    from = fromParam
      ? new Date(fromParam)
      : new Date(now.setHours(0, 0, 0, 0));

    if (toParam) to = new Date(toParam);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error("Invalid date")
    }
  }

  const topLimit = Math.min(Math.max(limitParam || 5, 1), 50);

  return { from, to, topLimit }
}

