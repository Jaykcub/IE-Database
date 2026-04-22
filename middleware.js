import { NextResponse } from "next/server";
import { verifySessionToken } from "./lib/auth-cookie";

const SESSION_SECRET =
  process.env.HULLBOARD_SESSION_SECRET ||
  "dev-hullboard-session-secret-min-32-chars!";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("hullboard_session")?.value;
  let ok = false;
  try {
    ok = Boolean(
      token && (await verifySessionToken(token, SESSION_SECRET)),
    );
  } catch {
    ok = false;
  }

  const isLoginApi =
    pathname === "/api/auth/login" || pathname.startsWith("/api/auth/login/");
  if (isLoginApi) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (ok) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!ok) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
