import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveTemplateWithQuestions } from "@/actions/admin";
import { QuestionEditor } from "@/components/admin/question-editor";

export default async function AdminTemplatesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const template = await getActiveTemplateWithQuestions();

  if (!template) {
    return <p className="text-sm text-neutral-500">No active check-in template found.</p>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
          Check-in template
        </h1>
        <p className="text-sm text-neutral-500">{template.name}</p>
      </div>
      <p className="text-xs text-neutral-500">
        Mood and energy are always collected as a 1–5 scale; text questions below appear beneath them
        on the check-in form.
      </p>
      <QuestionEditor templateId={template.id} questions={template.questions} />
    </div>
  );
}
