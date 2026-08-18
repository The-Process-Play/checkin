import Link from "next/link";
import type { TeamMemberStatus } from "@/lib/dashboard";

export function TeamStatusTable({ members }: { members: TeamMemberStatus[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50/80 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2.5 font-medium">Name</th>
            <th className="px-4 py-2.5 font-medium">This week</th>
            <th className="px-4 py-2.5 font-medium">Recent mood</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-neutral-100 transition last:border-0 hover:bg-indigo-50/30">
              <td className="px-4 py-3">
                <Link href={`/team/${m.id}`} className="font-medium text-neutral-900 hover:text-indigo-600 hover:underline">
                  {m.name ?? m.email}
                </Link>
              </td>
              <td className="px-4 py-3">
                {m.submittedThisPeriod ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Missing
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {m.recentAvgMood != null ? `${m.recentAvgMood.toFixed(1)}/5` : "—"}
              </td>
              <td className="px-4 py-3">
                {m.atRisk ? (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                    At risk
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    OK
                  </span>
                )}
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                No team members to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
