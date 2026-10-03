import { stableId } from "@/lib/ids";
import type { Company, MarketTheme } from "@/lib/schemas";

/**
 * The corpus. Every field here is either sourced (website, githubRepo —
 * confirmed live against the GitHub API before being added) or explicitly
 * `unknown` where SignalIQ cannot verify it from public data (founding year,
 * HQ, capital raised, funding stage). Expand this list only by the same
 * standard: confirm the repo and website live, then add a row.
 *
 * Three groups, by how they entered the corpus:
 *  - "github": the original five, found by hand, verified live.
 *  - "github": the seventeen added in the expansion pass, same standard.
 *  - "x-showcase": discovered via the author's existing X sourcing engine
 *    (sanitized replay — see data/external/x-sourcing-engine/PROVENANCE.md).
 *    These are necessarily earlier-stage: a single X builder post plus a
 *    small, live-verified public repo, not an established company with press
 *    coverage. That's the point — it's the "before it's obvious" case the
 *    product is named for — but it means these three have far shallower
 *    evidence than the rest of the corpus, and the UI should not pretend
 *    otherwise.
 */
export interface SeedCompany {
  id: string;
  name: string;
  website: string;
  githubRepo: string; // owner/repo, verified live via GitHub API
  oneLiner: string; // from the repo's own GitHub description
  theme: MarketTheme;
  hnQuery: string;
  milestoneRelease?: { tag: string; headline: string };
  xShowcaseSlug?: string; // slug in data/external/x-sourcing-engine/candidates.json
  stage?: string; // only set when it's an honest inference from evidence depth, not a guess
}

export const SEED_COMPANIES: SeedCompany[] = [
  // --- Original five ---------------------------------------------------
  {
    id: stableId("company", "e2b"),
    name: "E2B",
    website: "https://e2b.dev",
    githubRepo: "e2b-dev/E2B",
    oneLiner: "Open-source, secure cloud environments for running AI-generated code.",
    theme: "ai_infrastructure",
    hnQuery: "E2B sandbox",
    milestoneRelease: { tag: "e2b@2.30.3", headline: "E2B shipped a core SDK release (e2b@2.30.3)" },
  },
  {
    id: stableId("company", "modal"),
    name: "Modal",
    website: "https://modal.com",
    githubRepo: "modal-labs/modal-client",
    oneLiner: "Serverless cloud platform for running AI and data infrastructure without managing servers.",
    theme: "ai_infrastructure",
    hnQuery: "Modal Labs serverless",
  },
  {
    id: stableId("company", "ollama"),
    name: "Ollama",
    website: "https://ollama.com",
    githubRepo: "ollama/ollama",
    oneLiner: "Runs open-weight large language models locally on your own machine.",
    theme: "developer_tools",
    hnQuery: "Ollama local LLM",
    milestoneRelease: { tag: "v0.12.10", headline: "Ollama released v0.12.10" },
  },
  {
    id: stableId("company", "browserbase"),
    name: "Browserbase",
    website: "https://browserbase.com",
    githubRepo: "browserbase/stagehand",
    oneLiner: "Headless browser infrastructure and the Stagehand SDK for AI agents that browse the web.",
    theme: "ai_infrastructure",
    hnQuery: "Browserbase Stagehand",
    milestoneRelease: { tag: "1.0.3", headline: "Browserbase shipped Stagehand 1.0.3" },
  },
  {
    id: stableId("company", "llamaindex"),
    name: "LlamaIndex",
    website: "https://developers.llamaindex.ai",
    githubRepo: "run-llama/llama_index",
    oneLiner: "Document and data processing framework for building LLM applications.",
    theme: "vertical_ai",
    hnQuery: "LlamaIndex",
    milestoneRelease: { tag: "v0.11.22", headline: "LlamaIndex released v0.11.22" },
  },

  // --- AI infrastructure -------------------------------------------------
  {
    id: stableId("company", "ray"),
    name: "Ray (Anyscale)",
    website: "https://ray.io",
    githubRepo: "ray-project/ray",
    oneLiner: "AI compute engine: a distributed runtime and libraries for scaling ML workloads.",
    theme: "ai_infrastructure",
    hnQuery: "Ray distributed Anyscale",
    milestoneRelease: { tag: "ray-0.8.3", headline: "Ray shipped release 0.8.3" },
  },
  {
    id: stableId("company", "weaviate"),
    name: "Weaviate",
    website: "https://weaviate.io",
    githubRepo: "weaviate/weaviate",
    oneLiner: "Open-source vector database combining vector search with structured filtering.",
    theme: "ai_infrastructure",
    hnQuery: "Weaviate vector database",
    milestoneRelease: { tag: "v1.34.15", headline: "Weaviate shipped release v1.34.15" },
  },
  {
    id: stableId("company", "qdrant"),
    name: "Qdrant",
    website: "https://qdrant.tech",
    githubRepo: "qdrant/qdrant",
    oneLiner: "High-performance vector database and vector search engine.",
    theme: "ai_infrastructure",
    hnQuery: "Qdrant vector search",
    milestoneRelease: { tag: "v0.8.3", headline: "Qdrant shipped release v0.8.3" },
  },
  {
    id: stableId("company", "chroma"),
    name: "Chroma",
    website: "https://www.trychroma.com",
    githubRepo: "chroma-core/chroma",
    oneLiner: "Search infrastructure for AI applications.",
    theme: "ai_infrastructure",
    hnQuery: "Chroma vector database",
    milestoneRelease: { tag: "0.4.8", headline: "Chroma shipped release 0.4.8" },
  },
  {
    id: stableId("company", "vllm"),
    name: "vLLM",
    website: "https://vllm.ai",
    githubRepo: "vllm-project/vllm",
    oneLiner: "High-throughput, memory-efficient inference and serving engine for LLMs.",
    theme: "ai_infrastructure",
    hnQuery: "vLLM inference engine",
    milestoneRelease: { tag: "v0.1.6", headline: "vLLM shipped release v0.1.6" },
  },
  {
    id: stableId("company", "replicate"),
    name: "Replicate",
    website: "https://replicate.com",
    githubRepo: "replicate/replicate-python",
    oneLiner: "Runs machine learning models in the cloud via a simple API.",
    theme: "ai_infrastructure",
    hnQuery: "Replicate run models API",
    milestoneRelease: { tag: "0.5.1", headline: "Replicate shipped its Python client release 0.5.1" },
  },

  // --- Developer tools -----------------------------------------------------
  {
    id: stableId("company", "supabase"),
    name: "Supabase",
    website: "https://supabase.com",
    githubRepo: "supabase/supabase",
    oneLiner: "The Postgres development platform: a dedicated database for web, mobile, and AI apps.",
    theme: "developer_tools",
    hnQuery: "Supabase Postgres",
    milestoneRelease: { tag: "0.21.03", headline: "Supabase shipped release 0.21.03" },
  },
  {
    id: stableId("company", "posthog"),
    name: "PostHog",
    website: "https://posthog.com",
    githubRepo: "PostHog/posthog",
    oneLiner: "Platform for product analytics, session replay, feature flags, and experiments.",
    theme: "developer_tools",
    hnQuery: "PostHog analytics",
    milestoneRelease: { tag: "desktop-v0.61.621", headline: "PostHog shipped a desktop release (v0.61.621)" },
  },
  {
    id: stableId("company", "neon"),
    name: "Neon",
    website: "https://neon.tech",
    githubRepo: "neondatabase/neon",
    oneLiner: "Serverless Postgres with autoscaling and code-like database branching.",
    theme: "developer_tools",
    hnQuery: "Neon serverless Postgres",
    milestoneRelease: { tag: "release-proxy-7431", headline: "Neon shipped a proxy release (release-proxy-7431)" },
  },
  {
    id: stableId("company", "convex"),
    name: "Convex",
    website: "https://docs.convex.dev",
    githubRepo: "get-convex/convex-backend",
    oneLiner: "Open-source reactive database for application developers.",
    theme: "developer_tools",
    hnQuery: "Convex reactive database",
    milestoneRelease: { tag: "precompiled-2026-08-25-7cce8fb", headline: "Convex shipped a precompiled backend release" },
  },

  // --- AI applications -----------------------------------------------------
  {
    id: stableId("company", "langchain"),
    name: "LangChain",
    website: "https://docs.langchain.com/langchain/",
    githubRepo: "langchain-ai/langchain",
    oneLiner: "The agent engineering platform for building LLM applications.",
    theme: "ai_applications",
    hnQuery: "LangChain LLM framework",
    milestoneRelease: { tag: "langchain-model-profiles==0.0.6", headline: "LangChain shipped langchain-model-profiles 0.0.6" },
  },
  {
    id: stableId("company", "crewai"),
    name: "CrewAI",
    website: "https://crewai.com",
    githubRepo: "crewAIInc/crewAI",
    oneLiner: "Framework for orchestrating role-playing, autonomous AI agents.",
    theme: "ai_applications",
    hnQuery: "CrewAI agents",
    milestoneRelease: { tag: "1.10.0", headline: "CrewAI shipped release 1.10.0" },
  },
  {
    id: stableId("company", "dify"),
    name: "Dify",
    website: "https://dify.ai",
    githubRepo: "langgenius/dify",
    oneLiner: "Agentic workflow and RAG pipeline builder with a collaborative AI workspace.",
    theme: "ai_applications",
    hnQuery: "Dify AI workflow",
    milestoneRelease: { tag: "0.6.4", headline: "Dify shipped release 0.6.4" },
  },

  // --- Vertical AI -----------------------------------------------------
  {
    id: stableId("company", "continue"),
    name: "Continue",
    website: "https://continue.dev",
    githubRepo: "continuedev/continue",
    oneLiner: "Open-source coding agent for software engineering workflows.",
    theme: "vertical_ai",
    hnQuery: "Continue coding agent",
    milestoneRelease: { tag: "v1.5.29", headline: "Continue shipped release v1.5.29" },
  },
  {
    id: stableId("company", "aider"),
    name: "Aider",
    website: "https://aider.chat",
    githubRepo: "Aider-AI/aider",
    oneLiner: "AI pair programming in the terminal.",
    theme: "vertical_ai",
    hnQuery: "Aider AI pair programming",
    milestoneRelease: { tag: "v0.5.0", headline: "Aider shipped release v0.5.0" },
  },

  // --- Fintech infrastructure -----------------------------------------------------
  {
    id: stableId("company", "lago"),
    name: "Lago",
    website: "https://www.getlago.com",
    githubRepo: "getlago/lago",
    oneLiner: "Open-source metering and usage-based billing API.",
    theme: "fintech_infrastructure",
    hnQuery: "Lago billing API",
    milestoneRelease: { tag: "v0.57.1-beta", headline: "Lago shipped release v0.57.1-beta" },
  },
  {
    id: stableId("company", "midday"),
    name: "Midday",
    website: "https://midday.ai",
    githubRepo: "midday-ai/midday",
    oneLiner: "Invoicing, time tracking, and financial overview for freelancers, with an AI assistant.",
    theme: "fintech_infrastructure",
    hnQuery: "Midday invoicing freelancers",
    milestoneRelease: { tag: "app-v0.1.0", headline: "Midday shipped app release v0.1.0" },
  },

  // --- X-sourced: discovered via the existing governed X sourcing engine ---
  {
    id: stableId("company", "ai-trains-ai"),
    name: "ai-trains-ai",
    website: "https://github.com/Danau5tin/ai-trains-ai",
    githubRepo: "Danau5tin/ai-trains-ai",
    oneLiner: "Open-source project surfaced via a direct-builder X post with a verified public repository.",
    theme: "ai_infrastructure",
    hnQuery: "ai-trains-ai",
    xShowcaseSlug: "ai-trains-ai",
    stage: "Early / pre-seed signal: single X builder post plus a small public repository — not an established company.",
  },
  {
    id: stableId("company", "hashcortx"),
    name: "HashCortX",
    website: "https://github.com/Hash-7777/HashCortX",
    githubRepo: "Hash-7777/HashCortX",
    oneLiner: "Open-source project surfaced via a direct-builder X post with a verified public repository.",
    theme: "ai_applications",
    hnQuery: "HashCortX",
    xShowcaseSlug: "hashcortx",
    stage: "Early / pre-seed signal: single X builder post plus a small public repository — not an established company.",
  },
  {
    id: stableId("company", "kitbash"),
    name: "Kitbash",
    website: "https://github.com/Open-Dev-Society/kitbash",
    githubRepo: "Open-Dev-Society/kitbash",
    oneLiner: "Open-source project surfaced via a direct-builder X post with a verified public repository.",
    theme: "ai_infrastructure",
    hnQuery: "Kitbash Open-Dev-Society",
    xShowcaseSlug: "kitbash",
    stage: "Early / pre-seed signal: single X builder post plus a small public repository — not an established company.",
  },
];

export function toCompanyRecord(seed: SeedCompany): Company {
  return {
    id: seed.id,
    name: seed.name,
    website: seed.website,
    githubOrg: seed.githubRepo.split("/")[0],
    oneLiner: seed.oneLiner,
    theme: seed.theme,
    foundedYear: null,
    foundedYearProvenance: "unknown",
    hqLocation: null,
    totalRaised: null,
    totalRaisedProvenance: "unknown",
    stage: seed.stage ?? null,
    stageProvenance: seed.stage ? "analyst_assessment" : "unknown",
    sourceIds: [],
  };
}
