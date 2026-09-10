"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleOneOnOne, stopSeries } from "@/actions/one-on-ones";
import type { OneOnOneSeries } from "@prisma/client";

const CADENCE_LABEL: Record<string, string> = {
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
};

export function SeriesControls({
  oneOnOneId,
  scheduledAt,
  series,
  isManager,
}: {
  oneOnOneId: string;
  scheduledAt: Date;
  series: OneOnOneSeries;
  isManager: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newDate, setNewDate] = useState(scheduledAt.toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await rescheduleOneOnOne(oneOnOneId, new Date(newDate));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleStop() {
    setError(null);
    startTransition(async () => {
      try {
        await stopSeries(series.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="card flex flex-wrap items-center gap-3 border-l-4 border-l-amber-300 p-3 text-sm">
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Part of a {CADENCE_LABEL[series.cadence]} series
        {!series.isActive && " (stopped)"}
      </span>

      <form onSubmit={handleReschedule} className="flex items-center gap-2">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="input w-auto py-1"
        />
        <button type="submit" disabled={isPending} className="btn-secondary">
          Reschedule this occurrence
        </button>
      </form>

      {isManager && series.isActive && (
        <button onClick={handleStop} disabled={isPending} className="text-xs font-medium text-red-600 hover:underline">
          Stop repeating
        </button>
      )}

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
