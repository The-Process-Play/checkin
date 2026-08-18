import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";

function initials(name: string | null | undefined, email: string) {
  const source = name ?? email;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-60 flex-col justify-between border-r border-neutral-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-300/60">
              T
            </div>
            <p className="text-sm font-semibold text-neutral-900">TPP Check-In</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
              {initials(session.user.name, session.user.email ?? "")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-600">
                {session.user.role}
              </p>
            </div>
          </div>

          <DashboardNav role={session.user.role} />
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-500 transition hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
