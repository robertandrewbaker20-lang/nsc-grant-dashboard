import { isAbortError } from "./abort";
import { filterEligibleOpportunities } from "./eligibility";
import { fetchGrantsGov } from "./grants-gov";
import type { Opportunity, SearchProfile, SearchResult } from "./types";
import { evaluateOpportunities, searchWebOpportunities } from "./xai";

const WEB_SEARCH_MS = 120_000;
const SCORE_MS = 90_000;

function mergeOpportunities(lists: Opportunity[][]): Opportunity[] {
  const merged: Opportunity[] = [];
  const seen = new Set<string>();
  for (const item of lists.flat()) {
    const key = (item.url || item.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function toResult(
  opportunities: Opportunity[],
  errors: string[],
  evaluated = 0,
): SearchResult {
  return {
    fetched: opportunities.length,
    evaluated,
    errors,
    opportunities,
    searchedAt: new Date().toISOString(),
  };
}

export async function runFederalSearch(profile: SearchProfile): Promise<SearchResult> {
  const federal = await fetchGrantsGov(profile.keywords);
  const { kept } = filterEligibleOpportunities(federal.opportunities);
  return toResult(kept, federal.errors);
}

export async function runSearch(
  profile: SearchProfile,
  seed: Opportunity[] = [],
): Promise<SearchResult> {
  const errors: string[] = [];

  const federal =
    seed.length > 0
      ? { opportunities: seed, errors: [] as string[] }
      : await fetchGrantsGov(profile.keywords);
  errors.push(...federal.errors);

  const web = await searchWebOpportunities(profile, WEB_SEARCH_MS);
  errors.push(...web.errors);

  const { kept } = filterEligibleOpportunities(
    mergeOpportunities([federal.opportunities, web.opportunities]),
  );

  let evaluated = kept.slice(0, 16);
  let evaluatedCount = 0;
  try {
    evaluated = await evaluateOpportunities(profile, evaluated, SCORE_MS);
    evaluatedCount = evaluated.filter((o) => o.fitScore != null).length;
  } catch (error) {
    if (!isAbortError(error)) {
      errors.push(error instanceof Error ? error.message : "Evaluation failed");
    }
    evaluated = kept.slice(0, 16);
  }

  const rest = kept.slice(16);
  const scored = filterEligibleOpportunities([...evaluated, ...rest]).kept;
  scored.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  return toResult(scored, errors, evaluatedCount);
}
