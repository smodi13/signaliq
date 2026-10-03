# SignalIQ architecture

```
  PUBLIC SOURCES
  ───────────────────────────────────────────
   GitHub          Hacker News        X Sourcing Engine
   (releases,      (Algolia           (sanitized replay —
   contributors)    search)            see PROVENANCE.md)
      │               │                      │
      └───────────────┴──────────┬───────────┘
                                  ▼
                        SOURCE RECORDS
              (url, type, publicationDate, availabilityMethod)
                                  │
                                  ▼
                          EVIDENCE CLAIMS *
                    (provenance, observed date)
                                  │
                                  ▼
                             SIGNALS
        (6 categories · evidence level A–D · availabilityDate)
                                  │
                                  ▼
                    DETERMINISTIC ANALYTICS
         Signal Momentum · Velocity · Acceleration · Corroboration
                      (lib/analytics/*, no LLM)
                                  │
                      ┌───────────┴───────────┐
                      ▼                       ▼
          HISTORICAL RECONSTRUCTION      BACKTESTING
          "What Did We Know Then?"    30/60/90-day windows
          (availabilityDate <= cutoff,  vs. equal-length baseline
           never occurredDate/ingestedAt)
                      │                       │
                      └───────────┬───────────┘
                                  ▼
                    INVESTOR RESEARCH INTERFACE
              Discover · Companies · Market Map · Backtest
                        (Next.js App Router)
```

\* Schema-complete (`lib/schemas/evidence.ts`) but not populated as a
separate layer in this build — signals reference `SourceRecord`s directly.
See `/methodology` for why.

## The one rule that makes historical reconstruction honest

Every `Signal` carries three dates, and only one of them is allowed to gate
what a historical view can see:

| Date | Means | Used for historical cutoff? |
|---|---|---|
| `occurredDate` | When the underlying thing happened | **No** |
| `availabilityDate` | When it became *publicly knowable* | **Yes — the only one** |
| `ingestedAt` | When SignalIQ's own adapter happened to read it | **No** |

`lib/analytics/availability.ts` enforces `availabilityDate <= cutoff` and
nothing else. `tests/analytics.test.ts` pins the two failure directions this
guards against: never let occurrence-date leak the future in, and never let
re-ingestion-date erase genuinely historical evidence.

## Where the network boundary is

`scripts/ingest.ts` is the **only** code path in the entire codebase that
makes a live network call. It writes `data/snapshot/*.json`; every page in
`app/` reads exclusively from that snapshot via `lib/data.ts`. This is what
makes the deployed app free to run and immune to upstream rate limits — and
it's enforced structurally, not by convention: there is no `fetch()` call
anywhere under `app/` or `components/`.

## Companion metrics, not one score

Signal Momentum, Signal Velocity, Signal Acceleration, and Corroboration are
four **independent** deterministic readings (`lib/analytics/signal-momentum.ts`,
`lib/analytics/signal-stats.ts`) — none is derived from or folded into another,
and none is assigned by a model. See `/methodology` for each formula.
