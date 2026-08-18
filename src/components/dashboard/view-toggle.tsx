import Link from "next/link";

export function ViewToggle({ active }: { active: "me" | "team" }) {
  const base = "rounded-lg px-3 py-1.5 text-sm font-medium transition";
  return (
    <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1">
      <Link
        href="/?view=me"
        className={`${base} ${
          active === "me"
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-700"
        }`}
      >
        My dashboard
      </Link>
      <Link
        href="/?view=team"
        className={`${base} ${
          active === "team"
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-700"
        }`}
      >
        Team dashboard
      </Link>
    </div>
  );
}
