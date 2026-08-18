"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCheckIn } from "@/actions/check-ins";
import type { CheckInQuestion, Goal } from "@prisma/client";

const SCALE_VALUES = [1, 2, 3, 4, 5];

export function CheckInForm({
  templateId,
  questions,
  goals,
  initial,
}: {
  templateId: string;
  questions: CheckInQuestion[];
  goals: Goal[];
  initial?: {
    moodScore?: number | null;
    energyScore?: number | null;
    responses: Record<string, { textValue?: string | null; scaleValue?: number | null }>;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mood, setMood] = useState<number | undefined>(initial?.moodScore ?? undefined);
  const [energy, setEnergy] = useState<number | undefined>(initial?.energyScore ?? undefined);
  const [texts, setTexts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const q of questions) {
      if (q.type === "TEXT") map[q.id] = initial?.responses[q.id]?.textValue ?? "";
    }
    return map;
  });
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [goalProgress, setGoalProgress] = useState(50);
  const [goalNote, setGoalNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const responses = questions
      .filter((q) => q.type === "TEXT")
      .map((q) => ({ questionId: q.id, textValue: texts[q.id] || undefined }));

    startTransition(async () => {
      try {
        await submitCheckIn({
          templateId,
          moodScore: mood,
          energyScore: energy,
          responses,
          goalUpdate: selectedGoalId
            ? { goalId: selectedGoalId, progress: goalProgress, note: goalNote || undefined }
            : undefined,
        });
        router.push("/check-ins");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ScaleField label="Mood this week" value={mood} onChange={setMood} />
      <ScaleField label="Energy this week" value={energy} onChange={setEnergy} />

      {questions
        .filter((q) => q.type === "TEXT")
        .map((q) => (
          <div key={q.id} className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">{q.prompt}</label>
            <textarea
              value={texts[q.id] ?? ""}
              onChange={(e) => setTexts((t) => ({ ...t, [q.id]: e.target.value }))}
              rows={3}
              className="input"
              required={q.isRequired}
            />
          </div>
        ))}

      {goals.length > 0 && (
        <div className="card space-y-3 border-l-4 border-l-violet-300 p-4">
          <label className="text-sm font-medium text-neutral-700">
            Update a goal (optional)
          </label>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="input"
          >
            <option value="">No goal update</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title} ({g.progress}%)
              </option>
            ))}
          </select>
          {selectedGoalId && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Progress: {goalProgress}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goalProgress}
                  onChange={(e) => setGoalProgress(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <input
                type="text"
                placeholder="Optional note"
                value={goalNote}
                onChange={(e) => setGoalNote(e.target.value)}
                className="input"
              />
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Submitting..." : "Submit check-in"}
      </button>
    </form>
  );
}

function ScaleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <div className="flex gap-2">
        {SCALE_VALUES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition ${
              value === v
                ? "border-transparent bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-300/60"
                : "border-neutral-300 text-neutral-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
