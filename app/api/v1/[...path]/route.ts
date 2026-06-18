import { NextRequest } from "next/server";

const HASHIT_URL = process.env.HASHIT_URL ?? "http://127.0.0.1:8087";
const HASHIT_TOKEN = process.env.HASHIT_TOKEN;

async function proxy(request: NextRequest, segments: string[]): Promise<Response> {
  const targetUrl = new URL(`/v1/${segments.join("/")}`, HASHIT_URL);

  // Forward incoming query params
  new URL(request.url).searchParams.forEach((v, k) =>
    targetUrl.searchParams.set(k, v)
  );

  const headers: Record<string, string> = {};
  if (HASHIT_TOKEN) headers["Authorization"] = `Bearer ${HASHIT_TOKEN}`;
  const ct = request.headers.get("Content-Type");
  if (ct) headers["Content-Type"] = ct;

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // @ts-expect-error Node.js fetch needs duplex for streaming request bodies
    duplex: hasBody ? "half" : undefined,
  });

  const respHeaders: Record<string, string> = {};
  for (const key of ["Content-Type", "Content-Length", "Content-Disposition"]) {
    const val = upstream.headers.get(key);
    if (val) respHeaders[key] = val;
  }

  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}

type Params = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path);
}
