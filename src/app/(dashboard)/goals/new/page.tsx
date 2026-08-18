import { GoalForm } from "@/components/goals/goal-form";

export default function NewGoalPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">New goal</h1>
      <GoalForm />
    </div>
  );
}
