import { NextResponse } from "next/server";
import { signSession, sessionCookieName } from "@/lib/auth-cookie";

const SESSION_SECRET =
  process.env.HULLBOARD_SESSION_SECRET ||
  "dev-hullboard-session-secret-min-32-chars!";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "").trim().toLowerCase();

  if (username !== "admin" || password !== "admin") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession(SESSION_SECRET);
  const res = NextResponse.json({ ok: true, role: "ADMIN" });
  res.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
