import prisma from "@/lib/prisma";

/** Recompute Job.actualHours from ended work sessions (decimal hours). */
export async function recalcJobHoursFromSessions(jobId) {
  const sessions = await prisma.workSession.findMany({
    where: { jobId },
  });
  let ms = 0;
  const now = Date.now();
  for (const s of sessions) {
    const start = new Date(s.startedAt).getTime();
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now;
    if (end >= start) ms += end - start;
  }
  const hours = Math.round((ms / 3600000) * 100) / 100;
  await prisma.job.update({
    where: { id: jobId },
    data: { actualHours: hours },
  });
  return hours;
}
