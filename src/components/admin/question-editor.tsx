"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addTemplateQuestion,
  updateTemplateQuestion,
  deleteTemplateQuestion,
} from "@/actions/admin";
import type { CheckInQuestion, QuestionType } from "@prisma/client";

export function QuestionEditor({ templateId, questions }: { templateId: string; questions: CheckInQuestion[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState<QuestionType>("TEXT");
  const [newRequired, setNewRequired] = useState(true);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrompt.trim()) return;
    startTransition(async () => {
      await addTemplateQuestion(templateId, { prompt: newPrompt, type: newType, isRequired: newRequired });
      setNewPrompt("");
      router.refresh();
    });
  }

  function handleUpdate(id: string, prompt: string, isRequired: boolean) {
    startTransition(async () => {
      await updateTemplateQuestion(id, { prompt, isRequired });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTemplateQuestion(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="card flex items-center gap-2 border-l-4 border-l-indigo-300 p-3">
          <input
            type="text"
            defaultValue={q.prompt}
            onBlur={(e) => {
              if (e.target.value !== q.prompt) handleUpdate(q.id, e.target.value, q.isRequired);
            }}
            className="input flex-1 py-1"
          />
          <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500">{q.type}</span>
          <label className="flex items-center gap-1 text-xs text-neutral-500">
            <input
              type="checkbox"
              defaultChecked={q.isRequired}
              onChange={(e) => handleUpdate(q.id, q.prompt, e.target.checked)}
              className="accent-indigo-600"
            />
            Required
          </label>
          <button
            onClick={() => handleDelete(q.id)}
            disabled={isPending}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex items-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-3">
        <input
          type="text"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          placeholder="New question prompt"
          className="input flex-1 py-1"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as QuestionType)}
          className="input w-auto py-1"
        >
          <option value="TEXT">Text</option>
          <option value="SCALE">Scale</option>
          <option value="BOOLEAN">Yes/No</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={newRequired}
            onChange={(e) => setNewRequired(e.target.checked)}
            className="accent-indigo-600"
          />
          Required
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          Add
        </button>
      </form>
    </div>
  );
}
