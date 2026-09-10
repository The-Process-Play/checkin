import Link from "next/link";
import { auth } from "@/auth";
import { getMyGoals, getTeamGoals } from "@/actions/goals";
import { formatDate } from "@/lib/date";
import type { Goal, User } from "@prisma/client";

const statusColor: Record<string, string> = {
  NOT_STARTED: "bg-neutral-100 text-neutral-600",
  ON_TRACK: "bg-emerald-100 text-emerald-700",
  AT_RISK: "bg-amber-100 text-amber-700",
  OFF_TRACK: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

function GoalCard({ goal, ownerName }: { goal: Goal; ownerName?: string }) {
  return (
    <Link href={`/goals/${goal.id}`} className="card card-hover block p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">{goal.title}</p>
          <p className="text-xs text-neutral-500">
            {goal.type === "TEAM" ? "Team goal" : "Individual goal"}
            {ownerName ? ` · ${ownerName}` : ""}
          </p>
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
          {formatDate(goal.startDate)} → {formatDate(goal.targetDate)}
        </span>
      </div>
    </Link>
  );
}

export default async function GoalsPage() {
  const session = await auth();
  const [goals, teamGoals] = await Promise.all([getMyGoals(), getTeamGoals()]);

  // Team goals I already own show up in "My goals" above — don't duplicate them here.
  const othersTeamGoals = teamGoals.filter((g) => g.ownerId !== session?.user.id) as (Goal & { owner: User })[];

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Goals
        </h1>
        <Link href="/goals/new" className="btn-primary">
          New goal
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">My goals</h2>
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
        {goals.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-500">No goals yet.</p>
          </div>
        )}
      </div>

      {othersTeamGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Team goals</h2>
          <p className="text-xs text-neutral-500">
            Shared with your team — anyone on the team can update progress.
          </p>
          {othersTeamGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} ownerName={goal.owner.name ?? goal.owner.email} />
          ))}
        </div>
      )}
    </div>
  );
}
