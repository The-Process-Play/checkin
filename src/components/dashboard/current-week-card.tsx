import Link from "next/link";

export function CurrentWeekCard({
  checkIn,
}: {
  checkIn: { moodScore: number | null; energyScore: number | null } | null;
}) {
  if (!checkIn) {
    return (
      <div className="card flex items-center justify-between border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            ⏰
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-800">This week&apos;s check-in is due</p>
            <p className="text-xs text-amber-700">Take a couple minutes to submit it.</p>
          </div>
        </div>
        <Link href="/check-ins/new" className="btn-primary">
          Submit now
        </Link>
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between border-l-4 border-l-emerald-400 bg-gradient-to-br from-emerald-50 to-white p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          ✅
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">This week&apos;s check-in is submitted</p>
          <div className="mt-1 flex gap-4 text-xs text-emerald-700">
            {checkIn.moodScore != null && <span>Mood: {checkIn.moodScore}/5</span>}
            {checkIn.energyScore != null && <span>Energy: {checkIn.energyScore}/5</span>}
          </div>
        </div>
      </div>
      <Link href="/check-ins/new" className="btn-secondary">
        Edit
      </Link>
    </div>
  );
}
