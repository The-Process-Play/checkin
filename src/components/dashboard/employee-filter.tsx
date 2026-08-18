"use client";

import { useRouter } from "next/navigation";
import type { User } from "@prisma/client";

export function EmployeeFilter({
  members,
  selectedId,
}: {
  members: User[];
  selectedId?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `/?view=team&employeeId=${value}` : "/?view=team");
      }}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    >
      <option value="">All (aggregate)</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name ?? m.email}
        </option>
      ))}
    </select>
  );
}
