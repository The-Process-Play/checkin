import Link from "next/link";
import { getMyGoals } from "@/actions/goals";

const statusColor: Record<string, string> = {
  NOT_STARTED: "bg-neutral-100 text-neutral-600",
  ON_TRACK: "bg-emerald-100 text-emerald-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  OFF_TRACK: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default async function GoalsPage() {
  const goals = await getMyGoals();

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Goals
        </h1>
        <Link href="/goals/new" className="btn-primary">
          New goal
        </Link>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <Link key={goal.id} href={`/goals/${goal.id}`} className="card card-hover block p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">{goal.title}</p>
                <p className="text-xs text-neutral-500">{goal.type === "TEAM" ? "Team goal" : "Individual goal"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[goal.status]}`}>
                {goal.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>{goal.progress}% complete</span>
              <span>
                {goal.startDate.toLocaleDateString()} → {goal.targetDate.toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
        {goals.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-500">No goals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
