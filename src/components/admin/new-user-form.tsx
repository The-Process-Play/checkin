"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/actions/admin";
import type { Role, User } from "@prisma/client";

const ROLES: Role[] = ["EMPLOYEE", "MANAGER", "ADMIN"];

export function NewUserForm({ potentialManagers }: { potentialManagers: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [managerId, setManagerId] = useState("");
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createUser({
          email,
          name: name || undefined,
          role,
          managerId: managerId || null,
          title: title || undefined,
        });
        setEmail("");
        setName("");
        setRole("EMPLOYEE");
        setManagerId("");
        setTitle("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-l-4 border-l-indigo-300 p-4">
      <h2 className="text-sm font-semibold text-neutral-900">Add a new user</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Manager</label>
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="input">
            <option value="">No manager</option>
            {potentialManagers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Title (optional)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Adding..." : "Add user"}
      </button>
    </form>
  );
}
