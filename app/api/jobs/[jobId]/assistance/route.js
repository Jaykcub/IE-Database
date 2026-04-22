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
    const message = String(body?.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const row = await prisma.assistanceRequest.create({
      data: {
        jobId,
        fromUserId: actorId,
        message,
      },
      include: { fromUser: true },
    });

    return NextResponse.json({ ok: true, assistance: row });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
