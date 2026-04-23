import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalcJobHoursFromSessions } from "@/lib/job-hours";
import { getActorUser } from "@/lib/session-user";
import { canSignOffCompleteJob } from "@/lib/job-access";

export async function POST(_, props) {
  try {
    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json(
        { error: "Select who you are (yard identity) first." },
        { status: 401 },
      );
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canSignOffCompleteJob(actor, job)) {
      return NextResponse.json(
        {
          error:
            "You cannot sign off this work order. Technicians cannot complete jobs; foremen only in their own shop; engineers / IE / admin may complete any job.",
        },
        { status: 403 },
      );
    }
    const actorId = actor.id;

    await prisma.workSession.updateMany({
      where: { jobId, userId: actorId, endedAt: null },
      data: { endedAt: new Date() },
    });

    await prisma.workSession.updateMany({
      where: { jobId, endedAt: null },
      data: { endedAt: new Date() },
    });

    const hours = await recalcJobHoursFromSessions(jobId);

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        signedOffById: actorId,
        actualHours: hours,
      },
      include: { signedOffBy: true, ship: true },
    });

    return NextResponse.json({ ok: true, job: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
