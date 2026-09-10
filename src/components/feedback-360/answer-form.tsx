"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitFeedbackResponse } from "@/actions/feedback-360";

export function AnswerForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [strengths, setStrengths] = useState("");
  const [areasToImprove, setAreasToImprove] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitFeedbackResponse(requestId, {
          strengths,
          areasToImprove,
          additionalComments: additionalComments || undefined,
        });
        router.push("/feedback-360");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">What are their strengths?</label>
        <textarea
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          rows={3}
          required
          className="input"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">What could they improve on?</label>
        <textarea
          value={areasToImprove}
          onChange={(e) => setAreasToImprove(e.target.value)}
          rows={3}
          required
          className="input"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Additional comments (optional)</label>
        <textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          rows={2}
          className="input"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
