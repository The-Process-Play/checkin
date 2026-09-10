import { notFound } from "next/navigation";
import { getFeedbackRequestById } from "@/actions/feedback-360";
import { AnswerForm } from "@/components/feedback-360/answer-form";
import { formatDate } from "@/lib/date";

export default async function FeedbackRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const request = await getFeedbackRequestById(requestId);
  if (!request) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Feedback for {request.subject.name ?? request.subject.email}
        </h1>
        <p className="text-sm text-neutral-500">Requested {formatDate(request.createdAt)}</p>
      </div>

      {request.status === "COMPLETED" ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-neutral-500">You&apos;ve already answered this request.</p>
        </div>
      ) : (
        <AnswerForm requestId={request.id} />
      )}
    </div>
  );
}
