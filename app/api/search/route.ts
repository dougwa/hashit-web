import { NextRequest, NextResponse } from "next/server";
import { queryFiles } from "@/lib/grpc/search";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tagKey = sp.get("tag_key");
  const tagValue = sp.get("tag_value") ?? "";

  try {
    const result = await queryFiles({
      name: sp.get("name") || undefined,
      hash: sp.get("hash") || undefined,
      min_size: sp.get("min_size") ? Number(sp.get("min_size")) : undefined,
      max_size: sp.get("max_size") ? Number(sp.get("max_size")) : undefined,
      min_date: sp.get("min_date") || undefined,
      max_date: sp.get("max_date") || undefined,
      tags: tagKey ? [{ key: tagKey, value: tagValue }] : [],
      limit: sp.get("limit") ? Number(sp.get("limit")) : 50,
      offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
