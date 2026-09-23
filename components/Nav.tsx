"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Tasks" },
  { href: "/submit", label: "Submit" },
  { href: "/identify", label: "Identify" },
  { href: "/wordlists", label: "Wordlists" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            OnlineHashCrack
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            OHC Dashboard
          </h1>
        </div>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
