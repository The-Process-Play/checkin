"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentPeriodStart, periodEndFor } from "@/lib/period";
import { updateGoalProgress } from "@/actions/goals";
import { revalidatePath } from "next/cache";

export type CheckInResponseInput = {
  questionId: string;
  textValue?: string;
  scaleValue?: number;
};

export type GoalUpdateInput = {
  goalId: string;
  progress: number;
  note?: string;
};

export async function submitCheckIn(input: {
  templateId: string;
  moodScore?: number;
  energyScore?: number;
  responses: CheckInResponseInput[];
  goalUpdate?: GoalUpdateInput;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const periodStart = currentPeriodStart();
  const periodEnd = periodEndFor(periodStart);

  const checkIn = await prisma.checkIn.upsert({
    where: { authorId_periodStart: { authorId: session.user.id, periodStart } },
    update: {
      moodScore: input.moodScore,
      energyScore: input.energyScore,
      submittedAt: new Date(),
    },
    create: {
      authorId: session.user.id,
      templateId: input.templateId,
      periodStart,
      periodEnd,
      moodScore: input.moodScore,
      energyScore: input.energyScore,
      submittedAt: new Date(),
    },
  });

  for (const response of input.responses) {
    await prisma.checkInResponse.upsert({
      where: { checkInId_questionId: { checkInId: checkIn.id, questionId: response.questionId } },
      update: { textValue: response.textValue, scaleValue: response.scaleValue },
      create: {
        checkInId: checkIn.id,
        questionId: response.questionId,
        textValue: response.textValue,
        scaleValue: response.scaleValue,
      },
    });
  }

  if (input.goalUpdate) {
    // updateGoalProgress re-validates that the caller owns the goal.
    await updateGoalProgress({
      goalId: input.goalUpdate.goalId,
      progress: input.goalUpdate.progress,
      note: input.goalUpdate.note,
      checkInId: checkIn.id,
    });
  }

  revalidatePath("/check-ins");
  revalidatePath("/");
  return checkIn;
}

export async function getMyCheckInHistory() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.checkIn.findMany({
    where: { authorId: session.user.id },
    orderBy: { periodStart: "desc" },
    include: { responses: { include: { question: true } } },
  });
}

export async function getActiveTemplate() {
  const template = await prisma.checkInTemplate.findFirst({
    where: { isActive: true },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!template) throw new Error("No active check-in template configured");
  return template;
}

export async function getCurrentWeekCheckIn() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const periodStart = currentPeriodStart();
  return prisma.checkIn.findUnique({
    where: { authorId_periodStart: { authorId: session.user.id, periodStart } },
    include: { responses: true },
  });
}

export async function getCheckInHistoryForUser(userId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const { canAccessUserData } = await import("@/lib/authz");
  const allowed = await canAccessUserData(session.user, userId);
  if (!allowed) throw new Error("Not authorized to view this user's check-ins");

  return prisma.checkIn.findMany({
    where: { authorId: userId },
    orderBy: { periodStart: "desc" },
    include: { responses: { include: { question: true } } },
  });
}

export async function getCheckInById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
    include: { responses: { include: { question: true } }, author: true },
  });
  if (!checkIn) return null;

  const { canAccessUserData } = await import("@/lib/authz");
  const allowed = await canAccessUserData(session.user, checkIn.authorId);
  if (!allowed) return null;

  return checkIn;
}
