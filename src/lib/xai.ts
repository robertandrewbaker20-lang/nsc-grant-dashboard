import type { Opportunity, Recommendation, SearchProfile } from "./types";
import { blankDetails } from "./types";
import { profileToPrompt } from "./profile";

const XAI_URL = "https://api.x.ai/v1/responses";
const MODEL = "grok-4.6";

function apiKey(): string {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) throw new Error("XAI_API_KEY is not configured");
  return key;
}

async function xaiResponses(input: string, useWebSearch: boolean): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    input: [{ role: "user", content: input }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search" }];
  }

  const response = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`xAI HTTP ${response.status}: ${text.slice(0, 400)}`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (data.output_text?.trim()) return data.output_text;

  const chunks: string[] = [];
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.text) chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

function parseJsonArray(text: string): unknown[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function asText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text && text !== "null" ? text : null;
}

function funderFrom(value: unknown): Opportunity["funderType"] {
  const funderType = String(value ?? "foundation");
  return ["federal", "state", "foundation", "corporate", "civic"].includes(funderType)
    ? (funderType as Opportunity["funderType"])
    : "other";
}

export async function searchWebOpportunities(
  profile: SearchProfile,
): Promise<{ opportunities: Opportunity[]; errors: string[] }> {
  const errors: string[] = [];
  try {
    const prompt = `Find currently open or recurring grants, foundations, corporate giving, and state programs that could fund this organization.

${profileToPrompt(profile)}

Search official sources: Grants.gov, USDA RD, EPA EE, OJJDP, AmeriCorps, Arkansas Community Foundation, Walton Family Foundation, Winthrop Rockefeller Foundation, Entergy, Tyson, Walmart.org, ADPT outdoor grants, AGFC wildlife education, Hearst Foundations, REI Cooperative Action Fund.

Do NOT include awards that an Arkansas council cannot enter: other-state-only programs, or site-specific vehicles (Wright-Patterson AFB STARBASE, a single Ohio installation, any named base outside Arkansas). Nationwide programs the council can apply to from Arkansas are fine.

Return ONLY a JSON array (max 16 items):
[{
  "title": "",
  "agency": "",
  "url": "",
  "deadline": "YYYY-MM-DD or rolling",
  "funderType": "federal|state|foundation|corporate|civic",
  "description": "1-2 sentences",
  "amount": "typical award range or unknown",
  "eligibility": "who can apply",
  "partnershipRequired": false
}]

Prefer real, named programs with real URLs. Skip generic advice.`;

    const text = await xaiResponses(prompt, true);
    const rows = parseJsonArray(text);
    const opportunities: Opportunity[] = [];

    rows.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const r = row as Record<string, unknown>;
      const title = String(r.title ?? "").trim();
      if (!title) return;
      opportunities.push({
        id: `xai:${index}:${title.slice(0, 40)}`,
        source: "xAI web search",
        title,
        agency: asText(r.agency),
        description: asText(r.description),
        url: asText(r.url),
        postedDate: null,
        deadline: asText(r.deadline),
        funderType: funderFrom(r.funderType),
        fitScore: null,
        recommendation: null,
        summary: null,
        strengths: [],
        concerns: [],
        partnershipRequired: Boolean(r.partnershipRequired),
        ...blankDetails(),
        amount: asText(r.amount),
        eligibility: asText(r.eligibility),
      });
    });

    return { opportunities, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "xAI search failed");
    return { opportunities: [], errors };
  }
}

export async function evaluateOpportunities(
  profile: SearchProfile,
  items: Opportunity[],
): Promise<Opportunity[]> {
  if (items.length === 0) return items;

  const batch = items.slice(0, 24);
  const prompt = `You are a grant strategist for ${profile.orgName}, an Arkansas-only Scouting council.

${profileToPrompt(profile)}

Score EACH opportunity 0-100. You MUST return one object for every id listed. Prefer precise language: youth from low-income households, Title I schools, rural and small-town youth, first-generation campers — not "disenfranchised."

If the award is site-specific to another state or installation (Ohio, Wright-Patterson AFB, a single STARBASE site the council cannot enter), set fitScore to 0 and recommendation to pass.

Opportunities:
${JSON.stringify(
    batch.map((o) => ({
      id: o.id,
      title: o.title,
      agency: o.agency,
      source: o.source,
      description: o.description,
      deadline: o.deadline,
      funderType: o.funderType,
      amount: o.amount,
      eligibility: o.eligibility,
    })),
  )}

Return ONLY a JSON array with one row per id:
[{
  "id": "",
  "title": "",
  "fitScore": 0,
  "recommendation": "pursue|review|pass",
  "summary": "2 sentences on council fit",
  "overview": "3-4 sentence program overview",
  "amount": "award size if known",
  "eligibility": "who may apply",
  "requirements": ["key requirement"],
  "howToApply": "application path in 1-3 sentences",
  "matchRequired": "none / percent / unknown",
  "timeline": "deadline or cycle",
  "pocName": "contact if known else null",
  "pocEmail": null,
  "pocPhone": null,
  "nextSteps": ["first action for council staff"],
  "strengths": ["..."],
  "concerns": ["..."],
  "partnershipRequired": false
}]`;

  const text = await xaiResponses(prompt, false);
  const rows = parseJsonArray(text);
  const byId = new Map<string, Record<string, unknown>>();
  const byTitle = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id === "string") byId.set(r.id, r);
    if (typeof r.title === "string") byTitle.set(r.title.trim().toLowerCase(), r);
  }

  return items.map((item) => {
    const ev = byId.get(item.id) ?? byTitle.get(item.title.trim().toLowerCase());
    if (!ev) return item;
    const rec = String(ev.recommendation ?? "review");
    const recommendation: Recommendation = ["pursue", "review", "pass"].includes(rec)
      ? (rec as Recommendation)
      : "review";
    const rawScore = Number(ev.fitScore);
    return {
      ...item,
      fitScore: Number.isFinite(rawScore) ? Math.min(100, Math.max(0, rawScore)) : 50,
      recommendation,
      summary: asText(ev.summary) ?? item.summary,
      strengths: asStringList(ev.strengths),
      concerns: asStringList(ev.concerns),
      partnershipRequired: Boolean(ev.partnershipRequired) || item.partnershipRequired,
      overview: asText(ev.overview) ?? item.overview,
      requirements: asStringList(ev.requirements),
      eligibility: asText(ev.eligibility) ?? item.eligibility,
      amount: asText(ev.amount) ?? item.amount,
      howToApply: asText(ev.howToApply) ?? item.howToApply,
      pocName: asText(ev.pocName),
      pocEmail: asText(ev.pocEmail),
      pocPhone: asText(ev.pocPhone),
      matchRequired: asText(ev.matchRequired),
      nextSteps: asStringList(ev.nextSteps),
      timeline: asText(ev.timeline) ?? item.deadline,
    };
  });
}

export async function enrichOpportunity(
  profile: SearchProfile,
  item: Opportunity,
): Promise<Opportunity> {
  const prompt = `Research this funding opportunity and write a briefing for ${profile.orgName}, a Scouting America council in Arkansas.

${profileToPrompt(profile)}

Opportunity:
${JSON.stringify({
    title: item.title,
    agency: item.agency,
    url: item.url,
    source: item.source,
    description: item.description,
    deadline: item.deadline,
    funderType: item.funderType,
  })}

Browse the official listing if a URL is present. Return ONLY JSON:
{
  "overview": "4-6 sentence overview",
  "amount": "award range or typical gift",
  "eligibility": "who can apply, 501(c)(3) notes",
  "requirements": ["specific requirements"],
  "howToApply": "steps, portal, LOI vs full proposal",
  "matchRequired": "cash/in-kind/none/unknown",
  "timeline": "deadlines and cycles",
  "pocName": "named contact or office",
  "pocEmail": "email or null",
  "pocPhone": "phone or null",
  "nextSteps": ["3 concrete staff actions"],
  "summary": "council-specific fit",
  "strengths": ["..."],
  "concerns": ["..."],
  "partnershipRequired": false
}

If a fact is unknown, say so — do not invent a person or email.`;

  const text = await xaiResponses(prompt, true);
  const ev = parseJsonObject(text);
  if (!ev) return { ...item, enriched: true };

  return {
    ...item,
    enriched: true,
    overview: asText(ev.overview) ?? item.overview,
    amount: asText(ev.amount) ?? item.amount,
    eligibility: asText(ev.eligibility) ?? item.eligibility,
    requirements: asStringList(ev.requirements).length
      ? asStringList(ev.requirements)
      : item.requirements,
    howToApply: asText(ev.howToApply) ?? item.howToApply,
    matchRequired: asText(ev.matchRequired) ?? item.matchRequired,
    timeline: asText(ev.timeline) ?? item.timeline,
    pocName: asText(ev.pocName) ?? item.pocName,
    pocEmail: asText(ev.pocEmail) ?? item.pocEmail,
    pocPhone: asText(ev.pocPhone) ?? item.pocPhone,
    nextSteps: asStringList(ev.nextSteps).length
      ? asStringList(ev.nextSteps)
      : item.nextSteps,
    summary: asText(ev.summary) ?? item.summary,
    strengths: asStringList(ev.strengths).length
      ? asStringList(ev.strengths)
      : item.strengths,
    concerns: asStringList(ev.concerns).length ? asStringList(ev.concerns) : item.concerns,
    partnershipRequired: Boolean(ev.partnershipRequired) || item.partnershipRequired,
  };
}
