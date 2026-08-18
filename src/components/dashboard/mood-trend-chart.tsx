import { formatPeriod } from "@/lib/period";

export function MoodTrendChart({
  data,
}: {
  data: { periodStart: Date; avgMood: number | null; avgEnergy: number | null }[];
}) {
  if (data.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-neutral-500">Not enough data yet.</p>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" /> Mood
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 to-amber-400" /> Energy
        </span>
      </div>
      <div className="flex items-end gap-3">
        {data.map((point) => (
          <div key={point.periodStart.toISOString()} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end gap-1">
              <div
                className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400 transition-all"
                style={{ height: `${((point.avgMood ?? 0) / 5) * 100}%` }}
                title={`Mood ${point.avgMood?.toFixed(1) ?? "—"}`}
              />
              <div
                className="flex-1 rounded-t-md bg-gradient-to-t from-amber-400 to-amber-200 transition-all"
                style={{ height: `${((point.avgEnergy ?? 0) / 5) * 100}%` }}
                title={`Energy ${point.avgEnergy?.toFixed(1) ?? "—"}`}
              />
            </div>
            <span className="text-[10px] text-neutral-500">{formatPeriod(point.periodStart)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
