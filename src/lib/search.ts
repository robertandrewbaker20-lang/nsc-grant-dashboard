import { fetchGrantsGov } from "./grants-gov";
import type { Opportunity, SearchProfile, SearchResult } from "./types";
import { evaluateOpportunities, searchWebOpportunities } from "./xai";

export async function runSearch(profile: SearchProfile): Promise<SearchResult> {
  const errors: string[] = [];

  const [federal, web] = await Promise.all([
    fetchGrantsGov(profile.keywords),
    searchWebOpportunities(profile),
  ]);

  errors.push(...federal.errors, ...web.errors);

  const merged: Opportunity[] = [];
  const seen = new Set<string>();
  for (const item of [...federal.opportunities, ...web.opportunities]) {
    const key = (item.url || item.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  let evaluated = merged;
  let evaluatedCount = 0;
  try {
    evaluated = await evaluateOpportunities(profile, merged);
    evaluatedCount = evaluated.filter((o) => o.fitScore != null).length;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Evaluation failed");
  }

  evaluated.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  return {
    fetched: merged.length,
    evaluated: evaluatedCount,
    errors,
    opportunities: evaluated,
    searchedAt: new Date().toISOString(),
  };
}
