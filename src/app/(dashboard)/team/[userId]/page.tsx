import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessUserData } from "@/lib/authz";
import { getCheckInHistoryForUser } from "@/actions/check-ins";
import { getGoalsForUser } from "@/actions/goals";
import { getFeedbackForSubject } from "@/actions/feedback-360";
import { formatPeriod } from "@/lib/period";
import { formatDate } from "@/lib/date";

export default async function TeamMemberPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const session = await auth();
  if (!session?.user) notFound();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  const allowed = await canAccessUserData(session.user, userId);
  if (!allowed) notFound();

  const [checkIns, goals, feedback] = await Promise.all([
    getCheckInHistoryForUser(userId),
    getGoalsForUser(userId),
    getFeedbackForSubject(userId),
  ]);

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
          {(user.name ?? user.email).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{user.name ?? user.email}</h1>
          <p className="text-sm text-neutral-500">{user.title}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Recent check-ins</h2>
        {checkIns.slice(0, 5).map((c) => (
          <Link key={c.id} href={`/check-ins/${c.id}`} className="card card-hover block p-3 text-sm">
            <div className="flex justify-between">
              <span>Week of {formatPeriod(c.periodStart)}</span>
              <span className="text-neutral-500">
                {c.moodScore != null ? `Mood ${c.moodScore}/5` : "—"}
              </span>
            </div>
          </Link>
        ))}
        {checkIns.length === 0 && (
          <div className="card p-4 text-center text-sm text-neutral-500">No check-ins yet.</div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Goals</h2>
        {goals.map((g) => (
          <Link key={g.id} href={`/goals/${g.id}`} className="card card-hover block p-3 text-sm">
            <div className="flex justify-between">
              <span>{g.title}</span>
              <span className="text-neutral-500">{g.progress}%</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {g.type === "TEAM" ? "Team goal" : "Individual goal"} · Due {formatDate(g.targetDate)}
            </p>
          </Link>
        ))}
        {goals.length === 0 && (
          <div className="card p-4 text-center text-sm text-neutral-500">No goals yet.</div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">360 feedback</h2>
        {feedback.map((req) => (
          <div key={req.id} className="card p-4 text-sm">
            <p className="text-xs text-neutral-500">From {req.reviewer.name ?? req.reviewer.email}</p>
            {req.response && (
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Strengths</p>
                  <p className="text-neutral-700">{req.response.strengths}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Areas to improve</p>
                  <p className="text-neutral-700">{req.response.areasToImprove}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {feedback.length === 0 && (
          <div className="card p-4 text-center text-sm text-neutral-500">No completed feedback yet.</div>
        )}
      </div>
    </div>
  );
}
