"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessOneOnOne } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { ActionItemStatus, RecurrenceCadence } from "@prisma/client";
import { addWeeks, addMonths } from "date-fns";

function nextOccurrence(from: Date, cadence: RecurrenceCadence): Date {
  switch (cadence) {
    case "WEEKLY":
      return addWeeks(from, 1);
    case "BIWEEKLY":
      return addWeeks(from, 2);
    case "MONTHLY":
      return addMonths(from, 1);
  }
}

/**
 * Tops up every active series involving this user with exactly one future
 * instance. Called from read paths (no separate cron job needed at this
 * scale) so the 1:1 list always has a next occurrence without pre-generating
 * a backlog.
 */
async function generateDueSeriesInstances(userId: string) {
  const series = await prisma.oneOnOneSeries.findMany({
    where: {
      isActive: true,
      OR: [{ managerId: userId }, { reportId: userId }],
    },
    include: {
      instances: { orderBy: { scheduledAt: "desc" }, take: 1 },
    },
  });

  const now = new Date();
  // Compare by calendar day, not exact timestamp: scheduledAt is a date-only value
  // stored at UTC midnight, so a same-day "<=" comparison would treat a 1:1
  // scheduled for today as already due the moment any time has passed that day.
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  for (const s of series) {
    const latest = s.instances[0];
    if (!latest || latest.scheduledAt < todayStart) {
      const nextDate = latest ? nextOccurrence(latest.scheduledAt, s.cadence) : now;
      await prisma.oneOnOne.create({
        data: {
          managerId: s.managerId,
          reportId: s.reportId,
          scheduledAt: nextDate,
          agenda: s.agendaTemplate,
          seriesId: s.id,
        },
      });
    }
  }
}

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

export async function createOneOnOne(input: {
  reportId: string;
  scheduledAt: Date;
  agenda?: string;
  recurrence?: { cadence: RecurrenceCadence };
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const report = await prisma.user.findUnique({ where: { id: input.reportId } });
  if (!report || report.managerId !== session.user.id) {
    throw new Error("You can only schedule 1:1s with your direct reports");
  }

  let seriesId: string | undefined;
  if (input.recurrence) {
    const series = await prisma.oneOnOneSeries.create({
      data: {
        managerId: session.user.id,
        reportId: input.reportId,
        cadence: input.recurrence.cadence,
        agendaTemplate: input.agenda,
      },
    });
    seriesId = series.id;
  }

  const oneOnOne = await prisma.oneOnOne.create({
    data: {
      managerId: session.user.id,
      reportId: input.reportId,
      scheduledAt: input.scheduledAt,
      agenda: input.agenda,
      seriesId,
    },
  });

  revalidatePath("/one-on-ones");
  return oneOnOne;
}

/** Reschedule a single instance — never touches its series or sibling instances. */
export async function rescheduleOneOnOne(id: string, scheduledAt: Date) {
  const { oneOnOne } = await assertOneOnOneAccess(id);

  await prisma.oneOnOne.update({
    where: { id: oneOnOne.id },
    data: { scheduledAt },
  });

  revalidatePath(`/one-on-ones/${id}`);
  revalidatePath("/one-on-ones");
}

/** Manager-only: stops future generation for a series. Leaves past instances untouched. */
export async function stopSeries(seriesId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const series = await prisma.oneOnOneSeries.findUnique({ where: { id: seriesId } });
  if (!series) throw new Error("Series not found");
  if (series.managerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }

  await prisma.oneOnOneSeries.update({ where: { id: seriesId }, data: { isActive: false } });
  revalidatePath("/one-on-ones");
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

  await generateDueSeriesInstances(session.user.id);

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
      series: true,
      actionItems: { include: { assignee: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!oneOnOne) return null;
  if (!canAccessOneOnOne(session.user, oneOnOne)) throw new Error("Not authorized to view this 1:1");

  return oneOnOne;
}
