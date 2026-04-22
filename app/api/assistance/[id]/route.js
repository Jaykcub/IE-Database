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
    if (!actor || (actor.role !== "FOREMAN" && actor.role !== "ADMIN")) {
      return NextResponse.json({ error: "Foreman or admin only" }, { status: 403 });
    }

    const row = await prisma.assistanceRequest.findUnique({
      where: { id },
      include: { job: true },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (
      actor.role === "FOREMAN" &&
      actor.departmentScope &&
      row.job.department !== actor.departmentScope
    ) {
      return NextResponse.json({ error: "Not your shop" }, { status: 403 });
    }

    const body = await request.json();
    const status = String(body?.status ?? "RESOLVED").trim();
    const foremanNote = String(body?.foremanNote ?? "").trim();

    const updated = await prisma.assistanceRequest.update({
      where: { id },
      data: {
        status,
        foremanNote: foremanNote || row.foremanNote,
        resolvedAt: new Date(),
        resolvedById: actorId,
      },
      include: { job: { include: { ship: true } }, fromUser: true, resolvedBy: true },
    });

    return NextResponse.json({ ok: true, assistance: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
