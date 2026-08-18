import { prisma } from "@/lib/prisma";
import { signInWithMicrosoft, signInAsDevUser } from "@/actions/auth";

const roleBadge: Record<string, string> = {
  ADMIN: "bg-indigo-100 text-indigo-700",
  MANAGER: "bg-violet-100 text-violet-700",
  EMPLOYEE: "bg-neutral-100 text-neutral-600",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const isDev = process.env.NODE_ENV === "development" || process.env.ALLOW_DEV_LOGIN === "true";
  const microsoftConfigured = Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER
  );

  const devUsers = isDev
    ? await prisma.user.findMany({
        where: { isActive: true },
        orderBy: [{ role: "desc" }, { name: "asc" }],
        select: { id: true, name: true, email: true, role: true },
      })
    : [];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200/80 bg-white/90 p-8 shadow-xl shadow-indigo-100 backdrop-blur-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-md shadow-indigo-300/60">
            T
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">TPP Check-In</h1>
          <p className="text-sm text-neutral-500">Sign in to continue</p>
        </div>

        {microsoftConfigured ? (
          <form
            action={async () => {
              "use server";
              await signInWithMicrosoft(callbackUrl);
            }}
          >
            <button type="submit" className="btn-primary w-full py-2.5">
              Sign in with Microsoft
            </button>
          </form>
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
            Microsoft SSO isn&apos;t configured yet in this environment.
          </p>
        )}

        {isDev && (
          <div className="space-y-3 border-t border-neutral-200 pt-5">
            <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
              Dev login (test/staging only)
            </p>
            <div className="space-y-2">
              {devUsers.map((user) => (
                <form
                  key={user.id}
                  action={async () => {
                    "use server";
                    await signInAsDevUser(user.email, callbackUrl);
                  }}
                >
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm transition hover:border-indigo-200 hover:bg-indigo-50/50"
                  >
                    <span className="font-medium text-neutral-800">{user.name ?? user.email}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleBadge[user.role]}`}>
                      {user.role}
                    </span>
                  </button>
                </form>
              ))}
              {devUsers.length === 0 && (
                <p className="text-center text-xs text-neutral-400">
                  No seeded users yet — run <code>npx prisma db seed</code>.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
