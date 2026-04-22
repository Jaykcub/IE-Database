import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalcJobHoursFromSessions } from "@/lib/job-hours";
import { getActorUserId } from "@/lib/session-user";

export async function POST(_, props) {
  try {
    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    const actorId = await getActorUserId();
    if (!actorId) {
      return NextResponse.json(
        { error: "Select who you are (yard identity) first." },
        { status: 401 },
      );
    }

    const session = await prisma.workSession.findFirst({
      where: { jobId, userId: actorId, endedAt: null },
    });
    if (!session) {
      return NextResponse.json({ error: "No active session on this job" }, { status: 400 });
    }

    await prisma.workSession.update({
      where: { id: session.id },
      data: { endedAt: new Date() },
    });

    const hours = await recalcJobHoursFromSessions(jobId);

    return NextResponse.json({ ok: true, actualHours: hours });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
