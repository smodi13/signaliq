import { stableId } from "@/lib/ids";
import type { Milestone, SignalDraft, SourceRecord, SignalCategory, EvidenceLevel } from "@/lib/schemas";

/**
 * Hand-researched milestones and signals that GitHub-release ingestion can't
 * produce: financing, acquisition, partnership, and commercial-traction
 * evidence. Each entry below was verified by fetching the live, dated source
 * directly (via WebSearch + WebFetch) during this research pass — see
 * README.md's "Researched milestones" section for the date this was done.
 *
 * Standard: the source's own publication date is the availabilityDate
 * (availabilityMethod: intrinsic_timestamp — a press release or company blog
 * post's own dateline, confirmed by fetching the page). No milestone or
 * signal here is inferred, estimated, or backfilled from general knowledge;
 * every one has a resolvable URL that was actually fetched, not just
 * searched for.
 */

interface MilestoneSpec {
  companySlug: string;
  type: Milestone["type"];
  headline: string;
  date: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: SourceRecord["type"];
  // Additional signals grounded in the SAME fetched source (e.g. a funding
  // article that also states real customer traction).
  extraSignals?: { category: SignalCategory; headline: string; evidenceLevel: EvidenceLevel; weight?: number }[];
}

function build(spec: MilestoneSpec): { milestone: Milestone; source: SourceRecord; signals: SignalDraft[] } {
  const companyId = stableId("company", spec.companySlug);
  const sourceId = stableId("source", "researched", spec.companySlug, spec.sourceUrl);
  const source: SourceRecord = {
    id: sourceId,
    type: spec.sourceType,
    url: spec.sourceUrl,
    title: spec.sourceTitle,
    publicationDate: spec.date,
    availabilityMethod: "intrinsic_timestamp",
    retrievedAt: new Date().toISOString(),
  };
  const milestone: Milestone = {
    id: stableId("milestone", "researched", spec.companySlug, spec.sourceUrl),
    companyId,
    type: spec.type,
    headline: spec.headline,
    date: spec.date,
    sourceId,
  };
  const signals: SignalDraft[] = (spec.extraSignals ?? []).map((s, i) => ({
    id: stableId("signal", "researched", spec.companySlug, spec.sourceUrl, String(i)),
    companyId,
    category: s.category,
    headline: s.headline,
    sourceId,
    evidenceLevel: s.evidenceLevel,
    occurredDate: spec.date,
    availabilityDate: spec.date,
    availabilityMethod: "intrinsic_timestamp",
    weight: s.weight ?? 1,
  }));
  return { milestone, source, signals };
}

const SPECS: MilestoneSpec[] = [
  {
    companySlug: "supabase",
    type: "financing",
    headline: "Supabase raised a $500M Series F at a $10B pre-money valuation, led by GIC",
    date: "2026-06-05",
    sourceTitle: "Supabase doubles valuation to $10B in 8 months",
    sourceUrl: "https://techcrunch.com/2026/06/05/supabase-doubles-valuation-to-10b-in-8-months/",
    sourceType: "press",
    extraSignals: [
      {
        category: "organization",
        headline: "Supabase reports nearly 10 million developers building on the platform, driven by AI adoption",
        evidenceLevel: "B",
      },
    ],
  },
  {
    companySlug: "weaviate",
    type: "partnership",
    headline: "Ricoh announced a strategic investment and partnership with Weaviate via the RICOH Innovation Fund",
    date: "2026-06-16",
    sourceTitle: "Ricoh invests in AI-native vector database startup Weaviate through the RICOH Innovation Fund",
    sourceUrl: "https://www.ricoh.com/release/2026/0616_1",
    sourceType: "press",
  },
  {
    companySlug: "qdrant",
    type: "financing",
    headline: "Qdrant raised a $50M Series B led by AVP to build composable vector search infrastructure",
    date: "2026-03-12",
    sourceTitle: "We Raised $50M to Build Composable Vector Search as Core Infrastructure",
    sourceUrl: "https://qdrant.tech/blog/series-b-announcement/",
    sourceType: "company_blog",
  },
  {
    companySlug: "replicate",
    type: "acquisition",
    headline: "Cloudflare announced it will acquire Replicate to build an AI cloud for developers",
    date: "2025-11-17",
    sourceTitle: "Cloudflare to Acquire Replicate to Build the Most Seamless AI Cloud for Developers",
    sourceUrl:
      "https://www.cloudflare.com/press/press-releases/2025/cloudflare-to-acquire-replicate-to-build-the-most-seamless-ai-cloud-for-developers/",
    sourceType: "press",
    extraSignals: [
      {
        category: "product",
        headline: "Replicate's 50,000+ production-ready AI models are being integrated into Cloudflare Workers",
        evidenceLevel: "A",
      },
    ],
  },
  {
    companySlug: "modal",
    type: "financing",
    headline: "Modal raised a $80M+ Series B led by Lux Capital at a $1.1B post-money valuation",
    date: "2025-09-29",
    sourceTitle: "Announcing our $87M Series B",
    sourceUrl: "https://modal.com/blog/announcing-our-series-b",
    sourceType: "company_blog",
  },
  {
    companySlug: "browserbase",
    type: "financing",
    headline: "Browserbase raised a $40M Series B led by Notable Capital and launched Director",
    date: "2025-06-18",
    sourceTitle: "Browserbase Raises $40M Series B",
    sourceUrl: "https://www.browserbase.com/blog/series-b-and-beyond",
    sourceType: "company_blog",
    extraSignals: [
      {
        category: "commercial",
        headline: "Browserbase reports handling 50M+ browser sessions in 2025 across 1,000+ customers including Perplexity and Vercel",
        evidenceLevel: "B",
      },
    ],
  },
  {
    companySlug: "e2b",
    type: "financing",
    headline: "E2B raised a $21M Series A led by Insight Partners to scale AI sandbox infrastructure",
    date: "2025-07-28",
    sourceTitle: "E2B shares its vision of sandboxed, cloud environments for every AI agent after raising $21M in funding",
    sourceUrl:
      "https://siliconangle.com/2025/07/28/e2b-shares-vision-sandboxed-cloud-environments-every-ai-agent-raising-21m-funding/",
    sourceType: "press",
    extraSignals: [
      {
        category: "commercial",
        headline: "E2B reports enterprise usage including Perplexity, Hugging Face, and Groq",
        evidenceLevel: "B",
      },
    ],
  },
  {
    companySlug: "langchain",
    type: "financing",
    headline: "LangChain raised a $125M Series B led by IVP at a $1.25B valuation",
    date: "2025-10-20",
    sourceTitle: "LangChain raises $125M to build the platform for agent engineering",
    sourceUrl: "https://www.langchain.com/blog/series-b",
    sourceType: "company_blog",
    extraSignals: [
      {
        category: "commercial",
        headline: "LangChain reports customers ServiceNow, Workday, Cisco, Datadog, and Databricks also invested in the round",
        evidenceLevel: "B",
      },
    ],
  },
  {
    companySlug: "crewai",
    type: "financing",
    headline: "CrewAI raised $18M across an inception round and a Series A led by Insight Partners",
    date: "2024-11-04",
    sourceTitle: "CrewAI: Multi-Agent Platform Raises $18 Million (Series A)",
    sourceUrl: "https://pulse2.com/crewai-multi-agent-platform-raises-18-million-series-a/",
    sourceType: "press",
    extraSignals: [
      {
        category: "commercial",
        headline: "CrewAI reports 150 beta enterprise customers signed within six months, used by nearly half of the Fortune 500",
        evidenceLevel: "B",
      },
    ],
  },
];

export interface ResearchedMilestoneEntry {
  milestone: Milestone;
  source: SourceRecord;
  signals: SignalDraft[];
}

export const RESEARCHED_MILESTONES: ResearchedMilestoneEntry[] = SPECS.map(build);

/** Reconstructs a researched source's id for reuse elsewhere (e.g. founder records) without duplicating the SourceRecord. */
export function researchedSourceId(companySlug: string, sourceUrl: string): string {
  return stableId("source", "researched", companySlug, sourceUrl);
}
