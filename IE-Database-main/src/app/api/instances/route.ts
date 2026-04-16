import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shipId = searchParams.get("shipId");

  const instances = await prisma.taskInstance.findMany({
    where: shipId ? { shipId } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      canonicalTask: true,
      ship: { include: { program: true } },
    },
    take: 500,
  });
  return NextResponse.json(instances);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    shipId,
    canonicalTaskId,
    phase,
    plannedHours,
    actualHours,
    scopeQuantity,
    notes,
  } = body as {
    shipId: string;
    canonicalTaskId: string;
    phase: string;
    plannedHours?: number | null;
    actualHours: number;
    scopeQuantity?: number | null;
    notes?: string | null;
  };

  if (!shipId || !canonicalTaskId || !phase || actualHours == null) {
    return NextResponse.json(
      { error: "shipId, canonicalTaskId, phase, and actualHours are required" },
      { status: 400 },
    );
  }

  const instance = await prisma.taskInstance.upsert({
    where: {
      shipId_canonicalTaskId_phase: {
        shipId,
        canonicalTaskId,
        phase,
      },
    },
    create: {
      shipId,
      canonicalTaskId,
      phase,
      plannedHours: plannedHours ?? null,
      actualHours,
      scopeQuantity: scopeQuantity ?? null,
      notes: notes ?? null,
    },
    update: {
      plannedHours: plannedHours ?? null,
      actualHours,
      scopeQuantity: scopeQuantity ?? null,
      notes: notes ?? null,
    },
    include: {
      canonicalTask: true,
      ship: { include: { program: true } },
    },
  });

  return NextResponse.json(instance);
}
