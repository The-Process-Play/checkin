"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserManager, setUserActive } from "@/actions/admin";
import type { Role, User } from "@prisma/client";

const ROLES: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"];

export function UserRow({
  user,
  potentialManagers,
}: {
  user: User & { manager: User | null };
  potentialManagers: User[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(role: Role) {
    startTransition(async () => {
      await updateUserRole(user.id, role);
      router.refresh();
    });
  }

  function handleManagerChange(managerId: string) {
    startTransition(async () => {
      await updateUserManager(user.id, managerId || null);
      router.refresh();
    });
  }

  function handleActiveToggle() {
    startTransition(async () => {
      await setUserActive(user.id, !user.isActive);
      router.refresh();
    });
  }

  return (
    <tr className={`border-b border-neutral-100 transition last:border-0 hover:bg-indigo-50/30 ${!user.isActive ? "opacity-50" : ""}`}>
      <td className="px-4 py-3">
        <p className="font-medium text-neutral-900">{user.name ?? user.email}</p>
        <p className="text-xs text-neutral-500">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <select
          value={user.role}
          disabled={isPending}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={user.managerId ?? ""}
          disabled={isPending}
          onChange={(e) => handleManagerChange(e.target.value)}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">No manager</option>
          {potentialManagers
            .filter((m) => m.id !== user.id)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email}
              </option>
            ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleActiveToggle}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          {user.isActive ? "Deactivate" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}
