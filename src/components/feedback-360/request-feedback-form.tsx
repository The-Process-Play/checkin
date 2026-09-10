"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestFeedback } from "@/actions/feedback-360";
import type { User } from "@prisma/client";

const MAX_REVIEWERS = 2;

export function RequestFeedbackForm({ colleagues }: { colleagues: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_REVIEWERS ? [...prev, id] : prev
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await requestFeedback(selected);
        setSelected([]);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 border-l-4 border-l-indigo-300 p-4">
      <h2 className="text-sm font-semibold text-neutral-900">Ask for feedback</h2>
      <p className="text-xs text-neutral-500">Pick up to {MAX_REVIEWERS} colleagues.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {colleagues.map((c) => (
          <label
            key={c.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              selected.includes(c.id)
                ? "border-indigo-300 bg-indigo-50/50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => toggle(c.id)}
              className="accent-indigo-600"
            />
            {c.name ?? c.email}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending || selected.length === 0} className="btn-primary">
        {isPending ? "Sending..." : "Request feedback"}
      </button>
    </form>
  );
}
