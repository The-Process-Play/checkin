"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOneOnOneNotes } from "@/actions/one-on-ones";

export function NotesForm({
  oneOnOneId,
  initialAgenda,
  initialNotes,
}: {
  oneOnOneId: string;
  initialAgenda: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [agenda, setAgenda] = useState(initialAgenda);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateOneOnOneNotes(oneOnOneId, agenda, notes);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-l-4 border-l-indigo-300 p-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Agenda</label>
        <textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          rows={3}
          className="input"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="input"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? "Saving..." : "Save notes"}
        </button>
        {saved && !isPending && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}
