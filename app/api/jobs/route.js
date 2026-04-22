import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "queue";
    const workCenter = searchParams.get("workCenter")?.trim();
    const shipKey = searchParams.get("ship")?.trim();

    const and = [];

    if (tab === "queue") {
      and.push({ status: { not: "COMPLETED" } });
    } else if (tab === "archive") {
      and.push({ status: "COMPLETED" });
    }

    if (workCenter) {
      and.push({
        OR: [
          { department: workCenter },
          { workCenterCode: workCenter },
        ],
      });
    }

    if (shipKey) {
      const parts = shipKey.trim().split(/\s+/);
      const hull = parseInt(parts[parts.length - 1], 10);
      const cls = parts.slice(0, -1).join(" ");
      if (cls && Number.isFinite(hull)) {
        and.push({ ship: { shipClass: cls, hullNumber: hull } });
      }
    }

    const where = and.length ? { AND: and } : {};

    const jobs = await prisma.job.findMany({
      where,
      include: {
        ship: true,
        signedOffBy: true,
        workSessions: {
          include: { user: true },
          orderBy: { startedAt: "desc" },
          take: 12,
        },
        assistance: {
          include: { fromUser: true, resolvedBy: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
        callBoard: {
          include: { openedBy: true, engineer: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
      orderBy: [{ dateCreated: "desc" }],
      take: 200,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const wo =
      data.woNumber ||
      `WO-MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newJob = await prisma.job.create({
      data: {
        shipId: parseInt(data.shipId, 10),
        woNumber: wo,
        department: data.department,
        workCenterCode: data.workCenterCode || null,
        jobDescription: data.jobDescription,
        phase: data.phase || null,
        buildContext: data.buildContext || null,
        allocatedHours: parseFloat(data.allocatedHours),
        actualHours: data.actualHours ? parseFloat(data.actualHours) : null,
        materialCost: data.materialCost ? parseFloat(data.materialCost) : null,
        notes: data.notes || null,
        status: data.status || "OPEN",
      },
    });
    return NextResponse.json(newJob);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
