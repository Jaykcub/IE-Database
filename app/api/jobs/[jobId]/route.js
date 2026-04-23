import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUser } from "@/lib/session-user";
import { canManageJobDocuments, canViewLaborAttribution } from "@/lib/job-access";

const jobDetailInclude = {
  ship: true,
  signedOffBy: true,
  workSessions: { include: { user: true }, orderBy: { startedAt: "desc" } },
  assistance: {
    include: { fromUser: true, resolvedBy: true },
    orderBy: { createdAt: "desc" },
  },
  callBoard: {
    include: { openedBy: true, engineer: true },
    orderBy: { createdAt: "desc" },
  },
  documents: {
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      uploadedAt: true,
      uploadedBy: { select: { id: true, name: true, role: true } },
    },
  },
};

export async function GET(_, props) {
  try {
    const actor = await getActorUser();
    const allowAllLaborVisibility = canViewLaborAttribution(actor);
    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: jobDetailInclude,
    });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...job,
      workSessions: allowAllLaborVisibility
        ? job.workSessions
        : job.workSessions.filter((s) => s.userId === actor?.id),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, props) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json(
        { error: "Select a yard identity with planning privileges first." },
        { status: 401 },
      );
    }
    if (!canManageJobDocuments(actor)) {
      return NextResponse.json(
        { error: "Only admin, IE, engineer, or planner can edit job requirements." },
        { status: 403 },
      );
    }

    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const patch = {};
    if (body.requirementsText !== undefined) {
      const v = body.requirementsText;
      patch.requirementsText =
        v === null ? null : String(v).trim().slice(0, 200_000) || null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "Send requirementsText to update (string or null)." },
        { status: 400 },
      );
    }

    await prisma.job.update({
      where: { id: jobId },
      data: patch,
    });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: jobDetailInclude,
    });

    const allowAllLaborVisibility = canViewLaborAttribution(actor);
    const visibleJob = job
      ? {
          ...job,
          workSessions: allowAllLaborVisibility
            ? job.workSessions
            : job.workSessions.filter((s) => s.userId === actor?.id),
        }
      : job;

    return NextResponse.json({ ok: true, job: visibleJob });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
