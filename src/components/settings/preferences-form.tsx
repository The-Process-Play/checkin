"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyPreferences } from "@/actions/settings";

export function PreferencesForm({
  initialName,
  initialCheckInReminders,
  initialWeeklyDigest,
}: {
  initialName: string;
  initialCheckInReminders: boolean;
  initialWeeklyDigest: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [checkInReminders, setCheckInReminders] = useState(initialCheckInReminders);
  const [weeklyDigest, setWeeklyDigest] = useState(initialWeeklyDigest);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateMyPreferences({
          name,
          notifyCheckInReminders: checkInReminders,
          notifyWeeklyDigest: weeklyDigest,
        });
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Display name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </div>

      <div className="space-y-3 border-t border-neutral-100 pt-4">
        <p className="text-sm font-medium text-neutral-700">Email notifications</p>

        <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 text-sm">
          <input
            type="checkbox"
            checked={checkInReminders}
            onChange={(e) => setCheckInReminders(e.target.checked)}
            className="mt-0.5 accent-indigo-600"
          />
          <span>
            <span className="font-medium text-neutral-800">Check-in reminders</span>
            <span className="block text-xs text-neutral-500">
              Thursday reminder + Friday chaser if you haven&apos;t submitted yet.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 text-sm">
          <input
            type="checkbox"
            checked={weeklyDigest}
            onChange={(e) => setWeeklyDigest(e.target.checked)}
            className="mt-0.5 accent-indigo-600"
          />
          <span>
            <span className="font-medium text-neutral-800">Weekly manager digest</span>
            <span className="block text-xs text-neutral-500">
              Managers only: a Monday summary of your team&apos;s mood trend and at-risk flags.
            </span>
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving..." : "Save preferences"}
        </button>
        {saved && !isPending && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </form>
  );
}
