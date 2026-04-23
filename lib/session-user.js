import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const ACTOR_COOKIE = "hullboard_actor";

/** Current role-play user id (demo); set via POST /api/session */
export async function getActorUserId() {
  const jar = await cookies();
  const raw = jar.get(ACTOR_COOKIE)?.value;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Full User row for the selected yard identity, or null. */
export async function getActorUser() {
  const id = await getActorUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
