"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postShoutoutToTeams } from "@/lib/teams";

export async function createShoutout(input: { toId: string; message: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (input.toId === session.user.id) throw new Error("You can't shout out yourself");
  if (!input.message.trim()) throw new Error("Message is required");

  const to = await prisma.user.findUnique({ where: { id: input.toId } });
  if (!to || !to.isActive) throw new Error("Recipient not found");

  const shoutout = await prisma.shoutout.create({
    data: { fromId: session.user.id, toId: input.toId, message: input.message },
  });

  await postShoutoutToTeams({
    fromName: session.user.name ?? session.user.email ?? "Someone",
    toName: to.name ?? to.email,
    message: input.message,
  });

  revalidatePath("/shoutouts");
  return shoutout;
}

export async function getRecentShoutouts(limit = 25) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.shoutout.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { from: true, to: true },
  });
}

export async function getShoutoutCountsForUser(userId: string) {
  const [given, received] = await Promise.all([
    prisma.shoutout.count({ where: { fromId: userId } }),
    prisma.shoutout.count({ where: { toId: userId } }),
  ]);
  return { given, received };
}
