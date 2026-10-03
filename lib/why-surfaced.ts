import type { Signal, SourceRecord } from "@/lib/schemas";

/**
 * A one-line, deterministic explanation of why a signal surfaced — derived
 * from its category and source type, never an LLM summary. Keeps Discover
 * from reading like an unexplained news feed.
 */
export function whySurfaced(signal: Signal, source: SourceRecord | undefined): string {
  if (!source) return "Evidence recorded for this company.";
  switch (source.type) {
    case "github":
      if (signal.category === "product") return "New release published on the company's GitHub repository.";
      if (signal.category === "organization") return "Contributor count change detected on the company's GitHub repository.";
      return "Repository activity detected (stars, pushes) on the company's GitHub repository.";
    case "hacker_news":
      return "Surfaced in public discussion on Hacker News.";
    case "x_post":
      return "Builder posted directly on X with a verified public artifact (sanitized replay of a governed sourcing run).";
    case "press":
      return "Reported by a named press outlet with a dated article.";
    case "company_blog":
      return "Published directly on the company's own blog.";
    case "rss":
      return "Published via the company's public RSS/Atom feed.";
    default:
      return "Evidence recorded for this company.";
  }
}
