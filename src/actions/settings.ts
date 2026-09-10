"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMyPreferences() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, notifyCheckInReminders: true, notifyWeeklyDigest: true },
  });
}

export async function updateMyPreferences(input: {
  name?: string;
  notifyCheckInReminders: boolean;
  notifyWeeklyDigest: boolean;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: input.name?.trim() || null,
      notifyCheckInReminders: input.notifyCheckInReminders,
      notifyWeeklyDigest: input.notifyWeeklyDigest,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}
