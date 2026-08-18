import { getActiveTemplate, getCurrentWeekCheckIn } from "@/actions/check-ins";
import { getMyGoals } from "@/actions/goals";
import { CheckInForm } from "@/components/check-ins/check-in-form";
import { formatPeriod } from "@/lib/period";

export default async function NewCheckInPage() {
  const [template, currentWeek, goals] = await Promise.all([
    getActiveTemplate(),
    getCurrentWeekCheckIn(),
    getMyGoals(),
  ]);

  const responsesByQuestion = Object.fromEntries(
    (currentWeek?.responses ?? []).map((r) => [
      r.questionId,
      { textValue: r.textValue, scaleValue: r.scaleValue },
    ])
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Check-in: week of {formatPeriod(currentWeek?.periodStart ?? new Date())}
        </h1>
        <p className="text-sm text-neutral-500">{template.name}</p>
      </div>
      <CheckInForm
        templateId={template.id}
        questions={template.questions}
        goals={goals.filter((g) => g.status !== "COMPLETED")}
        initial={
          currentWeek
            ? {
                moodScore: currentWeek.moodScore,
                energyScore: currentWeek.energyScore,
                responses: responsesByQuestion,
              }
            : undefined
        }
      />
    </div>
  );
}
