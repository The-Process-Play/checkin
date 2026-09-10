"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShoutout } from "@/actions/shoutouts";
import type { User } from "@prisma/client";

export function ShoutoutForm({ colleagues }: { colleagues: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toId, setToId] = useState(colleagues[0]?.id ?? "");
  const [message, setMessage] = useState("");

  if (colleagues.length === 0) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createShoutout({ toId, message });
        setMessage("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-l-4 border-l-emerald-300 p-4">
      <h2 className="text-sm font-semibold text-neutral-900">Give a shout-out</h2>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Who?</label>
        <select value={toId} onChange={(e) => setToId(e.target.value)} className="input">
          {colleagues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          required
          className="input"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Posting..." : "Give shout-out"}
      </button>
    </form>
  );
}
