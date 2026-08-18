import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeamStatus, getCompletionRate, getMoodTrend } from "@/lib/dashboard";
import { TeamStatusTable } from "@/components/dashboard/team-status-table";
import { MoodTrendChart } from "@/components/dashboard/mood-trend-chart";
import { StatTile } from "@/components/dashboard/stat-tile";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
  const userIds = users.map((u) => u.id);

  const [members, completion, trend] = await Promise.all([
    getTeamStatus(userIds),
    getCompletionRate(userIds),
    getMoodTrend(userIds),
  ]);

  const atRiskCount = members.filter((m) => m.atRisk).length;

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Org dashboard
        </h1>
        <p className="text-sm text-neutral-500">Across all of TPP</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Completion this week"
          value={`${completion.submitted}/${completion.total}`}
          icon="✅"
          accent="emerald"
        />
        <StatTile label="At-risk staff" value={atRiskCount} icon="⚠️" accent="red" />
        <StatTile label="Total staff" value={userIds.length} icon="👥" accent="indigo" />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Mood &amp; energy trend</h2>
        <MoodTrendChart data={trend} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">All staff</h2>
        <TeamStatusTable members={members} />
      </div>
    </div>
  );
}
