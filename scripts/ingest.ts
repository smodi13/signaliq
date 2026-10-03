/**
 * Rebuilds the demo snapshot from live public sources.
 *
 *   npx tsx scripts/ingest.ts
 *
 * This is the ONLY place that makes live network calls. The deployed app
 * reads exclusively from data/snapshot/*.json — see docs/architecture note
 * in README. Re-run this script to refresh the snapshot; it is deterministic
 * given the same upstream API responses (stable ids, no randomness).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { ingestGithubRepo } from "@/lib/ingest/github";
import { ingestHackerNews } from "@/lib/ingest/hn";
import { ingestXShowcaseCandidate } from "@/lib/ingest/x-showcase";
import { ingestAll } from "@/lib/ingest/boundary";
import { stableId } from "@/lib/ids";
import type { Company, Milestone, Signal, SourceRecord } from "@/lib/schemas";
import { SEED_COMPANIES, toCompanyRecord } from "./seed-companies";
import { RESEARCHED_MILESTONES, researchedSourceId } from "./researched-milestones";
import { RESEARCHED_FOUNDERS, RESEARCHED_RELATIONSHIPS } from "./researched-founders";
import type { Founder } from "@/lib/schemas";

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}`, "User-Agent": "signaliq" } : { "User-Agent": "signaliq" };
}

async function fetchReleaseByTag(ownerRepo: string, tag: string) {
  const res = await fetch(`https://api.github.com/repos/${ownerRepo}/releases/tags/${encodeURIComponent(tag)}`, {
    headers: githubHeaders(),
  });
  if (!res.ok) return null;
  return (await res.json()) as { html_url: string; published_at: string; tag_name: string };
}

async function main() {
  const companies: Company[] = [];
  const sources: SourceRecord[] = [];
  const signals: Signal[] = [];
  const milestones: Milestone[] = [];

  for (const seed of SEED_COMPANIES) {
    console.log(`Ingesting ${seed.name}...`);
    const company = toCompanyRecord(seed);

    const [gh, hn] = await Promise.all([
      ingestGithubRepo(company.id, seed.githubRepo),
      ingestHackerNews(company.id, seed.hnQuery),
    ]);

    const xResult = seed.xShowcaseSlug ? ingestXShowcaseCandidate(company.id, seed.xShowcaseSlug) : { signals: [], sources: [] };

    const rawSources = [...gh.sources, ...hn.sources, ...xResult.sources];
    const rawSignals = [...gh.signals, ...hn.signals, ...xResult.signals];

    company.sourceIds = rawSources.map((s) => s.id);
    companies.push(company);
    sources.push(...rawSources);
    signals.push(...ingestAll(rawSignals));

    if (seed.milestoneRelease) {
      const release = await fetchReleaseByTag(seed.githubRepo, seed.milestoneRelease.tag);
      if (release) {
        const date = release.published_at.slice(0, 10);
        const sourceId = stableId("source", "github", "milestone", seed.githubRepo, release.tag_name);
        sources.push({
          id: sourceId,
          type: "github",
          url: release.html_url,
          title: `${seed.name} ${release.tag_name}`,
          publicationDate: date,
          availabilityMethod: "repository_event",
          retrievedAt: new Date().toISOString(),
        });
        milestones.push({
          id: stableId("milestone", seed.githubRepo, release.tag_name),
          companyId: company.id,
          type: "product_launch",
          headline: seed.milestoneRelease.headline,
          date,
          sourceId,
        });
      } else {
        console.warn(`  milestone release ${seed.milestoneRelease.tag} not found, skipping`);
      }
    }

    // GitHub unauthenticated rate limit is 60/hr; be polite between companies.
    await new Promise((r) => setTimeout(r, 500));
  }

  // Hand-researched milestones (financing, partnership, acquisition, ...) —
  // see researched-milestones.ts for sourcing standard. Each one resolves to
  // a seed company by slug id, so a typo here fails loudly rather than
  // silently attaching to nothing.
  const companyIdBySlug = new Map(SEED_COMPANIES.map((s) => [s.id, s]));
  for (const entry of RESEARCHED_MILESTONES) {
    if (!companyIdBySlug.has(entry.milestone.companyId)) {
      throw new Error(`researched-milestones.ts: unknown companyId ${entry.milestone.companyId}`);
    }
    sources.push(entry.source);
    milestones.push(entry.milestone);
    signals.push(...ingestAll(entry.signals));
  }

  // Founder facts incidentally confirmed during the researched-milestones
  // pass (two companies only — see researched-founders.ts).
  const founders: Founder[] = RESEARCHED_FOUNDERS;
  const browserbase = companies.find((c) => c.id === stableId("company", "browserbase"));
  if (browserbase) {
    browserbase.foundedYear = 2024;
    browserbase.foundedYearProvenance = "source_reported";
    browserbase.sourceIds.push(researchedSourceId("browserbase", "https://www.browserbase.com/blog/series-b-and-beyond"));
  }

  // The same public source (e.g. one Hacker News story) can legitimately be
  // evidence for more than one company's HN query; dedupe by id so it's
  // stored once rather than once per company that matched it.
  const dedupedSources = [...new Map(sources.map((s) => [s.id, s])).values()];

  mkdirSync("data/snapshot", { recursive: true });
  const snapshotDate = new Date().toISOString().slice(0, 10);
  writeFileSync("data/snapshot/companies.json", JSON.stringify(companies, null, 2));
  writeFileSync("data/snapshot/sources.json", JSON.stringify(dedupedSources, null, 2));
  writeFileSync("data/snapshot/signals.json", JSON.stringify(signals, null, 2));
  writeFileSync("data/snapshot/milestones.json", JSON.stringify(milestones, null, 2));
  writeFileSync("data/snapshot/founders.json", JSON.stringify(founders, null, 2));
  writeFileSync("data/snapshot/relationships.json", JSON.stringify(RESEARCHED_RELATIONSHIPS, null, 2));
  writeFileSync("data/snapshot/meta.json", JSON.stringify({ snapshotDate, generatedAt: new Date().toISOString() }, null, 2));

  console.log(
    `\nWrote snapshot: ${companies.length} companies, ${dedupedSources.length} sources, ${signals.length} signals, ${milestones.length} milestones, ${founders.length} founders.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
