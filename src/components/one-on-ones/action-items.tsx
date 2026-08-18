"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addActionItem, toggleActionItem } from "@/actions/one-on-ones";
import type { ActionItem, User } from "@prisma/client";

type ActionItemWithAssignee = ActionItem & { assignee: User };

export function ActionItems({
  oneOnOneId,
  items,
  participants,
}: {
  oneOnOneId: string;
  items: ActionItemWithAssignee[];
  participants: User[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(participants[0]?.id ?? "");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    startTransition(async () => {
      await addActionItem(oneOnOneId, { assigneeId, description });
      setDescription("");
      router.refresh();
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleActionItem(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-neutral-900">Action items</h2>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`card flex items-center gap-3 p-3 ${item.status === "DONE" ? "border-l-4 border-l-emerald-300" : "border-l-4 border-l-indigo-300"}`}
          >
            <input
              type="checkbox"
              checked={item.status === "DONE"}
              onChange={() => handleToggle(item.id)}
              className="h-4 w-4 accent-indigo-600"
            />
            <div className="flex-1">
              <p className={`text-sm ${item.status === "DONE" ? "text-neutral-400 line-through" : "text-neutral-800"}`}>
                {item.description}
              </p>
              <p className="text-xs text-neutral-500">{item.assignee.name ?? item.assignee.email}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-neutral-500">No action items yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="input w-auto"
        >
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? p.email}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="New action item"
          className="input flex-1"
        />
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
