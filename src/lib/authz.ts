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
