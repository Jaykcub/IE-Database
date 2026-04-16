import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  const ships = await prisma.ship.findMany({
    where: programId ? { programId } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { program: true },
  });
  return NextResponse.json(ships);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { programId, hullNumber, displayName, sortOrder } = body as {
    programId: string;
    hullNumber: string;
    displayName: string;
    sortOrder?: number;
  };

  if (!programId || !hullNumber || !displayName) {
    return NextResponse.json(
      { error: "programId, hullNumber, and displayName are required" },
      { status: 400 },
    );
  }

  const parsedHull = parseInt(String(hullNumber).replace(/\D/g, ""), 10);
  const ship = await prisma.ship.create({
    data: {
      programId,
      hullNumber: String(hullNumber),
      displayName,
      sortOrder:
        sortOrder ??
        (Number.isFinite(parsedHull) ? parsedHull : 0),
    },
    include: { program: true },
  });

  return NextResponse.json(ship);
}
