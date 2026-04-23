import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUser } from "@/lib/session-user";
import { canManageJobDocuments } from "@/lib/job-access";

export async function DELETE(_, props) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: "Select yard identity first." }, { status: 401 });
    }
    if (!canManageJobDocuments(actor)) {
      return NextResponse.json(
        { error: "Only admin, IE, engineer, or planner can remove job files." },
        { status: 403 },
      );
    }

    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    const documentId = parseInt(params.documentId, 10);
    if (!Number.isFinite(jobId) || !Number.isFinite(documentId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const row = await prisma.jobDocument.findFirst({
      where: { id: documentId, jobId },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.jobDocument.delete({ where: { id: documentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
