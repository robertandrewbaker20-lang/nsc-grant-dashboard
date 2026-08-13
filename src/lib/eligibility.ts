import type { Opportunity } from "./types";

const HOME_STATE = "arkansas";

const OTHER_STATES = [
  "alabama",
  "alaska",
  "arizona",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "new york",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "west virginia",
  "wisconsin",
  "wyoming",
];

const SITE_SPECIFIC = [
  /wright[-\s]?patterson/i,
  /\bwpafb\b/i,
  /starbase\s+(wright|ohio|patt)/i,
  /\bafb\b/i,
];

const NATIONAL = /\b(nationwide|national|all\s+states|united\s+states|u\.s\.|across\s+the\s+country|no\s+geographic)\b/i;

function blob(item: Opportunity): string {
  return [
    item.title,
    item.agency,
    item.description,
    item.eligibility,
    item.overview,
    item.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function mentionsHome(text: string): boolean {
  return /\barkansas\b|\bnatural state\b/.test(text);
}

function otherStateIn(text: string): string | null {
  for (const state of OTHER_STATES) {
    const re = new RegExp(`\\b${state.replace(/ /g, "\\s+")}\\b`, "i");
    if (re.test(text)) return state;
  }
  return null;
}

/** Drop awards a statewide Arkansas council cannot enter. */
export function isGeographicallyImpossible(item: Opportunity): boolean {
  const text = blob(item);
  const title = (item.title ?? "").toLowerCase();

  if (SITE_SPECIFIC.some((re) => re.test(text))) {
    if (!mentionsHome(text)) return true;
  }

  const titleState = otherStateIn(title);
  if (titleState && !mentionsHome(title) && !NATIONAL.test(title)) {
    return true;
  }

  const limited =
    /\b(only|limited to|restricted to|serving only|located (?:in|at)|site[-\s]?specific(?: to)?)\b/.test(
      text,
    );
  const foreign = otherStateIn(text);
  if (limited && foreign && !mentionsHome(text)) return true;

  if (foreign && !mentionsHome(text) && !NATIONAL.test(text)) {
    if (
      /\b(installation|air force base|naval|army post|this (?:base|site|location|county|city|state))\b/.test(
        text,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function filterEligibleOpportunities(items: Opportunity[]): {
  kept: Opportunity[];
  dropped: number;
} {
  const kept: Opportunity[] = [];
  let dropped = 0;
  for (const item of items) {
    if (isGeographicallyImpossible(item)) {
      dropped += 1;
      continue;
    }
    kept.push(item);
  }
  return { kept, dropped };
}

export { HOME_STATE };
