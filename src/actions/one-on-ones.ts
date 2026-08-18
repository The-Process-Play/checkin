"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessOneOnOne } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { ActionItemStatus } from "@prisma/client";

async function assertOneOnOneAccess(oneOnOneId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const oneOnOne = await prisma.oneOnOne.findUnique({ where: { id: oneOnOneId } });
  if (!oneOnOne) throw new Error("1:1 not found");
  if (!canAccessOneOnOne(session.user, oneOnOne)) throw new Error("Not authorized");

  return { session, oneOnOne };
}

export async function getMyDirectReports() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.user.findMany({
    where: { managerId: session.user.id, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createOneOnOne(input: { reportId: string; scheduledAt: Date; agenda?: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const report = await prisma.user.findUnique({ where: { id: input.reportId } });
  if (!report || report.managerId !== session.user.id) {
    throw new Error("You can only schedule 1:1s with your direct reports");
  }

  const oneOnOne = await prisma.oneOnOne.create({
    data: {
      managerId: session.user.id,
      reportId: input.reportId,
      scheduledAt: input.scheduledAt,
      agenda: input.agenda,
    },
  });

  revalidatePath("/one-on-ones");
  return oneOnOne;
}

export async function updateOneOnOneNotes(oneOnOneId: string, agenda: string, notes: string) {
  const { oneOnOne } = await assertOneOnOneAccess(oneOnOneId);

  await prisma.oneOnOne.update({
    where: { id: oneOnOne.id },
    data: { agenda, notes },
  });

  revalidatePath(`/one-on-ones/${oneOnOneId}`);
}

export async function addActionItem(oneOnOneId: string, input: { assigneeId: string; description: string; dueDate?: Date }) {
  const { oneOnOne } = await assertOneOnOneAccess(oneOnOneId);

  if (input.assigneeId !== oneOnOne.managerId && input.assigneeId !== oneOnOne.reportId) {
    throw new Error("Assignee must be a participant of this 1:1");
  }

  await prisma.actionItem.create({
    data: {
      oneOnOneId: oneOnOne.id,
      assigneeId: input.assigneeId,
      description: input.description,
      dueDate: input.dueDate,
    },
  });

  revalidatePath(`/one-on-ones/${oneOnOneId}`);
}

export async function toggleActionItem(actionItemId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const item = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    include: { oneOnOne: true },
  });
  if (!item) throw new Error("Action item not found");
  if (!canAccessOneOnOne(session.user, item.oneOnOne)) throw new Error("Not authorized");

  await prisma.actionItem.update({
    where: { id: actionItemId },
    data: { status: item.status === ActionItemStatus.OPEN ? ActionItemStatus.DONE : ActionItemStatus.OPEN },
  });

  revalidatePath(`/one-on-ones/${item.oneOnOneId}`);
}

export async function getMyOneOnOnes() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.oneOnOne.findMany({
    where: { OR: [{ managerId: session.user.id }, { reportId: session.user.id }] },
    orderBy: { scheduledAt: "desc" },
    include: { manager: true, report: true },
  });
}

export async function getOneOnOneById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const oneOnOne = await prisma.oneOnOne.findUnique({
    where: { id },
    include: {
      manager: true,
      report: true,
      actionItems: { include: { assignee: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!oneOnOne) return null;
  if (!canAccessOneOnOne(session.user, oneOnOne)) throw new Error("Not authorized to view this 1:1");

  return oneOnOne;
}
