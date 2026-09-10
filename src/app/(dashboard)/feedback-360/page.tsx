import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMyFeedbackRequests, getPendingReviewsForMe } from "@/actions/feedback-360";
import { RequestFeedbackForm } from "@/components/feedback-360/request-feedback-form";
import { formatDate } from "@/lib/date";

export default async function Feedback360Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [myRequests, pendingReviews, colleagues] = await Promise.all([
    getMyFeedbackRequests(),
    getPendingReviewsForMe(),
    prisma.user.findMany({
      where: { isActive: true, id: { not: session.user.id } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-6xl space-y-8">
      <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
        360 Feedback
      </h1>

      <RequestFeedbackForm colleagues={colleagues} />

      {pendingReviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Pending reviews for others</h2>
          {pendingReviews.map((req) => (
            <Link key={req.id} href={`/feedback-360/${req.id}`} className="card card-hover block p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  Feedback requested by{" "}
                  <span className="font-medium text-neutral-900">{req.subject.name ?? req.subject.email}</span>
                </span>
                <span className="text-xs text-neutral-500">{formatDate(req.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Requests about me</h2>
        {myRequests.map((req) => (
          <div key={req.id} className="card p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>
                Asked <span className="font-medium text-neutral-900">{req.reviewer.name ?? req.reviewer.email}</span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  req.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {req.status === "COMPLETED" ? "Completed" : "Pending"}
              </span>
            </div>
            {req.response && (
              <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Strengths</p>
                  <p className="text-neutral-700">{req.response.strengths}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Areas to improve</p>
                  <p className="text-neutral-700">{req.response.areasToImprove}</p>
                </div>
                {req.response.additionalComments && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      Additional comments
                    </p>
                    <p className="text-neutral-700">{req.response.additionalComments}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {myRequests.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-500">You haven&apos;t requested any feedback yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
