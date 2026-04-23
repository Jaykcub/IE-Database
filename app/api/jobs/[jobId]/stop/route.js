import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalcJobHoursFromSessions } from "@/lib/job-hours";
import { getActorUser } from "@/lib/session-user";
import { canClearShopLaborOnJob } from "@/lib/job-access";

export async function POST(request, props) {
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

    let body = {};
    try {
      body = await request.json();
    } catch {
      /* empty body */
    }
    const shopClear = Boolean(body?.shopClear);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (shopClear) {
      if (!canClearShopLaborOnJob(actor, job)) {
        return NextResponse.json(
          {
            error:
              "Only a foreman for this shop (or an administrator) can end all active clock-ins on this work order.",
          },
          { status: 403 },
        );
      }
      const activeCount = await prisma.workSession.count({
        where: { jobId, endedAt: null },
      });
      if (activeCount === 0) {
        return NextResponse.json(
          { error: "No active clock-ins on this work order." },
          { status: 400 },
        );
      }
      await prisma.workSession.updateMany({
        where: { jobId, endedAt: null },
        data: { endedAt: new Date() },
      });
      const hours = await recalcJobHoursFromSessions(jobId);
      return NextResponse.json({
        ok: true,
        actualHours: hours,
        shopClear: true,
        endedSessions: activeCount,
      });
    }

    const session = await prisma.workSession.findFirst({
      where: { jobId, userId: actor.id, endedAt: null },
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
