import { filterEligibleOpportunities } from "./eligibility";
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

  const { kept } = filterEligibleOpportunities(merged);

  let evaluated = kept;
  let evaluatedCount = 0;
  try {
    evaluated = await evaluateOpportunities(profile, kept);
    const missing = evaluated.filter((o) => o.fitScore == null);
    if (missing.length > 0) {
      const second = await evaluateOpportunities(profile, missing);
      const byId = new Map(second.map((o) => [o.id, o]));
      evaluated = evaluated.map((o) => byId.get(o.id) ?? o);
    }
    evaluatedCount = evaluated.filter((o) => o.fitScore != null).length;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Evaluation failed");
  }

  evaluated = filterEligibleOpportunities(evaluated).kept;

  evaluated.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  return {
    fetched: kept.length,
    evaluated: evaluatedCount,
    errors,
    opportunities: evaluated,
    searchedAt: new Date().toISOString(),
  };
}
