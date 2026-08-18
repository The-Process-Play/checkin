"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGoalProgress } from "@/actions/goals";

export function GoalProgressForm({ goalId, currentProgress }: { goalId: string; currentProgress: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(currentProgress);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateGoalProgress({ goalId, progress, note: note || undefined });
        setNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 border-l-4 border-l-indigo-300 p-4">
      <label className="text-sm font-medium text-neutral-700">Update progress: {progress}%</label>
      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        onChange={(e) => setProgress(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <input
        type="text"
        placeholder="Optional note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? "Saving..." : "Save update"}
      </button>
    </form>
  );
}
