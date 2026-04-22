import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActorUserId } from "@/lib/session-user";

/** Foreman / admin — pending assistance requests for shops they cover */
export async function GET() {
  try {
    const actorId = await getActorUserId();
    if (!actorId) {
      return NextResponse.json(
        { error: "Select your yard identity in the jobs console." },
        { status: 401 },
      );
    }

    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) return NextResponse.json({ error: "Unknown user" }, { status: 401 });

    if (actor.role !== "FOREMAN" && actor.role !== "ADMIN") {
      return NextResponse.json({ requests: [], notice: "Foreman inbox only." });
    }

    const whereBase = { status: "PENDING" };
    const where =
      actor.role === "ADMIN" || !actor.departmentScope
        ? whereBase
        : {
            ...whereBase,
            job: { department: actor.departmentScope },
          };

    const requests = await prisma.assistanceRequest.findMany({
      where,
      include: {
        job: { include: { ship: true } },
        fromUser: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
