import { NextRequest, NextResponse } from "next/server";

function isAuthenticated(request: NextRequest): boolean {
  const key = process.env.PUBLIC_API_KEY;
  if (!key) return true; // no key configured → open (dev mode)

  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ") && auth.slice(7) === key) return true;

  return request.cookies.get("hashit_token")?.value === key;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes — require auth, return 401 JSON on failure
  if (
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/stats") ||
    pathname.startsWith("/api/meta")
  ) {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Auth endpoint — always open
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Login page — always open
  if (pathname.startsWith("/login")) return NextResponse.next();

  // All other web routes — redirect to /login if not authenticated
  if (!isAuthenticated(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude all Next.js internals (`_next/*` — static assets, RSC data, and dev
  // endpoints like the HMR socket) from auth. Gating those breaks the dev
  // runtime: intercepted `_next` requests get 307'd to /login instead of their
  // expected payloads, which stops the client from hydrating.
  matcher: ["/((?!_next/|favicon\\.ico|public/).*)"],
};
