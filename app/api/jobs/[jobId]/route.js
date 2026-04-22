import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_, props) {
  try {
    const params = await props.params;
    const jobId = parseInt(params.jobId, 10);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
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
      },
    });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
