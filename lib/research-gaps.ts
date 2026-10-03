import type { Company, Founder, Signal } from "@/lib/schemas";

/**
 * Deterministic, data-driven research gaps — flagged because a field or
 * category this corpus expects to track is actually missing for this
 * specific company, not a boilerplate list repeated on every page. Checked
 * against real signals/founders so a researched company (e.g. one with a
 * confirmed founder or commercial signal) doesn't still show a gap for it.
 */
export function researchGapsFor(company: Company, companySignals: Signal[] = [], companyFounders: Founder[] = []): string[] {
  const gaps: string[] = [];

  if (company.foundedYearProvenance === "unknown" || company.hqLocation === null) {
    gaps.push("Founding year and headquarters are not established from the sources ingested so far.");
  }
  if (company.totalRaisedProvenance === "unknown") {
    gaps.push("Total capital raised is unknown; public funding announcements have not yet been researched for this company.");
  }
  if (companyFounders.length === 0) {
    gaps.push("No founder or leadership records have been verified; founder research requires a dedicated pass for this company.");
  }

  const categoriesPresent = new Set(companySignals.map((s) => s.category));
  if (!categoriesPresent.has("commercial")) {
    gaps.push("No commercial signals (customers, pricing, partnerships) have been found for this company yet.");
  }
  if (!categoriesPresent.has("organization")) {
    gaps.push("No organization signals (hiring, team expansion) have been found for this company yet.");
  }
  if (!categoriesPresent.has("founder")) {
    gaps.push("No founder-category signals (founder transitions, public builder activity) have been found for this company yet.");
  }

  if (gaps.length === 0) {
    gaps.push("No open data gaps identified against the fields this corpus currently tracks.");
  }

  return gaps;
}
