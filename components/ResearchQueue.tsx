"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Company, ResearchStatus } from "@/lib/schemas";
import { Card, Pill } from "@/components/ui";

const STORAGE_KEY = "signaliq_research_notes_v1";
const STATUSES: ResearchStatus[] = ["NEW", "RESEARCHING", "VERIFIED", "WATCH", "ARCHIVED"];

interface NoteRecord {
  status: ResearchStatus;
  note: string;
  updatedAt: string;
}

type Store = Record<string, NoteRecord>;

function loadStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveStore(store: Store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const STATUS_TONE: Record<ResearchStatus, "slate" | "indigo" | "emerald" | "amber"> = {
  NEW: "slate",
  RESEARCHING: "indigo",
  VERIFIED: "emerald",
  WATCH: "amber",
  ARCHIVED: "slate",
};

export function ResearchQueue({ companies, gapCounts }: { companies: Company[]; gapCounts: Record<string, number> }) {
  const [store, setStore] = useState<Store>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Reads a browser-only store on mount to avoid an SSR/client hydration
    // mismatch — the recommended pattern for external, non-reactive storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(loadStore());
    setLoaded(true);
  }, []);

  function update(companyId: string, patch: Partial<NoteRecord>) {
    const next: Store = {
      ...store,
      [companyId]: {
        status: store[companyId]?.status ?? "NEW",
        note: store[companyId]?.note ?? "",
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    };
    setStore(next);
    saveStore(next);
  }

  if (!loaded) return <Card className="p-8 text-center text-sm text-slate-400">Loading queue…</Card>;

  return (
    <div className="space-y-3">
      {companies.map((c) => {
        const record = store[c.id] ?? { status: "NEW" as ResearchStatus, note: "", updatedAt: "" };
        const gaps = gapCounts[c.id] ?? 0;
        return (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                  {c.name}
                </Link>
                <div className="text-xs text-slate-500">{c.oneLiner}</div>
                {gaps > 0 && (
                  <div className="mt-1">
                    <Pill tone="amber">{gaps} research gap{gaps === 1 ? "" : "s"} flagged</Pill>
                  </div>
                )}
              </div>
              <select
                value={record.status}
                onChange={(e) => update(c.id, { status: e.target.value as ResearchStatus })}
                className="rounded border border-slate-300 text-sm px-2 py-1"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Pill tone={STATUS_TONE[record.status]}>{record.status}</Pill>
              {record.updatedAt && <span className="text-xs text-slate-400">updated {new Date(record.updatedAt).toLocaleString()}</span>}
            </div>
            <textarea
              value={record.note}
              onChange={(e) => update(c.id, { note: e.target.value })}
              placeholder="Analyst notes (saved locally in this browser)…"
              rows={2}
              className="mt-2 w-full rounded border border-slate-200 text-sm px-2 py-1.5 resize-y"
            />
          </Card>
        );
      })}
    </div>
  );
}
