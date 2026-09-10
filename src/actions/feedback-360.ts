"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessUserData } from "@/lib/authz";
import { revalidatePath } from "next/cache";

const MAX_REVIEWERS = 2;

export async function requestFeedback(reviewerIds: string[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const uniqueIds = Array.from(new Set(reviewerIds)).filter((id) => id !== session.user.id);
  if (uniqueIds.length === 0) throw new Error("Pick at least one colleague to ask");
  if (uniqueIds.length > MAX_REVIEWERS) {
    throw new Error(`You can request feedback from up to ${MAX_REVIEWERS} people at a time`);
  }

  const requests = await prisma.$transaction(
    uniqueIds.map((reviewerId) =>
      prisma.feedbackRequest.create({ data: { subjectId: session.user.id, reviewerId } })
    )
  );

  revalidatePath("/feedback-360");
  return requests;
}

export async function getMyFeedbackRequests() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.feedbackRequest.findMany({
    where: { subjectId: session.user.id },
    include: { reviewer: true, response: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingReviewsForMe() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  return prisma.feedbackRequest.findMany({
    where: { reviewerId: session.user.id, status: "PENDING" },
    include: { subject: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getFeedbackRequestById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const request = await prisma.feedbackRequest.findUnique({
    where: { id },
    include: { subject: true, reviewer: true, response: true },
  });
  if (!request) return null;
  if (request.reviewerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Not authorized to view this request");
  }

  return request;
}

export async function submitFeedbackResponse(
  requestId: string,
  input: { strengths: string; areasToImprove: string; additionalComments?: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const request = await prisma.feedbackRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Request not found");
  if (request.reviewerId !== session.user.id) throw new Error("Not authorized to answer this request");
  if (request.status === "COMPLETED") throw new Error("This request has already been answered");

  await prisma.$transaction([
    prisma.feedbackResponse.create({
      data: {
        requestId,
        strengths: input.strengths,
        areasToImprove: input.areasToImprove,
        additionalComments: input.additionalComments,
      },
    }),
    prisma.feedbackRequest.update({ where: { id: requestId }, data: { status: "COMPLETED" } }),
  ]);

  revalidatePath("/feedback-360");
  revalidatePath(`/feedback-360/${requestId}`);
}

/**
 * Visible to the subject themselves, their manager, or an admin — never
 * company-wide. Not building mandatory-quarterly enforcement/reminders yet;
 * cheap to bolt on later as a third cron stage once this is proven out.
 */
export async function getFeedbackForSubject(subjectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const allowed = await canAccessUserData(session.user, subjectId);
  if (!allowed) throw new Error("Not authorized to view this feedback");

  return prisma.feedbackRequest.findMany({
    where: { subjectId, status: "COMPLETED" },
    include: { reviewer: true, response: true },
    orderBy: { createdAt: "desc" },
  });
}
