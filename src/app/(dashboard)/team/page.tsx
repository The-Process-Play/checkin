import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeamStatus, getCompletionRate } from "@/lib/dashboard";
import { TeamStatusTable } from "@/components/dashboard/team-status-table";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/");

  const reports = await prisma.user.findMany({
    where: { managerId: session.user.id, isActive: true },
    select: { id: true },
  });
  const reportIds = reports.map((r) => r.id);

  const [members, completion] = await Promise.all([
    getTeamStatus(reportIds),
    getCompletionRate(reportIds),
  ]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Team
        </h1>
        <p className="text-sm text-neutral-500">
          {completion.submitted} of {completion.total} direct reports submitted this week&apos;s check-in
        </p>
      </div>

      <TeamStatusTable members={members} />
    </div>
  );
}
