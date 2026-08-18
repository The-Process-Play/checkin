import { notFound } from "next/navigation";
import { getCheckInById } from "@/actions/check-ins";
import { formatPeriod } from "@/lib/period";

export default async function CheckInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const checkIn = await getCheckInById(id);
  if (!checkIn) notFound();

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Week of {formatPeriod(checkIn.periodStart)}
        </h1>
        <p className="text-sm text-neutral-500">{checkIn.author.name ?? checkIn.author.email}</p>
      </div>

      <div className="flex gap-3">
        {checkIn.moodScore != null && (
          <div className="card border-l-4 border-l-indigo-400 px-4 py-2 text-sm">
            Mood: <span className="font-medium text-indigo-700">{checkIn.moodScore}/5</span>
          </div>
        )}
        {checkIn.energyScore != null && (
          <div className="card border-l-4 border-l-amber-400 px-4 py-2 text-sm">
            Energy: <span className="font-medium text-amber-700">{checkIn.energyScore}/5</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {checkIn.responses
          .filter((r) => r.textValue)
          .map((r) => (
            <div key={r.id} className="card space-y-1 p-4">
              <p className="text-sm font-medium text-neutral-700">{r.question.prompt}</p>
              <p className="whitespace-pre-wrap text-sm text-neutral-600">{r.textValue}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
