import { notFound } from "next/navigation";
import { getGoalById } from "@/actions/goals";
import { GoalProgressForm } from "@/components/goals/goal-progress-form";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const goal = await getGoalById(id);
  if (!goal) notFound();

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{goal.title}</h1>
        <p className="text-sm text-neutral-500">{goal.owner.name ?? goal.owner.email}</p>
      </div>

      {goal.description && <p className="text-sm text-neutral-600">{goal.description}</p>}

      <div className="card grid grid-cols-3 divide-x divide-neutral-100 p-4 text-sm">
        <div className="px-3 first:pl-0">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Type</p>
          <p className="mt-1 font-medium text-neutral-800">
            {goal.type === "TEAM" ? "Team goal" : "Individual goal"}
          </p>
        </div>
        <div className="px-3">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Start date</p>
          <p className="mt-1 font-medium text-neutral-800">{goal.startDate.toLocaleDateString()}</p>
        </div>
        <div className="px-3">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Target date</p>
          <p className="mt-1 font-medium text-neutral-800">{goal.targetDate.toLocaleDateString()}</p>
        </div>
      </div>

      <div className="card space-y-2 p-4">
        <div className="h-2 w-full rounded-full bg-neutral-100">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500">
          {goal.progress}% complete · Status: {goal.status.replace("_", " ")}
        </p>
      </div>

      <GoalProgressForm goalId={goal.id} currentProgress={goal.progress} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">History</h2>
        {goal.updates.map((update) => (
          <div key={update.id} className="card p-3 text-sm">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>{update.author.name ?? update.author.email}</span>
              <span>{update.createdAt.toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-neutral-700">
              {update.progress}%{update.note ? ` — ${update.note}` : ""}
            </p>
          </div>
        ))}
        {goal.updates.length === 0 && <p className="text-sm text-neutral-500">No updates yet.</p>}
      </div>
    </div>
  );
}
