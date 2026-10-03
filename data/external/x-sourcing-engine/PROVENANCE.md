# External data: X Sourcing Engine (sanitized replay)

These three files are copied verbatim, unmodified, from the public sanitized
showcase of the author's existing governed X sourcing engine:

- Source repository: https://github.com/smodi13/x-sourcing-engine-showcase
- Live demo: https://x-sourcing-engine.vercel.app
- Local reference copy inspected: `~/x-sourcing-engine-showcase/public/demo-data/`
- `generated_at` in every file: `2026-07-22T17:41:36Z` — this is when the
  sanitized output was built from the completed run, not necessarily when any
  individual X post was made.

## What these files are

`candidates.json` — 122 sanitized candidates from a completed, budget-governed
X API sourcing run (`recent_search_window_days: 7`, official `search/recent`
endpoint, no scraping — see `run-summary.json`). Each candidate carries an
engine-derived classification, a public X post permalink, and public artifact
URLs (GitHub repos, product sites). Raw post text, author names, usernames,
and author ids were stripped during sanitization — see `candidates.json`'s own
`notes` field.

`methodology.json` / `run-summary.json` — the run's own methodology and
summary statistics, for citation on SignalIQ's methodology page.

## Why no per-post date

The sanitized candidates carry no per-post timestamp (stripped along with
other potentially re-identifying fields during sanitization). The only
defensible date is the 7-day recent-search window ending at generation time.
SignalIQ's ingest adapter (`lib/ingest/x-showcase.ts`) therefore assigns every
imported signal `availabilityDate: 2026-07-22` (the generation date — a
conservative upper bound, since the underlying post was necessarily made
*before* this date, not after) with `availabilityMethod: manual_verified` and
an explicit `note` stating this derivation. This fails in the safe direction
for historical replay: a cutoff before 2026-07-22 will correctly exclude these
signals rather than risk admitting one before it was actually knowable.

## What SignalIQ does NOT do with this data

- Does not re-run or call the X API.
- Does not re-identify any author.
- Does not treat `research_score` or `lead_disposition` as SignalIQ's own
  Signal Momentum — those are the X engine's own deterministic outputs, kept
  as source-trail context only.
