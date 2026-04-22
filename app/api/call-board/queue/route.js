import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Engineering / IE queue — open call-board items */
export async function GET() {
  try {
    const entries = await prisma.callBoardEntry.findMany({
      where: { status: "OPEN" },
      include: {
        job: { include: { ship: true } },
        openedBy: true,
        engineer: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
