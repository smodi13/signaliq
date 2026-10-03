# SignalIQ — interview demo guide

A script to practice, not read verbatim. Say it in your own words.

## 30-second version

"SignalIQ tracks public signals around emerging tech companies — GitHub
activity, Hacker News discussion, even a founder's own X posts — and keeps
every source attached. The thing that makes it different is it can answer
'what did we actually know about this company six months ago,' not just
'what do we know now.' I also built a backtest that checks whether those
signals tended to show up before real funding rounds and launches."

## 60-second version

"The problem: by the time a company shows up in Crunchbase, it's not a
discovery anymore — it's already obvious. SignalIQ tries to catch the signal
earlier: GitHub releases, contributor growth, Hacker News traction, and
founder activity surfaced through an X sourcing engine I built separately.

Every signal carries a source URL and an evidence level — nothing's an
unexplained score. The feature I'm proudest of is 'What Did We Know Then?' —
pick a company, drag a date slider back, and every signal, source, and
milestone that wasn't public yet disappears, and the momentum score
recomputes from only what was actually knowable then. That's backed by real
tests that make sure future information can never leak into a past view.

Then there's a backtest lab that checks, across 30 real milestones — funding
rounds, an acquisition — whether signal activity tended to cluster in the 90
days before. It's labeled clearly as observational, not predictive — I'm not
claiming to forecast anything."

## 3-minute version (the full walkthrough)

**Opening (20s)**
"This is SignalIQ — a technology intelligence tool for private-market
research. The core idea: find signal before it's obvious, and be able to
prove, later, that you actually had it before the milestone — not after."

**Discover (30s)**
Open `/discover`. "This is the daily screen — every signal across 25 real
companies, each one tied to a cited source. I can filter to just commercial
signals" — *filter to Commercial* — "and here's something real: a TechCrunch
article confirming Supabase's actual customer growth, dated, sourced,
linked. Nothing here is a guess."

**Company page (30s)**
Click into a company (E2B works well — real founder, real funding, dense
signal history). "Here's the full picture: Signal Momentum, Velocity,
Acceleration, Evidence Coverage up top, then the actual signal history below.
Notice it also tells me what it *doesn't* know — no commercial signals found,
say — instead of guessing or hiding the gap."

**What Did We Know Then? (45s)**
Scroll to the time-travel panel. "This is the differentiator. I set the date
to right before their Series A." — *drag the date back* — "Watch — the
signal count drops, momentum recomputes from scratch, and that milestone
moves from 'occurred' to 'not yet occurred.' Nothing after this date is
visible. That's enforced by tests, not just the UI hiding things."

**Backtest (30s)**
Open `/backtest`. "This is the same idea at scale — for every milestone I've
tracked, did signal activity actually cluster beforehand? Here's the
lead-time distribution and the category breakdown. I'm explicit that this is
observational — 30 milestones isn't a statistically significant sample, and
I say that on the page itself."

**Evidence (15s)**
Click into one signal's source link. "Every claim traces to a real URL —
this is the actual GitHub release / press article / X post."

**Closing (20s)**
"The bigger question this is really asking: can you build an evidence
pipeline where historical claims are provably honest — where you can't
accidentally let hindsight leak into a past view? That's a discipline I
think matters a lot more broadly than just VC sourcing."

## Likely follow-up questions

### Technical
- **"How do you prevent future data from leaking into a historical view?"**
  Three separate dates per signal — `occurredDate`, `availabilityDate`,
  `ingestedAt` — and the cutoff filter only ever compares against
  `availabilityDate`. Pinned by tests in `tests/analytics.test.ts`, including
  a test that re-ingesting today doesn't change what a 2025 cutoff can see.
- **"Why not use an LLM to score the signals?"**
  Deliberately deterministic — same inputs always produce the same output,
  auditable, and reproducible without an API key. An LLM summary layer could
  sit on top later, but it would never be allowed to set the score itself.
- **"How is the demo deployed without API costs?"**
  One ingestion script makes all the live calls and writes a static JSON
  snapshot; the deployed app only ever reads that file. No `fetch()` call
  exists anywhere in the page code.
- **"What's the X integration actually doing?"**
  It replays the sanitized output of a governed X sourcing engine I built
  separately — no live X API calls in the demo. I can explain the full
  query/evidence-level/attribution pipeline behind that engine if asked.

### Investment research
- **"Is this actually predictive?"**
  No — and I say that explicitly on the Backtest page. It's a correlation
  check across a small, non-random sample. I built it to show the mechanism,
  not to claim a finding.
- **"How would you make this useful to a real analyst?"**
  Bigger corpus researched to the same standard, wire up the RSS/company-blog
  adapter, and add the company-relationship graph once there's enough
  verified relationship data to make it honest rather than decorative.
- **"What's the actual edge over Crunchbase/PitchBook?"**
  Those tools mostly catch a company after it files or announces. This
  tracks activity before that — GitHub velocity, contributor growth, direct
  builder posts — and, more importantly, can reconstruct what was knowable
  at a past date, which none of them do.

### Limitations
- **"What's the biggest gap in the data?"**
  Signal-category coverage is uneven — market and product dominate;
  commercial and founder signals are real but thin, because I only record
  what I can independently verify, not what's plausible.
- **"Why only 25 companies?"**
  Quality over quantity — every one is either hand-verified live against
  GitHub/HN or came through the X sourcing engine with a checked artifact.
  Padding the count with unverifiable records would have been easy and
  dishonest.
- **"Why no company relationship graph?"**
  Only two founder relationships are actually verified. A graph UI with two
  real edges is decorative, not useful — so I left it out and documented
  why, rather than faking density.
