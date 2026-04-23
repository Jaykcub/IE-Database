import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toCsv } from "@/lib/csv-export";

export async function GET() {
  try {
    const rows = await prisma.workSession.findMany({
      include: {
        user: true,
        job: { include: { ship: true } },
      },
      orderBy: [{ startedAt: "desc" }],
      take: 5000,
    });

    const headers = [
      "session_id",
      "job_id",
      "wo_number",
      "ship_class",
      "hull_number",
      "user_id",
      "user_name",
      "started_at_iso",
      "ended_at_iso",
      "duration_hours_est",
    ];

    const csvRows = rows.map((s) => {
      const start = new Date(s.startedAt).getTime();
      const end = s.endedAt
        ? new Date(s.endedAt).getTime()
        : Date.now();
      const hrs = Math.max(0, (end - start) / 3600000);
      return [
        s.id,
        s.jobId,
        s.job.woNumber,
        s.job.ship.shipClass,
        s.job.ship.hullNumber,
        s.userId,
        s.user.name,
        new Date(s.startedAt).toISOString(),
        s.endedAt ? new Date(s.endedAt).toISOString() : "",
        Math.round(hrs * 100) / 100,
      ];
    });

    const body = toCsv(headers, csvRows);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="hullboard-work-sessions-powerbi.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
