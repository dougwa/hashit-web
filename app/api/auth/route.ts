import { NextRequest, NextResponse } from "next/server";

const COOKIE = "hashit_token";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const key = process.env.PUBLIC_API_KEY;

  if (key && token !== key) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
