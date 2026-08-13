import { filterEligibleOpportunities } from "./eligibility";
import type { Opportunity, SearchProfile, SearchResult } from "./types";
import { blankDetails } from "./types";

function normalizeOpportunity(item: Opportunity): Opportunity {
  return {
    ...blankDetails(),
    ...item,
    requirements: item.requirements ?? [],
    nextSteps: item.nextSteps ?? [],
    strengths: item.strengths ?? [],
    concerns: item.concerns ?? [],
  };
}

const PROFILE_KEY = "nsc-search-profile";
const RESULT_KEY = "nsc-search-result";

export function readStoredProfile(): SearchProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SearchProfile;
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile: SearchProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function readStoredResult(): SearchResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SearchResult;
    const { kept, dropped } = filterEligibleOpportunities(
      (parsed.opportunities ?? []).map(normalizeOpportunity),
    );
    return {
      ...parsed,
      opportunities: kept,
      fetched: kept.length,
      errors: [
        ...(parsed.errors ?? []),
        ...(dropped
          ? [
              `Hid ${dropped} listing${dropped === 1 ? "" : "s"} that cannot fund Arkansas work (other-state or site-specific, including Wright-Patterson / STARBASE).`,
            ]
          : []),
      ],
    };
  } catch {
    return null;
  }
}

export function writeStoredResult(result: SearchResult) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}
