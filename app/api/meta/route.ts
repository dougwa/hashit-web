import { NextRequest, NextResponse } from "next/server";
import { getMeta, putMeta } from "@/lib/grpc/fileops";

export async function GET(req: NextRequest) {
  const paths = req.nextUrl.searchParams.getAll("path");
  if (!paths.length) {
    return NextResponse.json({ error: "No paths specified" }, { status: 400 });
  }
  try {
    const result = await getMeta(paths);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paths, set, remove } = body as {
    paths: string[];
    set?: Record<string, string>;
    remove?: string[];
  };
  if (!paths?.length) {
    return NextResponse.json({ error: "No paths specified" }, { status: 400 });
  }
  try {
    const result = await putMeta(paths, set ?? {}, remove ?? []);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
