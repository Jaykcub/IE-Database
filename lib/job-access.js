/**
 * Shop / role rules for labor and foreman actions (Hullboard demo).
 * Job `department` is the shop string; user `departmentScope` is the shop they belong to.
 */

export function departmentMatchesJob(departmentScope, jobDepartment) {
  if (departmentScope == null || jobDepartment == null) return false;
  return departmentScope.trim() === jobDepartment.trim();
}

/**
 * Clock in / run own labor on this WO (start session).
 * Technicians and foremen are limited to their shop; IE / engineer / admin are not.
 */
export function canRunOwnLaborOnJob(user, job) {
  if (!user || !job) return false;
  const { role } = user;
  if (role === "ADMIN") return true;
  if (role === "IE" || role === "ENGINEER") return true;
  if (role === "TECHNICIAN" || role === "FOREMAN") {
    if (!user.departmentScope) return false;
    return departmentMatchesJob(user.departmentScope, job.department);
  }
  return false;
}

/**
 * End every active clock-in on this WO (foreman pause / shop stop).
 */
export function canClearShopLaborOnJob(user, job) {
  if (!user || !job) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "FOREMAN" && user.departmentScope) {
    return departmentMatchesJob(user.departmentScope, job.department);
  }
  return false;
}

/**
 * Complete & sign off a work order.
 */
export function canSignOffCompleteJob(user, job) {
  if (!user || !job) return false;
  if (user.role === "TECHNICIAN") return false;
  if (user.role === "FOREMAN") {
    return (
      !!user.departmentScope &&
      departmentMatchesJob(user.departmentScope, job.department)
    );
  }
  if (user.role === "ENGINEER" || user.role === "IE" || user.role === "ADMIN") {
    return true;
  }
  return false;
}

/**
 * Assistance requests and engineering call-board posts from the floor.
 */
export function canEscalateFromJob(user, job) {
  return canRunOwnLaborOnJob(user, job);
}

const PLANNING_ROLES = new Set(["ADMIN", "IE", "ENGINEER", "PLANNER"]);

/**
 * Author work-order packages: requirements text and uploaded traveler / spec files.
 */
export function canManageJobDocuments(user) {
  if (!user) return false;
  return PLANNING_ROLES.has(user.role);
}
