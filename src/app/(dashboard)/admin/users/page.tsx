import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAllUsers } from "@/actions/admin";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const users = await getAllUsers();
  const potentialManagers = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
        Users
      </h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50/80 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Manager</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} potentialManagers={potentialManagers} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
