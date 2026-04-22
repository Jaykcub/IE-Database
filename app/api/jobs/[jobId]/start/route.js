import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUserId } from "@/lib/session-user";

export async function POST(_, props) {
  try {
    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    const actorId = await getActorUserId();
    if (!actorId) {
      return NextResponse.json(
        { error: "Select who you are (yard identity) in the jobs header." },
        { status: 401 },
      );
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.status === "COMPLETED") {
      return NextResponse.json({ error: "Job already completed" }, { status: 400 });
    }

    const existingSame = await prisma.workSession.findFirst({
      where: { jobId, userId: actorId, endedAt: null },
    });
    if (existingSame) {
      return NextResponse.json({
        ok: true,
        session: existingSame,
        message: "Already clocked into this work order.",
      });
    }

    const otherActive = await prisma.workSession.findFirst({
      where: { userId: actorId, endedAt: null },
    });
    if (otherActive) {
      return NextResponse.json(
        {
          error:
            "Clock out of your current work order before starting another.",
          blockingJobId: otherActive.jobId,
        },
        { status: 409 },
      );
    }

    const session = await prisma.workSession.create({
      data: { jobId, userId: actorId },
      include: { user: true },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "IN_PROGRESS" },
    });

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
