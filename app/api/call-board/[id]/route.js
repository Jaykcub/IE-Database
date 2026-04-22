import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUserId } from "@/lib/session-user";

export async function PATCH(request, props) {
  try {
    const params = await props.params;
    const id = parseInt(params.id, 10);
    const actorId = await getActorUserId();
    if (!actorId) {
      return NextResponse.json({ error: "Select yard identity." }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor || (actor.role !== "ENGINEER" && actor.role !== "IE" && actor.role !== "ADMIN")) {
      return NextResponse.json({ error: "Engineering / IE / admin only" }, { status: 403 });
    }

    const existing = await prisma.callBoardEntry.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const engineerResponse = String(body?.engineerResponse ?? "").trim();
    const resolutionNote = String(body?.resolutionNote ?? "").trim();
    const status = String(body?.status ?? "CLOSED").trim();

    const updated = await prisma.callBoardEntry.update({
      where: { id },
      data: {
        engineerResponse: engineerResponse || existing.engineerResponse,
        resolutionNote: resolutionNote || existing.resolutionNote,
        engineerId: actor.role === "ADMIN" ? existing.engineerId ?? actorId : actorId,
        status,
        closedAt: status === "CLOSED" ? new Date() : existing.closedAt,
      },
      include: {
        job: { include: { ship: true } },
        openedBy: true,
        engineer: true,
      },
    });

    if (status === "CLOSED") {
      await prisma.job.update({
        where: { id: existing.jobId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({ ok: true, entry: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
