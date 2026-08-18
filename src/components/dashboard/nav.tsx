"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

const links = [
  { href: "/", label: "Home", icon: "🏠", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] as Role[] },
  { href: "/check-ins", label: "Check-Ins", icon: "📝", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] as Role[] },
  { href: "/goals", label: "Goals", icon: "🎯", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] as Role[] },
  { href: "/one-on-ones", label: "1:1s", icon: "💬", roles: ["EMPLOYEE", "MANAGER", "ADMIN"] as Role[] },
  { href: "/team", label: "Team", icon: "👥", roles: ["MANAGER", "ADMIN"] as Role[] },
  { href: "/admin/dashboard", label: "Admin", icon: "📊", roles: ["ADMIN"] as Role[] },
  { href: "/admin/users", label: "Users", icon: "🧑‍💼", roles: ["ADMIN"] as Role[] },
  { href: "/admin/templates", label: "Templates", icon: "🗂️", roles: ["ADMIN"] as Role[] },
];

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {links
        .filter((link) => link.roles.includes(role))
        .map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-300/50"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <span aria-hidden className="text-[15px] leading-none">
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
    </nav>
  );
}
