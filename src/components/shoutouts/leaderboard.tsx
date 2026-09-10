const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({
  rows,
}: {
  rows: { id: string; name: string | null; email: string; received: number; given: number }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-neutral-500">No shout-outs yet — the leaderboard starts once someone gives one.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50/80 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Rank</th>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Received</th>
            <th className="px-4 py-2 font-medium">Given</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-3 text-neutral-500">{MEDALS[i] ?? `#${i + 1}`}</td>
              <td className="px-4 py-3 font-medium text-neutral-900">{row.name ?? row.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {row.received}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-600">{row.given}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
