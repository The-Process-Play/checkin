"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOneOnOne } from "@/actions/one-on-ones";
import type { RecurrenceCadence, User } from "@prisma/client";

const REPEAT_OPTIONS: { value: RecurrenceCadence | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
];

export function NewOneOnOneForm({
  counterparts,
  counterpartLabel,
  title,
}: {
  counterparts: User[];
  counterpartLabel: string;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [withUserId, setWithUserId] = useState(counterparts[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 10));
  const [agenda, setAgenda] = useState("");
  const [cadence, setCadence] = useState<RecurrenceCadence | "">("");

  if (counterparts.length === 0) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const oneOnOne = await createOneOnOne({
          withUserId,
          scheduledAt: new Date(scheduledAt),
          agenda: agenda || undefined,
          recurrence: cadence ? { cadence } : undefined,
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
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">{counterpartLabel}</label>
        <select
          value={withUserId}
          onChange={(e) => setWithUserId(e.target.value)}
          className="input"
        >
          {counterparts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email}
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
        <label className="text-sm font-medium text-neutral-700">Repeats</label>
        <select
          value={cadence}
          onChange={(e) => setCadence(e.target.value as RecurrenceCadence | "")}
          className="input"
        >
          {REPEAT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
