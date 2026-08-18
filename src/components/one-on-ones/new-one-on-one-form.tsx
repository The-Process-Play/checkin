"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOneOnOne } from "@/actions/one-on-ones";
import type { User } from "@prisma/client";

export function NewOneOnOneForm({ reports }: { reports: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState(reports[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 10));
  const [agenda, setAgenda] = useState("");

  if (reports.length === 0) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const oneOnOne = await createOneOnOne({
          reportId,
          scheduledAt: new Date(scheduledAt),
          agenda: agenda || undefined,
        });
        router.push(`/one-on-ones/${oneOnOne.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-l-4 border-l-violet-300 p-4">
      <h2 className="text-sm font-semibold text-neutral-900">Schedule a new 1:1</h2>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Report</label>
        <select
          value={reportId}
          onChange={(e) => setReportId(e.target.value)}
          className="input"
        >
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name ?? r.email}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Date</label>
        <input
          type="date"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="input"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Agenda (optional)</label>
        <textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          rows={2}
          className="input"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? "Scheduling..." : "Schedule"}
      </button>
    </form>
  );
}
