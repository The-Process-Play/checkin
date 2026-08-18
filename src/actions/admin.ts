"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role, QuestionType } from "@prisma/client";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Admin access required");
  return session;
}

export async function getAllUsers() {
  await assertAdmin();
  return prisma.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    include: { manager: true },
  });
}

export async function updateUserRole(userId: string, role: Role) {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function updateUserManager(userId: string, managerId: string | null) {
  await assertAdmin();
  if (managerId === userId) throw new Error("A user cannot manage themselves");
  await prisma.user.update({ where: { id: userId }, data: { managerId } });
  revalidatePath("/admin/users");
}

export async function setUserActive(userId: string, isActive: boolean) {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
}

export async function getActiveTemplateWithQuestions() {
  await assertAdmin();
  return prisma.checkInTemplate.findFirst({
    where: { isActive: true },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function addTemplateQuestion(templateId: string, input: { prompt: string; type: QuestionType; isRequired: boolean }) {
  await assertAdmin();
  const maxOrder = await prisma.checkInQuestion.aggregate({
    where: { templateId },
    _max: { order: true },
  });
  await prisma.checkInQuestion.create({
    data: {
      templateId,
      prompt: input.prompt,
      type: input.type,
      isRequired: input.isRequired,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  revalidatePath("/admin/templates");
}

export async function updateTemplateQuestion(questionId: string, input: { prompt: string; isRequired: boolean }) {
  await assertAdmin();
  await prisma.checkInQuestion.update({
    where: { id: questionId },
    data: { prompt: input.prompt, isRequired: input.isRequired },
  });
  revalidatePath("/admin/templates");
}

export async function deleteTemplateQuestion(questionId: string) {
  await assertAdmin();
  await prisma.checkInQuestion.delete({ where: { id: questionId } });
  revalidatePath("/admin/templates");
}
