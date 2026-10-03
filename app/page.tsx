import Link from "next/link";
import { companies, signals, sources, milestones } from "@/lib/data";
import { allCompanyMomentum } from "@/lib/company-analytics";
import { Card, Pill } from "@/components/ui";
import type { SignalCategory } from "@/lib/schemas";

const CATEGORY_ORDER: SignalCategory[] = ["product", "market", "organization", "technical", "commercial", "founder"];

export default function Home() {
  const momentum = allCompanyMomentum().sort((a, b) => b.breakdown.momentum - a.breakdown.momentum);
  const topCompany = momentum[0];
  const topMomentum = momentum.slice(0, 5);

  const categoryCounts: Record<SignalCategory, number> = { product: 0, technical: 0, commercial: 0, founder: 0, organization: 0, market: 0 };
  for (const s of signals) categoryCounts[s.category]++;
  const maxCategoryCount = Math.max(...Object.values(categoryCounts));

  const actions = [
    {
      step: "01",
      title: "Discover",
      body: "Find emerging signals across tracked companies — every one tied to a cited source.",
      href: "/discover",
      cta: "Explore signals",
    },
    {
      step: "02",
      title: "Reconstruct",
      body: "Understand what was knowable about a company at any point in its history.",
      href: topCompany ? `/companies/${topCompany.companyId}` : "/companies",
      cta: "What did we know then?",
    },
    {
      step: "03",
      title: "Test",
      body: "Examine whether observable signals appeared before documented milestones.",
      href: "/backtest",
      cta: "Open backtest",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 space-y-16">
      <section>
        <p className="text-sm font-medium text-indigo-600 tracking-wide uppercase">Technology Intelligence for Private Markets</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 max-w-2xl leading-[1.1]">
          Find the signals before the milestone.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600">
          SignalIQ tracks technical, product, founder, organizational, commercial, and market signals around
          emerging technology companies, preserves the underlying evidence, and reconstructs what was knowable at
          each point in time. It does not rank companies or make investment recommendations.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {actions.map((a) => (
          <Link key={a.step} href={a.href} className="group">
            <Card className="p-6 h-full hover:border-slate-300 hover:shadow-sm transition-all">
              <span className="text-xs font-mono text-slate-400">{a.step}</span>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{a.title}</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{a.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-1.5 transition-all">
                {a.cta} <span aria-hidden>→</span>
              </span>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Research corpus</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200 border border-slate-200 rounded-lg bg-white">
          {[
            { label: "Companies", value: companies.length },
            { label: "Signals", value: signals.length },
            { label: "Sources", value: sources.length },
            { label: "Milestones", value: milestones.length },
          ].map((stat) => (
            <div key={stat.label} className="px-5 py-4">
              <div className="text-2xl font-semibold tabular-nums text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 border border-slate-200 rounded-lg bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium text-slate-900">Signal coverage by category</h3>
            <span className="text-xs text-slate-400">6/6 categories represented</span>
          </div>
          <div className="mt-3 space-y-2">
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600 capitalize">{cat}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${(categoryCounts[cat] / maxCategoryCount) * 100}%` }} />
                </div>
                <div className="w-10 text-right text-sm font-mono tabular-nums text-slate-900">{categoryCounts[cat]}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            Coverage is uneven because SignalIQ only records evidence that could be independently verified from
            available public sources — not a weighting choice. See <Link href="/methodology" className="text-indigo-600 hover:underline">Methodology</Link>.
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-900">Highest Signal Momentum</h2>
          <Link href="/discover" className="text-sm text-indigo-600 hover:underline">
            View all signals →
          </Link>
        </div>
        <Card>
          <ul className="divide-y divide-slate-100">
            {topMomentum.map(({ companyId, breakdown }) => {
              const company = companies.find((c) => c.id === companyId)!;
              return (
                <li key={companyId}>
                  <Link href={`/companies/${companyId}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">{company.name}</div>
                      <div className="text-sm text-slate-500">{company.oneLiner}</div>
                    </div>
                    <div className="text-right shrink-0 pl-4">
                      <div className="font-mono tabular-nums text-lg text-slate-900">{breakdown.momentum.toFixed(1)}</div>
                      <Pill tone="indigo">{breakdown.eligibleSignalCount} signals</Pill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
