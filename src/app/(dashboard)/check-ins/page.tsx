import Link from "next/link";
import { getMyCheckInHistory, getCurrentWeekCheckIn } from "@/actions/check-ins";
import { formatPeriod } from "@/lib/period";

export default async function CheckInsPage() {
  const [history, currentWeek] = await Promise.all([getMyCheckInHistory(), getCurrentWeekCheckIn()]);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Check-Ins
        </h1>
        <Link href="/check-ins/new" className="btn-primary">
          {currentWeek ? "Edit this week's check-in" : "Submit this week's check-in"}
        </Link>
      </div>

      {!currentWeek && (
        <div className="card flex items-center gap-2 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50 to-white px-4 py-3 text-sm text-amber-700">
          <span aria-hidden>⏰</span> You haven&apos;t submitted a check-in for this week yet.
        </div>
      )}

      <div className="space-y-3">
        {history.map((checkIn) => (
          <Link key={checkIn.id} href={`/check-ins/${checkIn.id}`} className="card card-hover block p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">
                Week of {formatPeriod(checkIn.periodStart)}
              </span>
              <div className="flex gap-2 text-xs">
                {checkIn.moodScore && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                    Mood {checkIn.moodScore}/5
                  </span>
                )}
                {checkIn.energyScore && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    Energy {checkIn.energyScore}/5
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {history.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-500">No check-ins submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
