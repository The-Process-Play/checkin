import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentWeekCheckIn } from "@/actions/check-ins";
import { getMyGoals, getGoalsForUser } from "@/actions/goals";
import { getMoodTrend, getTeamStatus, getCompletionRate } from "@/lib/dashboard";
import { MoodTrendChart } from "@/components/dashboard/mood-trend-chart";
import { TeamStatusTable } from "@/components/dashboard/team-status-table";
import { CurrentWeekCard } from "@/components/dashboard/current-week-card";
import { GoalsSummary } from "@/components/dashboard/goals-summary";
import { ViewToggle } from "@/components/dashboard/view-toggle";
import { EmployeeFilter } from "@/components/dashboard/employee-filter";
import { StatTile } from "@/components/dashboard/stat-tile";

type SearchParams = { view?: string; employeeId?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { view, employeeId } = await searchParams;
  const canSeeTeam = session.user.role !== "EMPLOYEE";
  const effectiveView = canSeeTeam && view === "team" ? "team" : "me";

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Welcome, {session.user.name ?? session.user.email}
        </h1>
        <p className="text-sm text-neutral-500">Role: {session.user.role}</p>
      </div>
      {canSeeTeam && <ViewToggle active={effectiveView} />}
    </div>
  );

  if (effectiveView === "me") {
    const [currentWeek, goals, trend] = await Promise.all([
      getCurrentWeekCheckIn(),
      getMyGoals(),
      getMoodTrend([session.user.id]),
    ]);

    return (
      <div className="max-w-6xl space-y-8">
        {header}
        <CurrentWeekCard checkIn={currentWeek} />
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">My mood &amp; energy trend</h2>
          <MoodTrendChart data={trend} />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">My goals</h2>
          <GoalsSummary goals={goals} emptyHref="/goals/new" />
        </div>
      </div>
    );
  }

  // Team view (manager/admin only)
  const teamMembers =
    session.user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { isActive: true, id: { not: session.user.id } },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: { managerId: session.user.id, isActive: true },
          orderBy: { name: "asc" },
        });

  if (employeeId && !teamMembers.some((m) => m.id === employeeId)) {
    redirect("/?view=team");
  }

  if (employeeId) {
    const selected = teamMembers.find((m) => m.id === employeeId);
    const [goals, trend, [status]] = await Promise.all([
      getGoalsForUser(employeeId),
      getMoodTrend([employeeId]),
      getTeamStatus([employeeId]),
    ]);

    return (
      <div className="max-w-6xl space-y-8">
        {header}
        <div className="flex items-center gap-3">
          <EmployeeFilter members={teamMembers} selectedId={employeeId} />
          {selected && <span className="text-sm text-neutral-500">Viewing {selected.name ?? selected.email}</span>}
        </div>

        {status && (
          <div
            className={`card flex gap-6 border-l-4 p-4 text-sm ${
              status.atRisk ? "border-l-red-400" : "border-l-emerald-400"
            }`}
          >
            <span>
              This week:{" "}
              {status.submittedThisPeriod ? (
                <span className="font-medium text-emerald-600">Submitted</span>
              ) : (
                <span className="font-medium text-amber-600">Missing</span>
              )}
            </span>
            <span>
              Status:{" "}
              {status.atRisk ? (
                <span className="font-medium text-red-600">At risk</span>
              ) : (
                <span className="font-medium text-emerald-600">OK</span>
              )}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Mood &amp; energy trend</h2>
          <MoodTrendChart data={trend} />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Goals</h2>
          <GoalsSummary goals={goals} />
        </div>
      </div>
    );
  }

  const memberIds = teamMembers.map((m) => m.id);
  const [members, completion, trend] = await Promise.all([
    getTeamStatus(memberIds),
    getCompletionRate(memberIds),
    getMoodTrend(memberIds),
  ]);
  const atRiskCount = members.filter((m) => m.atRisk).length;

  return (
    <div className="max-w-6xl space-y-8">
      {header}
      <div className="flex items-center gap-3">
        <EmployeeFilter members={teamMembers} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Completed this week"
          value={`${completion.submitted}/${completion.total}`}
          icon="✅"
          accent="emerald"
        />
        <StatTile label="At-risk" value={atRiskCount} icon="⚠️" accent="red" />
        <StatTile label="Team size" value={memberIds.length} icon="👥" accent="indigo" />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Mood &amp; energy trend</h2>
        <MoodTrendChart data={trend} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">
          {session.user.role === "ADMIN" ? "All staff" : "My team"}
        </h2>
        <TeamStatusTable members={members} />
      </div>
    </div>
  );
}
