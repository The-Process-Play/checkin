const accents = {
  indigo: "from-indigo-500 to-violet-600",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-400 to-orange-500",
  red: "from-red-500 to-rose-500",
};

export function StatTile({
  label,
  value,
  icon,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  icon?: string;
  accent?: keyof typeof accents;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-base ${accents[accent]}`}
          >
            <span className="drop-shadow-sm">{icon}</span>
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
          <p className="text-2xl font-semibold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
