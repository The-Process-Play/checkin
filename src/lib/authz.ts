import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Viewer = { id: string; role: Role };

/**
 * IDs of users whose check-in/goal data the viewer is allowed to see.
 * "ALL" means no filtering should be applied (admin).
 */
export async function getScopedUserIds(viewer: Viewer): Promise<string[] | "ALL"> {
  if (viewer.role === "ADMIN") return "ALL";
  if (viewer.role === "EMPLOYEE") return [viewer.id];

  // MANAGER: self + direct reports only (one level deep — flat org, <50 people)
  const reports = await prisma.user.findMany({
    where: { managerId: viewer.id },
    select: { id: true },
  });
  return [viewer.id, ...reports.map((r) => r.id)];
}

/** Whether the viewer may read/write a specific 1:1 (its two named participants, or an admin). */
export function canAccessOneOnOne(
  viewer: Viewer,
  oneOnOne: { managerId: string; reportId: string }
): boolean {
  if (viewer.role === "ADMIN") return true;
  return viewer.id === oneOnOne.managerId || viewer.id === oneOnOne.reportId;
}

/** Whether the viewer may read/write a specific user's own resource (check-in, goal). */
export async function canAccessUserData(viewer: Viewer, targetUserId: string): Promise<boolean> {
  if (viewer.id === targetUserId) return true;
  const scope = await getScopedUserIds(viewer);
  return scope === "ALL" || scope.includes(targetUserId);
}

/**
 * The viewer's "team": themselves, their manager (if any), their peers (people
 * who share that same manager), and their own direct reports (if they manage
 * anyone). Used for TEAM-type goal visibility — a team goal is shared across
 * everyone on the immediate team, not just its individual owner.
 */
export async function getTeamUserIds(viewer: Viewer): Promise<string[]> {
  const ids = new Set<string>([viewer.id]);

  const me = await prisma.user.findUnique({ where: { id: viewer.id }, select: { managerId: true } });
  if (me?.managerId) {
    ids.add(me.managerId);
    const peers = await prisma.user.findMany({ where: { managerId: me.managerId }, select: { id: true } });
    peers.forEach((p) => ids.add(p.id));
  }

  const reports = await prisma.user.findMany({ where: { managerId: viewer.id }, select: { id: true } });
  reports.forEach((r) => ids.add(r.id));

  return [...ids];
}

/**
 * Whether the viewer may read/write a specific goal. INDIVIDUAL goals follow
 * the usual owner/manager/admin scoping; TEAM goals are shared across the
 * owner's whole immediate team (see getTeamUserIds) — any teammate can view
 * and update progress, since the point of a team goal is shared ownership.
 */
export async function canAccessGoal(
  viewer: Viewer,
  goal: { type: "INDIVIDUAL" | "TEAM"; ownerId: string }
): Promise<boolean> {
  if (viewer.role === "ADMIN") return true;
  if (viewer.id === goal.ownerId) return true;

  if (goal.type === "TEAM") {
    const teamIds = await getTeamUserIds(viewer);
    return teamIds.includes(goal.ownerId);
  }

  return canAccessUserData(viewer, goal.ownerId);
}
