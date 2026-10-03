import { stableId } from "@/lib/ids";
import type { SignalDraft, SourceRecord } from "@/lib/schemas";

/**
 * GitHub public REST API adapter. Unauthenticated (60 req/hr) is enough for
 * the demo snapshot; set GITHUB_TOKEN in the environment to raise the limit
 * when re-ingesting a larger company set.
 */
const GITHUB_API = "https://api.github.com";

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}`, "User-Agent": "signaliq" } : { "User-Agent": "signaliq" };
}

interface GithubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
}

interface GithubRelease {
  html_url: string;
  tag_name: string;
  name: string | null;
  published_at: string;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/**
 * Total contributor count via the standard GitHub pagination trick: ask for
 * 1 result per page and read the page number out of the `Link: rel="last"`
 * header, rather than paging through every contributor. Real API data (an
 * organization-category proxy), not an estimate.
 */
async function getContributorCount(ownerRepo: string): Promise<number | null> {
  const res = await fetch(`${GITHUB_API}/repos/${ownerRepo}/contributors?per_page=1&anon=false`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const link = res.headers.get("link");
  if (!link) {
    const body = (await res.json()) as unknown[];
    return Array.isArray(body) ? body.length : null;
  }
  const match = link.match(/[?&]page=(\d+)>; rel="last"/);
  return match ? Number(match[1]) : null;
}

export interface GithubIngestResult {
  signals: SignalDraft[];
  sources: SourceRecord[];
}

/**
 * Pulls repo vitals (stars, last push) and recent releases for one repo,
 * emitting a `technical` signal for the repo snapshot and a `product` signal
 * per release. Every emitted signal's availabilityDate is the GitHub
 * `created_at`/`published_at` timestamp itself (availabilityMethod:
 * repository_event) — GitHub's own clock, not our retrieval time.
 */
export async function ingestGithubRepo(companyId: string, ownerRepo: string): Promise<GithubIngestResult> {
  const now = new Date().toISOString();
  const repo = await getJson<GithubRepo>(`${GITHUB_API}/repos/${ownerRepo}`);
  if (!repo) return { signals: [], sources: [] };

  const sources: SourceRecord[] = [];
  const signals: SignalDraft[] = [];

  const repoSourceId = stableId("source", "github", "repo", ownerRepo);
  sources.push({
    id: repoSourceId,
    type: "github",
    url: repo.html_url,
    title: repo.full_name,
    publicationDate: repo.pushed_at.slice(0, 10),
    availabilityMethod: "repository_event",
    retrievedAt: now,
  });
  signals.push({
    id: stableId("signal", "github", "vitals", ownerRepo, repo.pushed_at),
    companyId,
    category: "technical",
    headline: `${repo.full_name}: ${repo.stargazers_count.toLocaleString()} GitHub stars, last pushed ${repo.pushed_at.slice(0, 10)}`,
    sourceId: repoSourceId,
    evidenceLevel: "A",
    occurredDate: repo.pushed_at.slice(0, 10),
    availabilityDate: repo.pushed_at.slice(0, 10),
    availabilityMethod: "repository_event",
    weight: Math.log10(repo.stargazers_count + 10),
  });

  const contributorCount = await getContributorCount(ownerRepo);
  if (contributorCount !== null) {
    signals.push({
      id: stableId("signal", "github", "contributors", ownerRepo, repo.pushed_at),
      companyId,
      category: "organization",
      headline: `${repo.full_name}: ${contributorCount.toLocaleString()} contributors`,
      sourceId: repoSourceId,
      evidenceLevel: "A",
      occurredDate: repo.pushed_at.slice(0, 10),
      availabilityDate: repo.pushed_at.slice(0, 10),
      availabilityMethod: "repository_event",
      weight: Math.log10(contributorCount + 2),
    });
  }

  const releases = (await getJson<GithubRelease[]>(`${GITHUB_API}/repos/${ownerRepo}/releases?per_page=10`)) ?? [];
  for (const rel of releases) {
    if (!rel.published_at) continue;
    const date = rel.published_at.slice(0, 10);
    const sourceId = stableId("source", "github", "release", ownerRepo, rel.tag_name);
    sources.push({
      id: sourceId,
      type: "github",
      url: rel.html_url,
      title: `${repo.full_name} ${rel.tag_name}`,
      publicationDate: date,
      availabilityMethod: "repository_event",
      retrievedAt: now,
    });
    signals.push({
      id: stableId("signal", "github", "release", ownerRepo, rel.tag_name),
      companyId,
      category: "product",
      headline: `${repo.full_name} released ${rel.name ?? rel.tag_name}`,
      sourceId,
      evidenceLevel: "A",
      occurredDate: date,
      availabilityDate: date,
      availabilityMethod: "repository_event",
      weight: 1,
    });
  }

  return { signals, sources };
}
