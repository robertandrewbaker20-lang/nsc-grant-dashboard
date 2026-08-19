import type { Opportunity } from "./types";

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
  "puerto rico",
  "guam",
  "american samoa",
];

/** Foreign countries and territories a statewide Arkansas council cannot serve. */
const FOREIGN_PLACES = [
  "afghanistan",
  "albania",
  "algeria",
  "angola",
  "argentina",
  "armenia",
  "australia",
  "austria",
  "azerbaijan",
  "bahrain",
  "bangladesh",
  "belarus",
  "belgium",
  "belize",
  "benin",
  "bhutan",
  "bolivia",
  "bosnia",
  "botswana",
  "brazil",
  "brunei",
  "bulgaria",
  "burkina faso",
  "burundi",
  "cabo verde",
  "cambodia",
  "cameroon",
  "canada",
  "cape verde",
  "central african republic",
  "chad",
  "chile",
  "china",
  "colombia",
  "comoros",
  "costa rica",
  "cote d'ivoire",
  "croatia",
  "cuba",
  "cyprus",
  "czech republic",
  "czechia",
  "democratic republic of the congo",
  "denmark",
  "djibouti",
  "dominican republic",
  "ecuador",
  "egypt",
  "el salvador",
  "equatorial guinea",
  "eritrea",
  "estonia",
  "eswatini",
  "ethiopia",
  "european union",
  "fiji",
  "finland",
  "france",
  "gabon",
  "gambia",
  "germany",
  "ghana",
  "greece",
  "guatemala",
  "guinea-bissau",
  "guyana",
  "haiti",
  "honduras",
  "hungary",
  "iceland",
  "india",
  "indonesia",
  "iran",
  "iraq",
  "ireland",
  "israel",
  "italy",
  "ivory coast",
  "jamaica",
  "japan",
  "jordan",
  "kazakhstan",
  "kenya",
  "kosovo",
  "kuwait",
  "kyrgyzstan",
  "laos",
  "latvia",
  "lebanon",
  "lesotho",
  "liberia",
  "libya",
  "lithuania",
  "luxembourg",
  "madagascar",
  "malawi",
  "malaysia",
  "maldives",
  "mali",
  "malta",
  "marshall islands",
  "mauritania",
  "mauritius",
  "mexico",
  "micronesia",
  "moldova",
  "mongolia",
  "montenegro",
  "morocco",
  "mozambique",
  "myanmar",
  "namibia",
  "nepal",
  "netherlands",
  "new zealand",
  "nicaragua",
  "niger",
  "nigeria",
  "north korea",
  "north macedonia",
  "norway",
  "oman",
  "pakistan",
  "palau",
  "palestine",
  "panama",
  "papua new guinea",
  "paraguay",
  "peru",
  "philippines",
  "poland",
  "portugal",
  "qatar",
  "republic of the congo",
  "romania",
  "russia",
  "rwanda",
  "saudi arabia",
  "senegal",
  "serbia",
  "sierra leone",
  "singapore",
  "slovakia",
  "slovenia",
  "solomon islands",
  "somalia",
  "south africa",
  "south korea",
  "south sudan",
  "spain",
  "sri lanka",
  "sudan",
  "suriname",
  "sweden",
  "switzerland",
  "syria",
  "taiwan",
  "tajikistan",
  "tanzania",
  "thailand",
  "the hague",
  "the netherlands",
  "timor-leste",
  "togo",
  "tonga",
  "trinidad and tobago",
  "tunisia",
  "turkey",
  "turkiye",
  "türkiye",
  "turkmenistan",
  "uganda",
  "ukraine",
  "united arab emirates",
  "united kingdom",
  "uruguay",
  "uzbekistan",
  "vanuatu",
  "venezuela",
  "vietnam",
  "west bank",
  "western sahara",
  "yemen",
  "zambia",
  "zimbabwe",
];

const FOREIGN_REGIONS =
  /\b(sub-?saharan\s+africa|middle\s+east(?:ern)?|north\s+africa|latin\s+america|central\s+america|the\s+caribbean|southeast\s+asia|central\s+asia|south\s+asia|eastern\s+europe|western\s+balkans|indo-pacific|the\s+sahel|european\s+union|west\s+bank|gaza)\b/i;

const SITE_SPECIFIC = [
  /wright[-\s]?patterson/i,
  /\bwpafb\b/i,
  /starbase\s+(wright|ohio|patt)/i,
];

/** True nationwide U.S. competitions — not every title that contains "U.S." */
const NATIONAL =
  /\b(nationwide|all\s+50\s+states|all\s+states|across\s+the\s+country|across\s+the\s+nation|no\s+geographic(?:al)?\s+restriction|united\s+states-wide|u\.s\.-wide)\b/i;

const FOREIGN_MISSION =
  /\bembassy\b|\bconsulate\b|\bpublic\s+affairs\s+section\b|\bpas\s+annual\s+program\b|\bu\.?\s*s\.?\s+mission\s+to\b/i;

const FOREIGN_PLACE_RE = new RegExp(
  `\\b(${FOREIGN_PLACES.sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"))
    .join("|")})\\b`,
  "i",
);

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

function heading(item: Opportunity): string {
  return [item.title, item.agency].filter(Boolean).join(" ").toLowerCase();
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

function isForeignMission(text: string): boolean {
  return FOREIGN_MISSION.test(text);
}

function foreignPlaceIn(text: string): string | null {
  const match = text.match(FOREIGN_PLACE_RE);
  return match?.[1]?.toLowerCase() ?? null;
}

/** Drop awards a statewide Arkansas council cannot enter. */
export function isGeographicallyImpossible(item: Opportunity): boolean {
  const text = blob(item);
  const head = heading(item);
  const title = (item.title ?? "").toLowerCase();

  // Embassy / consulate / PAS / U.S. Mission awards are for work in that country.
  if (isForeignMission(head) && !mentionsHome(head)) {
    return true;
  }

  // Named foreign country, nationality, or region in the title or agency.
  if (
    (foreignPlaceIn(head) || FOREIGN_REGIONS.test(head)) &&
    !mentionsHome(head)
  ) {
    return true;
  }

  if (SITE_SPECIFIC.some((re) => re.test(text)) && !mentionsHome(text)) {
    return true;
  }

  const titleState = otherStateIn(title);
  if (titleState && !mentionsHome(title) && !NATIONAL.test(title)) {
    return true;
  }

  const limited =
    /\b(only|limited to|restricted to|serving only|located (?:in|at)|site[-\s]?specific(?: to)?)\b/.test(
      text,
    );
  const otherState = otherStateIn(text);
  if (limited && otherState && !mentionsHome(text)) return true;

  if (
    otherState &&
    !mentionsHome(text) &&
    !NATIONAL.test(text) &&
    /\b(installation|air force base|naval station|this (?:base|site|location|county|city|state) only)\b/.test(
      text,
    )
  ) {
    return true;
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
