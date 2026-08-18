import Link from "next/link";
import { auth } from "@/auth";
import { getMyOneOnOnes, getMyDirectReports } from "@/actions/one-on-ones";
import { NewOneOnOneForm } from "@/components/one-on-ones/new-one-on-one-form";

export default async function OneOnOnesPage() {
  const session = await auth();
  const [oneOnOnes, reports] = await Promise.all([
    getMyOneOnOnes(),
    session?.user.role !== "EMPLOYEE" ? getMyDirectReports() : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
        1:1s
      </h1>

      {reports.length > 0 && <NewOneOnOneForm reports={reports} />}

      <div className="space-y-3">
        {oneOnOnes.map((o) => {
          const isManager = o.managerId === session?.user.id;
          const other = isManager ? o.report : o.manager;
          return (
            <Link key={o.id} href={`/one-on-ones/${o.id}`} className="card card-hover block p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900">{other.name ?? other.email}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  {o.scheduledAt.toLocaleDateString()}
                </span>
              </div>
              {o.agenda && <p className="mt-1 text-xs text-neutral-500">{o.agenda}</p>}
            </Link>
          );
        })}
        {oneOnOnes.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-500">No 1:1s yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
