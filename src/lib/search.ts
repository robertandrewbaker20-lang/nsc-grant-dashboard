import { filterEligibleOpportunities } from "./eligibility";
import { fetchGrantsGov } from "./grants-gov";
import type { Opportunity, SearchProfile, SearchResult } from "./types";
import { evaluateOpportunities, searchWebOpportunities } from "./xai";

const SEARCH_BUDGET_MS = 45_000;

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

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  if (ms <= 0) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  const deadline = Date.now() + SEARCH_BUDGET_MS;
  const remaining = () => deadline - Date.now();
  const errors: string[] = [];

  const federalPromise =
    seed.length > 0
      ? Promise.resolve({ opportunities: seed, errors: [] as string[] })
      : fetchGrantsGov(profile.keywords);

  const webMs = Math.max(2_000, Math.min(22_000, remaining() - 20_000));
  const [federal, web] = await Promise.all([
    federalPromise,
    withTimeout(searchWebOpportunities(profile, webMs), webMs, {
      opportunities: [],
      errors: ["Web search timed out; showing Grants.gov listings."],
    }),
  ]);

  errors.push(...federal.errors, ...web.errors);

  const { kept } = filterEligibleOpportunities(
    mergeOpportunities([federal.opportunities, web.opportunities]),
  );

  if (remaining() < 8_000) {
    errors.push("Scoring skipped to finish in time. Open a card to load a briefing.");
    return toResult(kept, errors);
  }

  let evaluated = kept.slice(0, 16);
  let evaluatedCount = 0;
  try {
    const scoreMs = Math.max(5_000, remaining() - 2_000);
    evaluated = await withTimeout(
      evaluateOpportunities(profile, evaluated, scoreMs),
      scoreMs,
      evaluated,
    );
    const missing = evaluated.filter((o) => o.fitScore == null);
    if (missing.length > 0 && remaining() > 10_000) {
      const secondMs = Math.max(4_000, remaining() - 1_500);
      const second = await withTimeout(
        evaluateOpportunities(profile, missing, secondMs),
        secondMs,
        missing,
      );
      const byId = new Map(second.map((o) => [o.id, o]));
      evaluated = evaluated.map((o) => byId.get(o.id) ?? o);
    }
    evaluatedCount = evaluated.filter((o) => o.fitScore != null).length;
    if (evaluatedCount === 0 && kept.length > 0) {
      errors.push("Fit scoring did not finish in time. Listings are still shown.");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Evaluation failed");
    evaluated = kept;
  }

  const rest = kept.slice(16);
  const scored = filterEligibleOpportunities([...evaluated, ...rest]).kept;
  scored.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  return toResult(scored, errors, evaluatedCount);
}
