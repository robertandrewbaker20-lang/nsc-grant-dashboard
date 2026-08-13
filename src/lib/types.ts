export type FunderType =
  | "federal"
  | "state"
  | "foundation"
  | "corporate"
  | "civic";

export type Recommendation = "pursue" | "review" | "pass";

export interface SearchProfile {
  orgName: string;
  about: string;
  geography: string;
  keywords: string[];
  focusAreas: string[];
  lookingFor: string;
  matchCriteria: string;
  poorFit: string;
  funderTypes: FunderType[];
  agencies: string[];
}

export interface Opportunity {
  id: string;
  source: string;
  title: string;
  agency: string | null;
  description: string | null;
  url: string | null;
  postedDate: string | null;
  deadline: string | null;
  funderType: FunderType | "other";
  fitScore: number | null;
  recommendation: Recommendation | null;
  summary: string | null;
  strengths: string[];
  concerns: string[];
  partnershipRequired: boolean;
  overview: string | null;
  requirements: string[];
  eligibility: string | null;
  amount: string | null;
  howToApply: string | null;
  pocName: string | null;
  pocEmail: string | null;
  pocPhone: string | null;
  matchRequired: string | null;
  nextSteps: string[];
  timeline: string | null;
  enriched?: boolean;
}

export interface SearchResult {
  fetched: number;
  evaluated: number;
  errors: string[];
  opportunities: Opportunity[];
  searchedAt: string;
}

export function blankDetails(): Pick<
  Opportunity,
  | "overview"
  | "requirements"
  | "eligibility"
  | "amount"
  | "howToApply"
  | "pocName"
  | "pocEmail"
  | "pocPhone"
  | "matchRequired"
  | "nextSteps"
  | "timeline"
  | "enriched"
> {
  return {
    overview: null,
    requirements: [],
    eligibility: null,
    amount: null,
    howToApply: null,
    pocName: null,
    pocEmail: null,
    pocPhone: null,
    matchRequired: null,
    nextSteps: [],
    timeline: null,
    enriched: false,
  };
}
