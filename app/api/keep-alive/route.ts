import { getDB } from "@/lib/db";
import env from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("x-keepalive-key") !== env.KEEPALIVE_SECRET) {
    return new Response(null, { status: 204 });
  }

  await getDB();

  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}