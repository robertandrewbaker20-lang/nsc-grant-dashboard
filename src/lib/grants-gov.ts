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

async function parseJsonBody(response: Response): Promise<{ oppHits?: GrantsGovHit[] }> {
  const text = await response.text();
  try {
    return JSON.parse(text) as { oppHits?: GrantsGovHit[] };
  } catch {
    throw new Error(`non-JSON response (${response.status})`);
  }
}

export async function fetchGrantsGov(
  keywords: string[],
): Promise<{ opportunities: Opportunity[]; errors: string[] }> {
  const opportunities: Opportunity[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const uniqueKeywords = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))].slice(
    0,
    6,
  );

  const results = await Promise.all(
    uniqueKeywords.map(async (keyword) => {
      try {
        const response = await fetch(GRANTS_GOV_SEARCH, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            keyword,
            rows: 8,
            startRecordNum: 0,
            oppStatuses: "posted|forecasted",
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(8_000),
        });

        if (!response.ok) {
          return { keyword, error: `HTTP ${response.status}`, hits: [] as GrantsGovHit[] };
        }

        const data = await parseJsonBody(response);
        return { keyword, error: null, hits: data.oppHits ?? [] };
      } catch (error) {
        return {
          keyword,
          error: error instanceof Error ? error.message : "failed",
          hits: [] as GrantsGovHit[],
        };
      }
    }),
  );

  for (const result of results) {
    if (result.error) {
      errors.push(`Grants.gov (${result.keyword}): ${result.error}`);
    }
    for (const hit of result.hits) {
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
  }

  return { opportunities, errors };
}
