import { stableId } from "@/lib/ids";
import type { CompanyRelationship, Founder } from "@/lib/schemas";
import { researchedSourceId } from "./researched-milestones";

/**
 * Founder records confirmed by directly fetching a company's own funding
 * announcement (same research pass as researched-milestones.ts). Only two —
 * this is what the funding-round research incidentally surfaced, not a
 * dedicated founder research pass. No founder is listed for any other
 * company in the corpus; that remains an open research gap.
 */
export const RESEARCHED_FOUNDERS: Founder[] = [
  {
    id: stableId("founder", "browserbase", "paul-klein"),
    companyId: stableId("company", "browserbase"),
    name: "Paul Klein",
    role: "Founder",
    previousCompanies: ["Mux (acquired)"],
    provenance: "source_reported",
    sourceIds: [researchedSourceId("browserbase", "https://www.browserbase.com/blog/series-b-and-beyond")],
  },
  {
    id: stableId("founder", "e2b", "vasek-mlejnsky"),
    companyId: stableId("company", "e2b"),
    name: "Vasek Mlejnsky",
    role: "Co-founder",
    previousCompanies: [],
    provenance: "source_reported",
    sourceIds: [
      researchedSourceId(
        "e2b",
        "https://siliconangle.com/2025/07/28/e2b-shares-vision-sandboxed-cloud-environments-every-ai-agent-raising-21m-funding/",
      ),
    ],
  },
];

/**
 * The company intelligence graph (lib/schemas/entities.ts, CompanyRelationship)
 * is schema-complete but deliberately holds only the edges above: the two
 * founder_of relationships this research pass actually verified. No graph
 * visualization page was built for two edges — see README.md's "Company
 * relationships" section for why a dedicated graph UI was left out rather
 * than built decoratively around this little data.
 */
export const RESEARCHED_RELATIONSHIPS: CompanyRelationship[] = RESEARCHED_FOUNDERS.map((f) => ({
  id: stableId("relationship", "founder_of", f.id),
  type: "founder_of",
  fromId: f.id,
  toId: f.companyId,
  sourceIds: f.sourceIds,
}));
