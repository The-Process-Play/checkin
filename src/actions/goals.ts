"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessUserData } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { GoalStatus, GoalType } from "@prisma/client";

export async function createGoal(input: {
  title: string;
  description?: string;
  type: GoalType;
  startDate: Date;
  targetDate: Date;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const goal = await prisma.goal.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      startDate: input.startDate,
      targetDate: input.targetDate,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/goals");
  return goal;
}

function statusForProgress(progress: number): GoalStatus {
  if (progress >= 100) return GoalStatus.COMPLETED;
  if (progress <= 0) return GoalStatus.NOT_STARTED;
  return GoalStatus.ON_TRACK;
}

export async function updateGoalProgress(input: {
  goalId: string;
  progress: number;
  note?: string;
  checkInId?: string;
  status?: GoalStatus;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const goal = await prisma.goal.findUnique({ where: { id: input.goalId } });
  if (!goal) throw new Error("Goal not found");

  const allowed = await canAccessUserData(session.user, goal.ownerId);
  if (!allowed) throw new Error("Not authorized to update this goal");

  const progress = Math.max(0, Math.min(100, input.progress));

  await prisma.$transaction([
    prisma.goal.update({
      where: { id: goal.id },
      data: { progress, status: input.status ?? statusForProgress(progress) },
    }),
    prisma.goalUpdate.create({
      data: {
        goalId: goal.id,
        authorId: session.user.id,
        checkInId: input.checkInId,
        progress,
        note: input.note,
      },
    }),
  ]);

  revalidatePath("/goals");
  revalidatePath(`/goals/${goal.id}`);
}

export async function setGoalStatus(goalId: string, status: GoalStatus) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new Error("Goal not found");

  const allowed = await canAccessUserData(session.user, goal.ownerId);
  if (!allowed) throw new Error("Not authorized to update this goal");

  await prisma.goal.update({ where: { id: goalId }, data: { status } });
  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
}

export async function getMyGoals() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.goal.findMany({
    where: { ownerId: session.user.id },
    orderBy: { targetDate: "asc" },
  });
}

export async function getGoalsForUser(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const allowed = await canAccessUserData(session.user, userId);
  if (!allowed) throw new Error("Not authorized to view this user's goals");

  return prisma.goal.findMany({
    where: { ownerId: userId },
    orderBy: { targetDate: "asc" },
  });
}

export async function getGoalById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      owner: true,
      updates: { orderBy: { createdAt: "desc" }, include: { author: true } },
    },
  });
  if (!goal) return null;

  const allowed = await canAccessUserData(session.user, goal.ownerId);
  if (!allowed) return null;

  return goal;
}
