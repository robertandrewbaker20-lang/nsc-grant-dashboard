import { isAbortError } from "./abort";
import { filterDismissed } from "./dismissed";
import { filterEligibleOpportunities } from "./eligibility";
import { fetchGrantsGov } from "./grants-gov";
import type { Opportunity, SearchProfile, SearchResult } from "./types";
import { watchlistOpportunities } from "./watchlist";
import { evaluateOpportunities, searchWebOpportunities } from "./xai";

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

function keepVisible(items: Opportunity[], dismissed: string[]) {
  return filterDismissed(filterEligibleOpportunities(items).kept, dismissed);
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

export async function runFederalSearch(
  profile: SearchProfile,
  dismissed: string[] = [],
): Promise<SearchResult> {
  const federal = await fetchGrantsGov(profile.keywords);
  return toResult(keepVisible(federal.opportunities, dismissed), federal.errors);
}

export async function runSourceSearch(
  profile: SearchProfile,
  seed: Opportunity[] = [],
  dismissed: string[] = [],
): Promise<SearchResult> {
  const errors: string[] = [];
  const federal =
    seed.length > 0
      ? { opportunities: seed, errors: [] as string[] }
      : await fetchGrantsGov(profile.keywords);
  errors.push(...federal.errors);

  const extras = await searchWebOpportunities(profile, 45_000);
  const kept = keepVisible(
    mergeOpportunities([
      federal.opportunities,
      watchlistOpportunities(),
      extras.opportunities,
    ]),
    dismissed,
  );
  return toResult(kept, errors);
}

export async function runScoreSearch(
  profile: SearchProfile,
  seed: Opportunity[],
  dismissed: string[] = [],
): Promise<SearchResult> {
  const errors: string[] = [];
  const eligible = keepVisible(seed, dismissed);
  let evaluated = eligible.slice(0, 16);
  let evaluatedCount = 0;
  try {
    evaluated = await evaluateOpportunities(profile, evaluated, 60_000);
    evaluatedCount = evaluated.filter((o) => o.fitScore != null).length;
  } catch (error) {
    if (!isAbortError(error)) {
      errors.push(error instanceof Error ? error.message : "Evaluation failed");
    }
    evaluated = eligible.slice(0, 16);
  }

  const scored = keepVisible([...evaluated, ...eligible.slice(16)], dismissed);
  scored.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
  return toResult(scored, errors, evaluatedCount);
}

export async function runSearch(
  profile: SearchProfile,
  seed: Opportunity[] = [],
  dismissed: string[] = [],
): Promise<SearchResult> {
  const sources = await runSourceSearch(profile, seed, dismissed);
  return runScoreSearch(profile, sources.opportunities, dismissed);
}
