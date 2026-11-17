"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-shell";

const navigation = [
  { name: "Overview", href: "/" },
  { name: "My Profile", href: "/profile" },
  { name: "Customers", href: "/customers" },
  { name: "Leads", href: "/leads" },
  { name: "Activities", href: "/activities" },
  { name: "Tasks", href: "/tasks" },
  { name: "Follow-ups", href: "/follow-ups" },
  { name: "Interactions", href: "/interactions" },
  { name: "Notifications", href: "/notifications" },
  { name: "Reports", href: "/reports" },
  { name: "Search", href: "/search" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = user?.role === "Admin"
    ? [...navigation, { name: "Administration", href: "/admin" }]
    : navigation;

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-border bg-white p-5 text-foreground">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight">
          ember<span className="text-primary">.</span>
        </h1>
        <p className="mt-1 text-xs text-muted">Customer relationship management</p>
      </div>
      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Workspace</p>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
              pathname === item.href
                ? "bg-indigo-50 text-primary"
                : "text-muted hover:bg-slate-50 hover:text-foreground"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-5">
        <p className="truncate text-sm font-semibold">{user?.name}</p>
        <p className="mt-1 text-xs text-muted">{user?.role}</p>
        <button onClick={logout} className="mt-4 text-xs font-semibold text-muted hover:text-error">
          Log out
        </button>
      </div>
    </aside>
  );
}
