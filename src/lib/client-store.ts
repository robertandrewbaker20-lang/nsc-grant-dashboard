import { useSyncExternalStore } from "react";
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
    profileCache = JSON.parse(raw) as SearchProfile;
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
      !/abort|timed out|timeout/i.test(note),
  );
}
