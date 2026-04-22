import { cookies } from "next/headers";

const ACTOR_COOKIE = "hullboard_actor";

/** Current role-play user id (demo); set via POST /api/session */
export async function getActorUserId() {
  const jar = await cookies();
  const raw = jar.get(ACTOR_COOKIE)?.value;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
