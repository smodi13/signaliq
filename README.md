# SignalIQ

**Technology Intelligence for Private Markets.** Find the companies before they become obvious.

> Practicing a walkthrough? See `docs/INTERVIEW-DEMO.md` for a 30s/60s/3-minute script. For the
> system diagram, see `docs/ARCHITECTURE.md`.

## Why I built this

I kept running into the same problem from different angles. **OriginationIQ** was my attempt at
provenance-backed company screening — the thing I took from it wasn't the screening model, it was
the discipline: never let a value appear on screen without a traceable source, and never let
"unknown" quietly become "no." Working on OriginationIQ's historical-cutoff rule in particular — and
getting it wrong twice before landing on the right one — taught me how easy it is to accidentally
leak hindsight into something that's supposed to reconstruct the past.

Then I built a **governed X sourcing engine** for a different project: finding real builders on X
before they're a company anyone's heard of, with a deterministic, budget-controlled pipeline and an
evidence-level standard (A–D) for how directly a claim was verified. That taught me the discovery
side — where early signal actually lives, and how to separate a founder's real claim from noise.

SignalIQ is what happens when I stopped treating those as two separate projects. It's a second-
generation product, not a rebuild of either:

- From **OriginationIQ**: the provenance vocabulary, the historical-cutoff rule (with the same two
  withdrawn/corrected failure modes), and the principle that unknown is never converted into a
  negative. SignalIQ's `lib/analytics/availability.ts` and `lib/schemas/common.ts` are a direct,
  tested port.
- From **the X sourcing engine**: the deterministic-scoring, evidence-level discipline SignalIQ's
  own adapters follow — and it's a literal ingestion source now, via a sanitized-replay adapter (see
  "X integration" below).
- **SignalIQ** combines both into one research surface: track signals across six categories,
  preserve where every one came from, reconstruct what was knowable on a past date, and test
  whether signals clustered before documented milestones.

## The problem

Structured deal databases mostly catch a company *after* it raises a round or gets press coverage —
by then it's no longer obvious. Meaningful signal (shipping velocity, developer adoption, builder
credibility, early commercial traction) is visible in public sources well before that. SignalIQ
tracks that signal directly, preserves exactly where every value came from, and lets an analyst ask
a question most tools can't answer honestly: *what did we actually know about this company on a
given past date?*

It is a research tool, not a scoring or ranking product. Nothing here is investment advice, and no
output is a recommendation.

## What it does

- **Signal tracking** across six categories (product, technical, commercial, founder,
  organization, market), every signal tied to a cited source.
- **What Did We Know Then?** — SignalIQ's signature feature. Pick a company and an as-of date; the
  app hides every signal, source, and milestone not yet publicly knowable on that date, recomputes
  Signal Momentum, Signal Velocity, Corroboration, and Evidence Coverage from only the eligible
  subset, and lets you jump straight to milestone or major-signal dates on the timeline. A separate,
  visually distinct "compare to today" panel is the only place later information appears.
  (`/companies/[id]`, `components/TimeTravelPanel.tsx`)
- **Signal Discovery** (`/discover`) — a filterable analyst feed (category, company, source type,
  evidence level, date range, new-vs-known) where every row states *why it surfaced*, links its
  evidence and source, and links to the company page. Not an unexplained score, not a generic news
  feed.
- **Backtest Lab** (`/backtest`) — for each of 30 documented milestones (4 types: product launch,
  financing, partnership, acquisition), measures signal count, weighted intensity, velocity,
  acceleration vs. baseline, source diversity, category composition, evidence quality, and lead
  time in the 30/60/90 days before it. Includes an aggregate intensity chart, a lead-time
  distribution histogram, a category-composition breakdown, and per-company milestone timelines.
  Explicitly labeled "Historical observational analysis. Not predictive performance."
- **Signal Momentum** — a deterministic, documented research-organization metric (unchanged
  formula from the original build — see "Signal Momentum" below for what's new alongside it).
- **Signal Velocity, Corroboration, Evidence Coverage** — three companion metrics, each
  independently deterministic and documented, never folded into the momentum formula.
- **Market Map** (`/market-map`) — the real company set grouped by theme, filterable by signal
  type, minimum evidence level, date, and minimum momentum. A landscape view, not a ranking.
- **Research Queue** (`/research`) — NEW → RESEARCHING → VERIFIED → WATCH → ARCHIVED, with
  analyst notes and *data-driven* research-gap flags (computed from what's actually missing for
  that company, not a static list), persisted to the browser's `localStorage`.
- **Methodology** (`/methodology`) — documents every formula, data source, and limitation.
- **Exports** — per-company signal timeline CSV, source trail CSV, a print-optimized research
  brief, and a backtest results CSV.

## Architecture

```
public source adapters (live)  →  normalized Signal/SourceRecord records
  GitHub · Hacker News · X (sanitized replay)      (lib/ingest/*, scripts/ingest.ts)
        │
        ▼
   data/snapshot/*.json   ←── the ONLY thing the deployed app reads
        │
        ▼
  deterministic analytics (lib/analytics/*)  →  Next.js App Router UI (app/*)
```

The deployed app makes **no live API calls** and needs no environment variables.
`scripts/ingest.ts` is the one place that talks to the network; it writes a committed JSON
snapshot that the app reads at build and render time. For the full diagram, including the
historical-cutoff and companion-metrics detail, see `docs/ARCHITECTURE.md`.

| Layer | Location |
| --- | --- |
| Canonical schemas (Zod, `z.infer`-derived types) | `lib/schemas/` |
| Ingestion adapters | `lib/ingest/` |
| Ingestion boundary (stamps `ingestedAt`, the only path to a stored `Signal`) | `lib/ingest/boundary.ts` |
| Deterministic analytics | `lib/analytics/` |
| Snapshot reader | `lib/data.ts` |
| Pages | `app/` |
| Shared UI | `components/` |

## Data sources

- **GitHub public REST API** — repo vitals, releases, and contributor counts, unauthenticated
  (set `GITHUB_TOKEN` to raise the rate limit for a larger re-ingest). `lib/ingest/github.ts`
- **Hacker News (Algolia API)** — story search, no key required. `lib/ingest/hn.ts`
- **X (sanitized replay)** — normalizes the author's existing governed X sourcing engine's
  sanitized output into SignalIQ's Signal/SourceRecord shape. See "X integration" below.
  `lib/ingest/x-showcase.ts`
- **X (live, optional)** — connector stub, inert without `X_BEARER_TOKEN`. Not implemented beyond
  the stub; see `lib/ingest/x.ts`.
- **Public RSS/Atom feeds** — implemented, not wired into the current seed set. `lib/ingest/rss.ts`
- **Hand-researched milestones and commercial signals** — financing, acquisition, and partnership
  events plus the commercial-traction facts stated in the same articles, each verified by directly
  fetching the live, dated source (not by searching and trusting a snippet). `scripts/researched-milestones.ts`

### X integration

SignalIQ does not duplicate the governed X sourcing engine. `lib/ingest/x-showcase.ts` reads the
engine's own sanitized, already-published replay output (copied verbatim into
`data/external/x-sourcing-engine/`, provenance documented in that directory's `PROVENANCE.md`) and
maps each candidate's `announcement_attribution` and `artifact_types` into a SignalIQ category
(direct builder claim → `founder`; GitHub artifact → `technical`), preserving the original X post
URL, evidence level, and attribution type. Three candidates with a verified, live-checked GitHub
artifact were promoted to tracked companies (`ai-trains-ai`, `hashcortx`, `kitbash`) — all three are
honestly labeled in the UI as early/pre-seed, single-signal-chain discoveries, structurally
different from the rest of the corpus.

**Dating caveat:** the sanitized output carries no per-post timestamp (stripped during
sanitization along with other potentially re-identifying fields). Every imported signal is dated to
the run's generation timestamp (2026-07-22) — a conservative upper bound, since the underlying post
necessarily predates it — with `availabilityMethod: manual_verified` and an explicit note. This
fails in the safe direction for historical replay (see `data/external/x-sourcing-engine/PROVENANCE.md`).

**Two modes, by design:**
- *Replay/snapshot mode* (what ships): the sanitized file above, no live API calls, no credential.
- *Analyst ingestion mode* (not implemented in this build): `lib/ingest/x.ts` is a stub for a live
  connector using the official X API and the same governed methodology (query validator, budget
  controls, dry-run-first) as the existing engine, inert without `X_BEARER_TOKEN`. The public demo
  never requires it.

## Evidence methodology

Every value carries one of six provenance tags (`verified_fact`, `source_reported`,
`analyst_assessment`, `computed`, `model_generated`, `unknown`) and every signal carries an
evidence level (A–D). Full detail — including the historical-cutoff rule, Signal Momentum formula,
and the three companion metrics — is on **`/methodology`** and in source comments throughout
`lib/analytics/`.

The historical cutoff rule, in short: every signal has an `availabilityDate` (when it was publicly
knowable) separate from `occurredDate` (when the thing happened) and `ingestedAt` (when SignalIQ's
adapter happened to read it). Historical reconstruction filters strictly on `availabilityDate`,
never the other two — see `lib/analytics/availability.ts` and `tests/analytics.test.ts` for the
leakage tests that pin this down, unchanged from the original build.

## Signal Momentum, and what's new alongside it

Signal Momentum's formula is **unchanged** from the original build: per-category freshness decay ×
evidence-level weight × signal weight, scaled by a source-diversity multiplier and an
acceleration multiplier. See `lib/analytics/signal-momentum.ts` — not modified in this pass, per
the instruction to review before changing and document any change. None was made.

Three new, independently deterministic companion metrics were added (`lib/analytics/signal-stats.ts`),
not folded into the momentum formula:
- **Signal Velocity** — weighted signal strength in the trailing 30 days, as a flat per-day rate
  (no category decay — a rate-of-activity reading, not a momentum reading).
- **Corroboration** — independent signal count, distinct source types, and distinct categories in
  the trailing 90 days. Evidence density, not a verdict.
- **Evidence Coverage** — how many of the six signal categories have at least one eligible signal
  right now (e.g. 5/6). A category with no evidence is reported as missing, never as a penalty.

None of these use follower counts, engagement, or social popularity. None is assigned by an LLM.
All are reproducible from `data/snapshot/*.json` alone.

## Dataset (this snapshot)

- **25 companies** across 5 themes (AI infrastructure, developer tools, AI applications, vertical
  AI, fintech infrastructure) — 22 found by hand and verified live against the GitHub/HN APIs, 3
  discovered via the X sourcing engine replay.
- **637 sources**: 260 GitHub, 365 Hacker News, 5 press, 4 company blog, 3 X post.
- **644 signals** across all six categories: 215 product, 25 technical, 371 market, 26
  organization, 4 commercial, 3 founder. (Coverage is real but uneven — see Limitations.)
- **30 milestones**, 4 types: 21 product launch (GitHub releases), 7 financing, 1 partnership, 1
  acquisition (Cloudflare's acquisition of Replicate).
- **2 founder records** (Browserbase's Paul Klein, E2B's Vasek Mlejnsky), surfaced incidentally by
  the milestone research pass, not a dedicated founder research effort.
- **2 company-relationship edges** (`founder_of`, for the two founders above) — see "Company
  relationships" below for why there's no graph page.

### Researched milestones (research log)

The financing/partnership/acquisition milestones and the four commercial signals were researched on
2026-10-02 via live web search and direct fetches of the resulting article/blog/press-release URLs
(not from search-result snippets). See `scripts/researched-milestones.ts` for the full list with
exact source URLs and publication dates confirmed by fetching each page directly.

## Company relationships

`lib/schemas/entities.ts` defines a complete `CompanyRelationship` schema (founder, investor,
customer, competitor, technology dependency, etc.), but this build populates only the two edges
the research pass actually verified (`founder_of`, for Paul Klein → Browserbase and Vasek Mlejnsky
→ E2B). **No graph visualization page was built.** A graph UI around two edges would be decorative,
not informative — the honest move with this little real relationship data is to show it inline
(the Founders section on each company page) and leave the dedicated graph page out until a research
pass actually produces enough verified edges (investors, customers, competitors) to make one worth
building.

## Local setup

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Analytics + data-quality test suite (`node:test`) |
| `npm run ingest` | Rebuild `data/snapshot/` from live sources |

## Running a backtest / refreshing data

```bash
cp .env.example .env     # optional: add GITHUB_TOKEN to raise the rate limit
npm run ingest             # live network calls, writes data/snapshot/*.json
npm run dev                  # backtest results recompute automatically from the new snapshot
```

## Tests and build results (this pass)

- `npm run test` — 21/21 passing: cutoff-leakage, momentum decay, backtest window exclusion,
  signal velocity/corroboration/evidence-coverage, and 7 data-quality tests run against the real
  committed snapshot (referential integrity, no duplicate ids, no placeholder strings, occurredDate
  never postdates availabilityDate). One of those data-quality tests caught a real cross-company
  signal-id collision during this pass — fixed in `lib/ingest/hn.ts`, not just documented.
- `npm run typecheck` — clean, strict mode.
- `npm run lint` — clean.
- `npm run build` — clean production build, all routes static or SSG (25 company detail pages
  prerendered via `generateStaticParams`).
- Manually exercised in a live browser after this pass: home dashboard with the expanded dataset;
  Discover's category/company/evidence/date filters (verified the "commercial" filter returns
  exactly the 4 real researched commercial signals); a company detail page's full section order;
  the time-travel scrubber and "jump to milestone" chips (verified momentum recomputing from 33.7
  to 2.1 and a milestone correctly moving from "occurred" to "not yet occurred" when the cutoff
  moved before it); Backtest's charts and disclaimer banner; Market Map's momentum-range filter
  (verified it correctly narrowed 25 → 12 companies); CSV export (verified file contents and
  correct comma-quoting).

## Deployment (Vercel)

```bash
npm run build     # verify a clean production build first
vercel --prod
```

No environment variables are required for the public demo — `GITHUB_TOKEN` and `X_BEARER_TOKEN`
only matter for `npm run ingest`, which is never run by the deployed app itself.

## Known limitations

Stated in full, and intellectually honestly, on `/methodology` and `/backtest`. Summary:

- **Uneven signal-category coverage.** Market (371) and product (215) dominate; commercial (4),
  founder (3) are present but thin, and organization (26) comes entirely from one proxy metric
  (GitHub contributor counts). This reflects which adapters are wired up, not the real-world
  distribution of any company's activity.
- **Small, non-representative milestone set.** 30 milestones across 4 types is enough to exercise
  a real backtest harness with real type diversity — not enough for a statistically reliable
  conclusion, and historical correlation here does not establish causality.
- **Selection and survivorship bias.** Every company was chosen because it had strong public
  signal; every one (but the one acquisition) is still active. Companies that failed before being
  discovered are structurally absent.
- **Public data is incomplete.** Founding year, HQ, and total capital raised are `unknown` for
  most of the corpus — not estimated, not guessed.
- **The three X-sourced companies are not peers of the rest of the corpus.** Single-signal-chain,
  early-stage discoveries, labeled as such in the UI.
- **No company relationship graph UI** — see "Company relationships" above.
- **Unknown is not negative**, everywhere in this product. A 0/6 evidence-coverage reading says
  "no public evidence surfaced yet," never "this company has no activity."
