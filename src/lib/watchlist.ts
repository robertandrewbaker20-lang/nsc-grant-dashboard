import { blankDetails } from "./types";
import type { FunderType, Opportunity } from "./types";

export const WATCHLIST = [
  {
    name: "Grants.gov",
    url: "https://www.grants.gov/",
    note: "Federal open and forecasted awards",
  },
  {
    name: "USDA Community Facilities",
    url: "https://www.rd.usda.gov/programs-services/community-facilities/community-facilities-direct-loan-grant-program",
    note: "Rural camp and hall capital",
  },
  {
    name: "OJJDP Mentoring",
    url: "https://ojjdp.ojp.gov/programs/mentoring",
    note: "Youth mentoring — historic Scouting fit",
  },
  {
    name: "EPA Environmental Education",
    url: "https://www.epa.gov/education/grants",
    note: "Outdoor and conservation education, Region 6",
  },
  {
    name: "AmeriCorps",
    url: "https://americorps.gov/funding-opportunities",
    note: "Staff capacity, VISTA, State & National",
  },
  {
    name: "Arkansas Outdoor Grants (ADPT)",
    url: "https://adpht.arkansas.gov/office-of-outdoor-recreation/arkansas-outdoor-grants/",
    note: "Trails and rec facilities — often needs a city/county lead",
  },
  {
    name: "AGFC Wildlife Education",
    url: "https://www.agfc.com/education/wildlife-education-grants/",
    note: "Conservation education; partner with schools",
  },
  {
    name: "Arkansas Community Foundation",
    url: "https://www.arcf.org/",
    note: "Statewide + county affiliates",
  },
  {
    name: "Walton Family Foundation",
    url: "https://www.waltonfamilyfoundation.org/",
    note: "NWA, Delta, K-12, outdoors",
  },
  {
    name: "Winthrop Rockefeller Foundation",
    url: "https://www.wrfoundation.org/",
    note: "Education and economic mobility in Arkansas",
  },
  {
    name: "Walmart.org / Spark Good",
    url: "https://walmart.org/how-we-give/grantee-search",
    note: "Local store grants and larger cycles",
  },
  {
    name: "Entergy Charitable Foundation",
    url: "https://www.entergy.com/communities/grants",
    note: "Education, environment, service territory",
  },
  {
    name: "Tyson Community Giving",
    url: "https://www.tysonfoods.com/who-we-are/giving-back/community-giving",
    note: "Arkansas HQ; youth and plant communities",
  },
  {
    name: "Hearst Foundations",
    url: "https://www.hearstfdn.org/",
    note: "Education and youth; often funds Scouting",
  },
  {
    name: "REI Cooperative Action Fund",
    url: "https://www.reifund.org/",
    note: "Outdoor access and belonging",
  },
];

function funderTypeFromWatch(name: string, note: string): FunderType {
  const text = `${name} ${note}`.toLowerCase();
  if (/grants\.gov|usda|ojjdp|epa|americorps/.test(text)) return "federal";
  if (/adpt|agfc|arkansas outdoor/.test(text)) return "state";
  if (/walmart|entergy|tyson/.test(text)) return "corporate";
  return "foundation";
}

export function watchlistOpportunities(): Opportunity[] {
  return WATCHLIST.filter((item) => !/grants\.gov/i.test(item.name)).map((item) => ({
    id: `watch:${item.url}`,
    source: "Council source network",
    title: item.name,
    agency: item.name,
    description: item.note,
    url: item.url,
    postedDate: null,
    deadline: "rolling",
    funderType: funderTypeFromWatch(item.name, item.note),
    fitScore: null,
    recommendation: "review" as const,
    summary: item.note,
    strengths: [],
    concerns: [],
    partnershipRequired: false,
    ...blankDetails(),
  }));
}
