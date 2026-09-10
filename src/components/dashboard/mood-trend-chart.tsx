import { formatPeriod } from "@/lib/period";

const WIDTH = 600;
const HEIGHT = 140;
const PADDING_X = 30;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 10;

function points(
  data: { avgMood: number | null; avgEnergy: number | null }[],
  key: "avgMood" | "avgEnergy"
) {
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const step = data.length > 1 ? (WIDTH - PADDING_X * 2) / (data.length - 1) : 0;

  return data.map((point, i) => {
    const value = point[key] ?? 0;
    const x = PADDING_X + i * step;
    const y = PADDING_TOP + chartHeight * (1 - value / 5);
    return { x, y, value: point[key] };
  });
}

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

  const moodPoints = points(data, "avgMood");
  const energyPoints = points(data, "avgEnergy");

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

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Mood and energy trend">
        <polyline
          points={moodPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="url(#moodGradient)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={energyPoints.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="url(#energyGradient)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {moodPoints.map((p, i) => (
          <g key={`mood-${i}`}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#4f46e5" />
            {p.value != null && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={11} fill="#4338ca" fontWeight={600}>
                {p.value.toFixed(1)}
              </text>
            )}
          </g>
        ))}
        {energyPoints.map((p, i) => (
          <g key={`energy-${i}`}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#f59e0b" />
            {p.value != null && (
              <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize={11} fill="#b45309" fontWeight={600}>
                {p.value.toFixed(1)}
              </text>
            )}
          </g>
        ))}

        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="energyGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex justify-between text-[10px] text-neutral-500">
        {data.map((point) => (
          <span key={point.periodStart.toISOString()}>{formatPeriod(point.periodStart)}</span>
        ))}
      </div>
    </div>
  );
}
