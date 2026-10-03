import Link from "next/link";
import { companies } from "@/lib/data";
import { momentumFor } from "@/lib/company-analytics";
import { Card } from "@/components/ui";

const THEME_LABELS: Record<string, string> = {
  ai_infrastructure: "AI Infrastructure",
  developer_tools: "Developer Tools",
  ai_applications: "AI Applications",
  vertical_ai: "Vertical AI",
  fintech_infrastructure: "Fintech Infrastructure",
};

export default function CompaniesPage() {
  const rows = [...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
      <p className="mt-1 text-sm text-slate-600">Searchable directory. Click through to evidence, signals, and Signal Momentum.</p>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Company</th>
              <th className="text-left font-medium px-4 py-2.5">Theme</th>
              <th className="text-left font-medium px-4 py-2.5">GitHub org</th>
              <th className="text-right font-medium px-4 py-2.5">Signal Momentum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => {
              const m = momentumFor(c.id);
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {c.name}
                    </Link>
                    <div className="text-xs text-slate-500">{c.oneLiner}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{THEME_LABELS[c.theme]}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{c.githubOrg}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">{m.momentum.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
