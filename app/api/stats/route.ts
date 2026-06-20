import { NextResponse } from "next/server";
import { getStats } from "@/lib/grpc/search";

export async function GET() {
  try {
    const result = await getStats();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
