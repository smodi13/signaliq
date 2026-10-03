"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { snapshotMeta } from "@/lib/data";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/companies", label: "Companies" },
  { href: "/market-map", label: "Market Map" },
  { href: "/backtest", label: "Backtest" },
  { href: "/research", label: "Research" },
  { href: "/methodology", label: "Methodology" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20 print:hidden">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center gap-8">
        <Link href="/" className="font-semibold tracking-tight text-slate-900 shrink-0">
          Signal<span className="text-indigo-600">IQ</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/methodology"
          title={`Saved research snapshot, captured ${snapshotMeta.snapshotDate}. No live API calls.`}
          className="ml-auto shrink-0 flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-full px-2.5 py-1 hover:border-slate-300 hover:text-slate-700"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Demo data
        </Link>
      </div>
    </header>
  );
}
