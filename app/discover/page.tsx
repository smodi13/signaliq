import { companies, signals, sources, snapshotMeta } from "@/lib/data";
import { DiscoveryFeed } from "@/components/DiscoveryFeed";

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Signal Discovery</h1>
      <p className="mt-1 text-sm text-slate-600 max-w-2xl">
        An analyst&apos;s intelligence dashboard: every signal across the tracked corpus, with why it surfaced,
        its evidence, and its source — not an unexplained score, not a generic news feed.
      </p>

      <div className="mt-6">
        <DiscoveryFeed signals={signals} companies={companies} sources={sources} snapshotDate={snapshotMeta.snapshotDate} />
      </div>
    </div>
  );
}
