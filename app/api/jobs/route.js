import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUser } from "@/lib/session-user";
import { canManageJobDocuments, canViewLaborAttribution } from "@/lib/job-access";
import {
  decodeBase64Upload,
  sanitizeFileName,
  bufferToStoredBase64,
  MAX_JOB_DOCUMENTS_PER_JOB,
} from "@/lib/attachment-utils";

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

    const actor = await getActorUser();
    const allowAllLaborVisibility = canViewLaborAttribution(actor);

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
        documents: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            uploadedAt: true,
            uploadedBy: { select: { id: true, name: true } },
          },
          take: 20,
        },
      },
      orderBy: [{ dateCreated: "desc" }],
      take: 200,
    });

    const visibleJobs = jobs.map((job) => ({
      ...job,
      workSessions: allowAllLaborVisibility
        ? job.workSessions
        : job.workSessions.filter((s) => s.userId === actor?.id),
    }));

    return NextResponse.json(visibleJobs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json(
        { error: "Select a yard identity with planning privileges (admin, IE, engineer, or planner)." },
        { status: 401 },
      );
    }
    if (!canManageJobDocuments(actor)) {
      return NextResponse.json(
        {
          error:
            "Only admin, IE, engineer, or planner identities can create job packages with requirements and files.",
        },
        { status: 403 },
      );
    }

    const data = await request.json();
    const wo =
      data.woNumber ||
      `WO-MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const requirementsRaw = data.requirementsText;
    const requirementsText =
      requirementsRaw === undefined || requirementsRaw === null
        ? null
        : String(requirementsRaw).trim().slice(0, 200_000) || null;

    const attachments = Array.isArray(data.attachments) ? data.attachments : [];
    if (attachments.length > MAX_JOB_DOCUMENTS_PER_JOB) {
      return NextResponse.json(
        { error: `At most ${MAX_JOB_DOCUMENTS_PER_JOB} files per job.` },
        { status: 400 },
      );
    }

    const newJob = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          shipId: parseInt(data.shipId, 10),
          woNumber: wo,
          department: data.department,
          workCenterCode: data.workCenterCode || null,
          jobDescription: data.jobDescription,
          phase: data.phase || null,
          buildContext: data.buildContext || null,
          workPackageCode: data.workPackageCode?.trim() || null,
          drawingRef: data.drawingRef?.trim() || null,
          zone: data.zone?.trim() || null,
          scheduleCode: data.scheduleCode?.trim() || null,
          allocatedHours: parseFloat(data.allocatedHours),
          actualHours: data.actualHours ? parseFloat(data.actualHours) : null,
          materialCost: data.materialCost ? parseFloat(data.materialCost) : null,
          notes: data.notes || null,
          requirementsText,
          status: data.status || "OPEN",
        },
      });

      for (const att of attachments) {
        const { mimeType, buffer } = decodeBase64Upload(att.contentBase64);
        const fileName = sanitizeFileName(att.fileName);
        await tx.jobDocument.create({
          data: {
            jobId: job.id,
            fileName,
            mimeType,
            dataBase64: bufferToStoredBase64(buffer),
            uploadedById: actor.id,
          },
        });
      }

      return job;
    });

    const full = await prisma.job.findUnique({
      where: { id: newJob.id },
      include: {
        ship: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            uploadedAt: true,
            uploadedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(full);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
