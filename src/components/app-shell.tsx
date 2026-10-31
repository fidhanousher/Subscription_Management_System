import Link from "next/link";
import { SessionUser } from "@/lib/rbac";
import { signOutAction } from "@/actions/auth";

const staffNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/templates", label: "Quote templates" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
];

const adminNav = [
  { href: "/products", label: "Products" },
  { href: "/plans", label: "Plans" },
  { href: "/taxes", label: "Taxes" },
  { href: "/discounts", label: "Discounts" },
  { href: "/staff", label: "Staff" },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const links = user.role === "ADMIN" ? [...staffNav, ...adminNav] : staffNav;

  return (
    <div className="flex min-h-full">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-white">
        <div className="px-5 py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Brightloop</p>
          <p className="mt-1 text-lg font-semibold">Billing</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-xs text-slate-300">{user.email}</p>
          <p className="mt-1 text-xs text-emerald-300">{user.role}</p>
          <form action={signOutAction}>
            <button className="mt-3 text-xs text-slate-300 underline">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}

export function PortalShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Brightloop</p>
          <p className="font-semibold">Customer portal</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/portal" className="hover:text-accent">
            Overview
          </Link>
          <Link href="/portal/subscriptions" className="hover:text-accent">
            Subscriptions
          </Link>
          <Link href="/portal/invoices" className="hover:text-accent">
            Invoices
          </Link>
          <span className="text-muted">{user.name}</span>
          <form action={signOutAction}>
            <button className="text-xs underline">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
