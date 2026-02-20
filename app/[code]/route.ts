import { NextResponse } from "next/server";
import { getCachedLink } from "@/lib/actions/preload";
import { updateClickCount } from "@/lib/actions/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const url = await getCachedLink(code);

    if (!url) return new NextResponse("Link not Found", { status: 404 });

    void updateClickCount(code);

    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error("Redirect error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}