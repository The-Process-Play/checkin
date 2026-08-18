import { notFound } from "next/navigation";
import { getOneOnOneById } from "@/actions/one-on-ones";
import { NotesForm } from "@/components/one-on-ones/notes-form";
import { ActionItems } from "@/components/one-on-ones/action-items";

export default async function OneOnOneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const oneOnOne = await getOneOnOneById(id);
  if (!oneOnOne) notFound();

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {oneOnOne.manager.name ?? oneOnOne.manager.email} &amp; {oneOnOne.report.name ?? oneOnOne.report.email}
        </h1>
        <p className="text-sm text-neutral-500">{oneOnOne.scheduledAt.toLocaleDateString()}</p>
      </div>

      <NotesForm
        oneOnOneId={oneOnOne.id}
        initialAgenda={oneOnOne.agenda ?? ""}
        initialNotes={oneOnOne.notes ?? ""}
      />

      <ActionItems
        oneOnOneId={oneOnOne.id}
        items={oneOnOne.actionItems}
        participants={[oneOnOne.manager, oneOnOne.report]}
      />
    </div>
  );
}
