import { getDB } from "@/lib/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: Request){
  if (req.headers.get("x-health-key") !== process.env.HEALTH_SECRET)
    return new Response("Unauthorized", { status: 401 });

  const start = Date.now();

  try {
    const [ redisStatus ] = await Promise.all([
      redis.ping(),
      (async () => {
        const db = await getDB();
        await db.command({ ping: 1 });
      })()
    ])

    return Response.json(
      {
        status: "ok",
        services: {
          mongodb: "connected",
          redis: redisStatus === "PONG" ? "connected" : "unknown",
        },
        latency_ms: Date.now() - start,
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

  } catch(error){
    return Response.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        latency_ms: Date.now() - start,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}