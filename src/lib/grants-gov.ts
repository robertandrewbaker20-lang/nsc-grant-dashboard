import type { Opportunity } from "./types";
import { blankDetails } from "./types";

const GRANTS_GOV_SEARCH =
  "https://apply07.grants.gov/grantsws/rest/opportunities/search";

interface GrantsGovHit {
  id: string;
  number: string;
  title: string;
  agency: string;
  openDate: string;
  closeDate: string;
  oppStatus: string;
  docType: string;
}

export async function fetchGrantsGov(
  keywords: string[],
): Promise<{ opportunities: Opportunity[]; errors: string[] }> {
  const opportunities: Opportunity[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const keyword of keywords.slice(0, 10)) {
    try {
      const response = await fetch(GRANTS_GOV_SEARCH, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          keyword,
          rows: 12,
          startRecordNum: 0,
          oppStatuses: "posted|forecasted",
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        errors.push(`Grants.gov (${keyword}): HTTP ${response.status}`);
        continue;
      }

      const data = (await response.json()) as { oppHits?: GrantsGovHit[] };
      for (const hit of data.oppHits ?? []) {
        if (seen.has(hit.id)) continue;
        seen.add(hit.id);
        opportunities.push({
          id: `grants.gov:${hit.id}`,
          source: "Grants.gov",
          title: hit.title,
          agency: hit.agency ?? null,
          description: hit.docType ? `${hit.docType} · ${hit.oppStatus}` : hit.oppStatus,
          url: `https://www.grants.gov/search-results-detail/${hit.id}`,
          postedDate: hit.openDate || null,
          deadline: hit.closeDate || null,
          funderType: "federal",
          fitScore: null,
          recommendation: null,
          summary: null,
          strengths: [],
          concerns: [],
          partnershipRequired: false,
          ...blankDetails(),
        });
      }
    } catch (error) {
      errors.push(
        `Grants.gov (${keyword}): ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }

  return { opportunities, errors };
}
