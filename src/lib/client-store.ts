import { useSyncExternalStore } from "react";
import defaults from "../../data/default-profile.json";
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

const LEGACY_GEOGRAPHY =
  "Arkansas statewide: Central Arkansas, Northwest Arkansas, River Valley, Arkansas Delta, Ozarks, Ouachitas. Rural and small-town communities plus Little Rock, Fayetteville/Bentonville, Fort Smith, Jonesboro, Pine Bluff, and El Dorado. Do not treat other states as eligible service area.";

const LEGACY_POOR_FIT =
  "Never return or score: site-specific awards at a named installation outside Arkansas; state-only programs for any state that is not Arkansas; awards that cannot fund Arkansas youth; adult-only workforce; pure biomedical research; invitation-only awards we cannot access; for-profit-only RFPs; and programs that require serving a population the council does not actually enroll.";

const LEGACY_MATCH =
  "Score highly when: 501(c)(3) can apply or partner; Arkansas or nationwide geography; youth development, outdoor/STEM, mentoring, or rural facilities; funds programs, scholarships, or camp infrastructure; reasonable reporting for a council staff team. Flag when a school, city, or university must be lead applicant. Nationwide competitions the council can enter from Arkansas count. Awards locked to another state or a single installation outside Arkansas do not.";

function migrateProfile(profile: SearchProfile): SearchProfile {
  const next = { ...profile };
  if (next.geography.trim() === LEGACY_GEOGRAPHY) {
    next.geography = defaults.geography;
  }
  if (next.poorFit.trim() === LEGACY_POOR_FIT) {
    next.poorFit = defaults.poorFit;
  }
  if (next.matchCriteria.trim() === LEGACY_MATCH) {
    next.matchCriteria = defaults.matchCriteria;
  }
  return next;
}

type Listener = () => void;

const profileListeners = new Set<Listener>();
const resultListeners = new Set<Listener>();

function emit(listeners: Set<Listener>) {
  listeners.forEach((listener) => listener());
}

export function subscribeProfile(listener: Listener) {
  profileListeners.add(listener);
  return () => {
    profileListeners.delete(listener);
  };
}

export function subscribeResult(listener: Listener) {
  resultListeners.add(listener);
  return () => {
    resultListeners.delete(listener);
  };
}

let profileCacheRaw: string | null = null;
let profileCache: SearchProfile | null = null;
let resultCacheRaw: string | null = null;
let resultCache: SearchResult | null = null;

export function getProfileSnapshot(): SearchProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (raw === profileCacheRaw) return profileCache;
  profileCacheRaw = raw;
  if (!raw) {
    profileCache = null;
    return null;
  }
  try {
    profileCache = migrateProfile(JSON.parse(raw) as SearchProfile);
  } catch {
    profileCache = null;
  }
  return profileCache;
}

function parseResult(raw: string | null): SearchResult | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SearchResult;
    const { kept } = filterEligibleOpportunities(
      (parsed.opportunities ?? []).map(normalizeOpportunity),
    );
    return {
      ...parsed,
      opportunities: kept,
      fetched: kept.length,
      errors: publicNotes(parsed.errors ?? []),
    };
  } catch {
    return null;
  }
}

export function getResultSnapshot(): SearchResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(RESULT_KEY);
  if (raw === resultCacheRaw) return resultCache;
  resultCacheRaw = raw;
  resultCache = parseResult(raw);
  return resultCache;
}

export function readStoredProfile(): SearchProfile | null {
  return getProfileSnapshot();
}

export function writeStoredProfile(profile: SearchProfile) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(profile);
  window.localStorage.setItem(PROFILE_KEY, raw);
  profileCacheRaw = raw;
  profileCache = profile;
  emit(profileListeners);
}

export function readStoredResult(): SearchResult | null {
  return getResultSnapshot();
}

export function writeStoredResult(result: SearchResult) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(result);
  window.sessionStorage.setItem(RESULT_KEY, raw);
  resultCacheRaw = raw;
  resultCache = result;
  emit(resultListeners);
}

export function useStoredProfile(fallback: SearchProfile): SearchProfile {
  const stored = useSyncExternalStore(subscribeProfile, getProfileSnapshot, () => null);
  return stored ?? fallback;
}

export function useStoredResult(): SearchResult | null {
  return useSyncExternalStore(subscribeResult, getResultSnapshot, () => null);
}

/** Hide internal geography-filter notes from staff-facing status. */
export function publicNotes(errors: string[]) {
  return errors.filter(
    (note) =>
      !/^(hid |removed |filtered )/i.test(note) &&
      !/wright-?patterson|starbase/i.test(note) &&
      !/abort|timed out|timeout|did not finish in time/i.test(note),
  );
}
