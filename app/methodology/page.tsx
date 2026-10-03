import { CATEGORY_HALF_LIFE_DAYS, EVIDENCE_LEVEL_WEIGHT } from "@/lib/analytics/signal-momentum";
import { snapshotMeta, signals, milestones, companies } from "@/lib/data";
import type { SignalCategory } from "@/lib/schemas";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-20">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="text-sm text-slate-700 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

const TOC = [
  ["architecture", "1. Research architecture"],
  ["provenance", "2. Source provenance"],
  ["taxonomy", "3. Signal taxonomy"],
  ["momentum", "4. Signal Momentum"],
  ["velocity", "5. Signal Velocity"],
  ["acceleration", "6. Signal Acceleration"],
  ["corroboration", "7. Corroboration"],
  ["cutoff", "8. Historical cutoff logic"],
  ["backtesting", "9. Backtesting"],
  ["limitations", "10. Limitations"],
  ["x-integration", "11. X sourcing integration"],
] as const;

export default function MethodologyPage() {
  const categoryCounts: Record<SignalCategory, number> = { product: 0, technical: 0, commercial: 0, founder: 0, organization: 0, market: 0 };
  for (const s of signals) categoryCounts[s.category]++;
  const milestoneTypeCount = new Set(milestones.map((m) => m.type)).size;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Methodology</h1>
        <p className="mt-1 text-sm text-slate-600">
          What SignalIQ computes, what it doesn&apos;t, and the evidence standard every displayed value is held to.
        </p>
      </div>

      <nav className="mt-6 mb-10 grid grid-cols-2 gap-x-6 gap-y-1 text-sm border border-slate-200 rounded-lg p-4 bg-white">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="text-indigo-600 hover:underline">
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        <Section id="architecture" title="1. Research architecture">
          <p>
            SignalIQ is a technology intelligence and research-organization tool for private-market analysts. It
            surfaces public signals about emerging technology companies, preserves source provenance, and lets an
            analyst reconstruct what was knowable at a past date. It does not rank companies, does not predict
            investment outcomes, and makes no investment recommendation.
          </p>
          <p>
            Pipeline: public source adapters (GitHub, Hacker News, X sanitized replay) → normalized{" "}
            <code>Signal</code>/<code>SourceRecord</code> records → deterministic analytics → a saved JSON snapshot
            (<code>data/snapshot/</code>) → this Next.js interface. See <code>docs/ARCHITECTURE.md</code> in the
            repository for the full diagram. The deployed demo reads only the snapshot; it makes{" "}
            <strong>no live API calls</strong> and requires no environment variables to run.
          </p>
          <p className="font-medium text-slate-900">
            This snapshot was captured {snapshotMeta.snapshotDate}. Every date-stamped value on this platform
            reflects that capture date, not the live state of GitHub or Hacker News today.
          </p>
        </Section>

        <Section id="provenance" title="2. Source provenance">
          <p>Every material value on this platform carries one of six provenance tags:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Verified fact</strong> — independently corroborated by more than one unrelated source.</li>
            <li><strong>Source-reported</strong> — stated by a source (the company itself, or a third party) without independent corroboration.</li>
            <li><strong>Analyst assessment</strong> — a human judgment call; the basis is recorded.</li>
            <li><strong>Computed</strong> — derived deterministically from other stored values (e.g. Signal Momentum).</li>
            <li><strong>Model-generated</strong> — an LLM summary of sourced material. Never treated as a fact on its own.</li>
            <li><strong>Unknown</strong> — not established. Never backfilled, never treated as a negative signal.</li>
          </ul>
          <p>Every signal also carries an evidence level, reflecting how directly it was verified — not how exciting it is:</p>
          <ul className="list-disc pl-5 space-y-1">
            {(["A", "B", "C", "D"] as const).map((level) => (
              <li key={level}>
                <strong>Level {level}</strong> — weight {EVIDENCE_LEVEL_WEIGHT[level]} in Signal Momentum.{" "}
                {level === "A" && "Verified public product artifact: a real repository, release, or live product page."}
                {level === "B" && "Reported by a named, checkable source with a timestamp (e.g. a well-received Hacker News story)."}
                {level === "C" && "Secondhand, aggregator, or unverified claim."}
                {level === "D" && "Speculative or unconfirmed. Not used in this build's seed data, reserved for future adapters."}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="taxonomy" title="3. Signal taxonomy">
          <p>Every signal belongs to one of six categories. A signal is only created when real evidence supports it — categories with no evidence show as missing, never as zero-filled or estimated:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Product</strong> — launches, releases, public beta, API releases.</li>
            <li><strong>Technical</strong> — repository activity, releases, adoption signals.</li>
            <li><strong>Commercial</strong> — customer announcements, production deployments, pricing, partnerships.</li>
            <li><strong>Founder</strong> — founder transitions, public builder activity, direct builder claims.</li>
            <li><strong>Organization</strong> — hiring and team-expansion proxies (e.g. contributor-count growth).</li>
            <li><strong>Market</strong> — community/press attention, ecosystem discussion.</li>
          </ul>
        </Section>

        <Section id="momentum" title="4. Signal Momentum">
          <p>
            Signal Momentum is a deterministic research-organization metric — not an investment score. For each
            eligible signal: <code>weight × evidenceLevelWeight × freshnessDecay(category, age)</code>, summed, then
            scaled by a source-diversity multiplier (1.0–1.4×) and an acceleration multiplier (0.7–1.5×, see §6).
            This formula is <strong>unchanged</strong> from the original build.
          </p>
          <p>Freshness half-lives by category (days until a signal&apos;s contribution decays to 50%):</p>
          <ul className="grid grid-cols-2 gap-x-6 list-disc pl-5">
            {Object.entries(CATEGORY_HALF_LIFE_DAYS).map(([cat, days]) => (
              <li key={cat} className="capitalize">{cat}: {days}d</li>
            ))}
          </ul>
          <p className="text-slate-500">
            These half-lives and multiplier bounds are reasoned starting points, not validated findings — exactly
            the kind of parameter the Backtest Lab exists to eventually stress-test. See{" "}
            <code>lib/analytics/signal-momentum.ts</code>.
          </p>
        </Section>

        <Section id="velocity" title="5. Signal Velocity">
          <p>
            Weighted signal strength in the trailing 30 days, as a flat per-day rate
            (<code>lib/analytics/signal-stats.ts</code>). Unlike momentum, this applies no category decay: it
            answers &quot;how much is happening per day right now,&quot; not &quot;how much enduring weight does
            the evidence carry.&quot; Independently deterministic, never folded into the Momentum formula above.
          </p>
        </Section>

        <Section id="acceleration" title="6. Signal Acceleration">
          <p>
            The ratio of weighted signal activity in the last 30 days to the prior 30 days, bounded to [0.7×, 1.5×]
            so a single old signal falling out of the comparison window doesn&apos;t swing a sparse company wildly.
            1.0× means flat. This is the same acceleration multiplier used inside the Signal Momentum formula
            (§4) — displayed on its own on the company page so it&apos;s visible independently, not only as a
            hidden multiplier.
          </p>
        </Section>

        <Section id="corroboration" title="7. Corroboration">
          <p>
            Independent signal count, distinct source types, and distinct categories with at least one eligible
            signal in the trailing 90 days (<code>lib/analytics/signal-stats.ts</code>). Evidence density — cross-source
            agreement — never a judgment about investment merit, and never collapsed into Signal Momentum.
          </p>
          <p className="text-slate-500">None of Velocity, Acceleration, or Corroboration use follower counts, engagement, or social popularity, and none is assigned by an LLM.</p>
        </Section>

        <Section id="cutoff" title="8. Historical cutoff logic">
          <p>
            Every signal carries three dates: <code>occurredDate</code> (when the underlying thing happened),{" "}
            <code>availabilityDate</code> (the earliest date it was publicly knowable), and <code>ingestedAt</code>{" "}
            (when SignalIQ&apos;s own adapter happened to retrieve it).
          </p>
          <p>
            Historical reconstruction filters strictly on <code>availabilityDate &lt;= cutoff</code>. It never uses{" "}
            <code>occurredDate</code> (a round can close in January and only become public in April — the January
            date would make a February reconstruction look more informed than it really was) and never uses{" "}
            <code>ingestedAt</code> (re-running ingestion today must not change what a 2025 cutoff is allowed to
            see). A signal with no established <code>availabilityDate</code> is excluded from every historical view
            and every backtest window — never defaulted or guessed into eligibility. This rule is pinned by tests in{" "}
            <code>tests/analytics.test.ts</code> and is unchanged from the original build. See{" "}
            <code>lib/analytics/availability.ts</code>.
          </p>
        </Section>

        <Section id="backtesting" title="9. Backtesting">
          <p>
            For each documented milestone, the Backtest Lab reads the 30/60/90-day window immediately before the
            milestone date and compares it against the equal-length window before that (e.g. for 30 days: days
            [-60,-30) vs. [-30,0)). It reports signal count, weighted intensity, velocity, an acceleration ratio
            (window ÷ baseline — reported as &quot;new&quot; rather than an inflated number when the baseline is
            zero), source diversity, category composition, mean evidence quality, and lead time to the earliest
            eligible signal. See <code>lib/analytics/backtest.ts</code>.
          </p>
          <p className="font-medium text-slate-900">This is a historical observational analysis, not a prediction engine.</p>
          <p className="text-slate-500">
            Milestones are themselves sourced facts, never inferred. Four types are populated in this build:{" "}
            <code>product_launch</code> (from a real GitHub release), <code>financing</code>, <code>partnership</code>,
            and <code>acquisition</code> — each verified by directly fetching a dated press release or company blog
            post (see README.md&apos;s &quot;Researched milestones&quot; section for exact sources).
          </p>
        </Section>

        <Section id="limitations" title="10. Limitations">
          <ul className="list-disc pl-5 space-y-1">
            <li>Signal Momentum is not an investment score, and SignalIQ does not make investment recommendations.</li>
            <li>All historical analysis on this platform is observational — a correlation check, not a predictor, and historical correlation here does not establish causality.</li>
            <li>The data is incomplete: market ({categoryCounts.market}) and product ({categoryCounts.product}) signals dominate; commercial ({categoryCounts.commercial}), founder ({categoryCounts.founder}), and organization ({categoryCounts.organization}, from one proxy metric) are real but thin.</li>
            <li>Unknown information remains unknown — never backfilled, never treated as a negative signal.</li>
            <li>The {companies.length}-company corpus is not representative of the entire private-company universe; every company was chosen because it had strong public signal, and (with one acquisition) every one is still active.</li>
            <li>{milestones.length} milestones across {milestoneTypeCount} real types is enough to exercise the backtest harness — not enough for a statistically reliable conclusion.</li>
            <li>The company-relationship graph schema is complete but populated with only 2 verified edges; no graph visualization page was built around that little data.</li>
          </ul>
        </Section>

        <Section id="x-integration" title="11. X sourcing integration">
          <p>
            SignalIQ does not duplicate the author&apos;s existing governed X sourcing engine. It reads that
            engine&apos;s own sanitized, already-published replay output (copied verbatim into{" "}
            <code>data/external/x-sourcing-engine/</code>, full provenance in that directory&apos;s{" "}
            <code>PROVENANCE.md</code>) and maps each candidate&apos;s attribution and artifact type into a
            SignalIQ signal category, preserving the original X post URL and evidence level. <strong>The public
            demo uses this sanitized replay data and makes no live X API calls.</strong>
          </p>
          <p>
            A live connector stub (<code>lib/ingest/x.ts</code>) exists for an optional, credentialed ingestion
            mode using the official X API — inert without <code>X_BEARER_TOKEN</code>, not implemented beyond the
            stub, and never required by the deployed app.
          </p>
          <p>
            Three companies in the corpus (<code>ai-trains-ai</code>, <code>hashcortx</code>, <code>kitbash</code>)
            were discovered this way; each is labeled in the UI as an early-stage, single-signal-chain discovery,
            not a peer of the rest of the corpus.
          </p>
        </Section>
      </div>
    </div>
  );
}
