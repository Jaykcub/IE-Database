import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUser } from "@/lib/session-user";
import { canManageJobDocuments } from "@/lib/job-access";
import {
  decodeBase64Upload,
  sanitizeFileName,
  bufferToStoredBase64,
  MAX_JOB_DOCUMENTS_PER_JOB,
} from "@/lib/attachment-utils";

export async function POST(request, props) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: "Select yard identity first." }, { status: 401 });
    }
    if (!canManageJobDocuments(actor)) {
      return NextResponse.json(
        { error: "Only admin, IE, engineer, or planner can upload job files." },
        { status: 403 },
      );
    }

    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, _count: { select: { documents: true } } },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job._count.documents >= MAX_JOB_DOCUMENTS_PER_JOB) {
      return NextResponse.json(
        { error: `This job already has ${MAX_JOB_DOCUMENTS_PER_JOB} files (limit).` },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { mimeType, buffer } = decodeBase64Upload(body.contentBase64);
    const fileName = sanitizeFileName(body.fileName);

    const doc = await prisma.jobDocument.create({
      data: {
        jobId,
        fileName,
        mimeType,
        dataBase64: bufferToStoredBase64(buffer),
        uploadedById: actor.id,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        uploadedAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, document: doc });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
