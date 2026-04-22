import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "hullboard_actor";

export async function GET() {
  try {
    const jar = await cookies();
    const raw = jar.get(ACTOR_COOKIE)?.value;
    const id = raw ? parseInt(raw, 10) : null;
    const user =
      id && Number.isFinite(id)
        ? await prisma.user.findUnique({ where: { id } })
        : null;
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const uid = parseInt(body?.userId, 10);
    if (!Number.isFinite(uid)) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(ACTOR_COOKIE, String(uid), {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACTOR_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
