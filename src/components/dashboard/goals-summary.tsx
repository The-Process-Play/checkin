import Link from "next/link";
import type { Goal } from "@prisma/client";

export function GoalsSummary({ goals, emptyHref }: { goals: Goal[]; emptyHref?: string }) {
  const active = goals.filter((g) => g.status !== "COMPLETED");

  if (active.length === 0) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-neutral-500">
          No active goals.{" "}
          {emptyHref && (
            <Link href={emptyHref} className="font-medium text-indigo-600 hover:underline">
              Create one
            </Link>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {active.map((g) => (
        <Link key={g.id} href={`/goals/${g.id}`} className="card card-hover block p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-900">{g.title}</span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {g.progress}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-100">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              style={{ width: `${g.progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">
            Due {g.targetDate.toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
