import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUserId } from "@/lib/session-user";

export async function POST(request, props) {
  try {
    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    const actorId = await getActorUserId();
    if (!actorId) {
      return NextResponse.json({ error: "Select yard identity first." }, { status: 401 });
    }

    const body = await request.json();
    const category = String(body?.category ?? "ENGINEERING").trim();
    const description = String(body?.description ?? "").trim();
    if (!description) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const row = await prisma.callBoardEntry.create({
      data: {
        jobId,
        openedById: actorId,
        category,
        description,
      },
      include: { openedBy: true },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "CALL_BOARD" },
    });

    return NextResponse.json({ ok: true, entry: row });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
