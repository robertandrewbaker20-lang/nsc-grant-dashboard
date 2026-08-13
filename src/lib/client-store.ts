import type { SearchProfile, SearchResult } from "./types";

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
    return JSON.parse(raw) as SearchResult;
  } catch {
    return null;
  }
}

export function writeStoredResult(result: SearchResult) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}
