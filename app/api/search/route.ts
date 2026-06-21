import { NextRequest, NextResponse } from "next/server";
import { queryFiles } from "@/lib/grpc/search";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  try {
    const result = await queryFiles({
      query: sp.get("q") || undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : 50,
      offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
