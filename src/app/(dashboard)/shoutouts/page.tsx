import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRecentShoutouts } from "@/actions/shoutouts";
import { ShoutoutForm } from "@/components/shoutouts/shoutout-form";
import { formatDate } from "@/lib/date";

export default async function ShoutoutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [shoutouts, colleagues] = await Promise.all([
    getRecentShoutouts(),
    prisma.user.findMany({
      where: { isActive: true, id: { not: session.user.id } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-2xl font-semibold text-transparent">
        Shout-Outs
      </h1>

      <ShoutoutForm colleagues={colleagues} />

      <div className="space-y-3">
        {shoutouts.map((s) => (
          <div key={s.id} className="card p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>
                <span className="font-medium text-neutral-900">{s.from.name ?? s.from.email}</span>
                <span className="text-neutral-500"> → </span>
                <span className="font-medium text-neutral-900">{s.to.name ?? s.to.email}</span>
              </span>
              <span className="text-xs text-neutral-500">{formatDate(s.createdAt)}</span>
            </div>
            <p className="mt-1.5 text-neutral-700">{s.message}</p>
          </div>
        ))}
        {shoutouts.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-sm text-neutral-500">No shout-outs yet — be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
