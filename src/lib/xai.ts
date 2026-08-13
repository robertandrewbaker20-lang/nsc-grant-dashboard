import type { Opportunity, Recommendation, SearchProfile } from "./types";
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

export async function searchWebOpportunities(
  profile: SearchProfile,
): Promise<{ opportunities: Opportunity[]; errors: string[] }> {
  const errors: string[] = [];
  try {
    const prompt = `Find currently open or recurring grants, foundations, corporate giving, and state programs that could fund this organization.

${profileToPrompt(profile)}

Search official sources: Grants.gov, USDA RD, EPA EE, OJJDP, AmeriCorps, Arkansas Community Foundation, Walton Family Foundation, Winthrop Rockefeller Foundation, Entergy, Tyson, Walmart.org, ADPT outdoor grants, AGFC wildlife education, Hearst Foundations, REI Cooperative Action Fund.

Return ONLY a JSON array (max 18 items):
[{
  "title": "",
  "agency": "",
  "url": "",
  "deadline": "YYYY-MM-DD or null",
  "funderType": "federal|state|foundation|corporate|civic",
  "description": "1-2 sentences",
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
      const funderType = String(r.funderType ?? "foundation");
      opportunities.push({
        id: `xai:${index}:${title.slice(0, 40)}`,
        source: "xAI web search",
        title,
        agency: r.agency ? String(r.agency) : null,
        description: r.description ? String(r.description) : null,
        url: r.url ? String(r.url) : null,
        postedDate: null,
        deadline: r.deadline ? String(r.deadline) : null,
        funderType: ["federal", "state", "foundation", "corporate", "civic"].includes(
          funderType,
        )
          ? (funderType as Opportunity["funderType"])
          : "other",
        fitScore: null,
        recommendation: null,
        summary: null,
        strengths: [],
        concerns: [],
        partnershipRequired: Boolean(r.partnershipRequired),
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
  const prompt = `You are a grant strategist for ${profile.orgName}.

${profileToPrompt(profile)}

Score each opportunity 0-100. Prefer precise language: youth from low-income households, Title I schools, rural and small-town youth, first-generation campers — not "disenfranchised."

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
    })),
  )}

Return ONLY a JSON array:
[{
  "id": "",
  "fitScore": 0,
  "recommendation": "pursue|review|pass",
  "summary": "2 sentences",
  "strengths": ["..."],
  "concerns": ["..."],
  "partnershipRequired": false
}]`;

  const text = await xaiResponses(prompt, false);
  const rows = parseJsonArray(text);
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id === "string") byId.set(r.id, r);
  }

  return items.map((item) => {
    const ev = byId.get(item.id);
    if (!ev) return item;
    const rec = String(ev.recommendation ?? "review");
    const recommendation: Recommendation = ["pursue", "review", "pass"].includes(rec)
      ? (rec as Recommendation)
      : "review";
    return {
      ...item,
      fitScore: Math.min(100, Math.max(0, Number(ev.fitScore ?? 50))),
      recommendation,
      summary: ev.summary ? String(ev.summary) : item.summary,
      strengths: Array.isArray(ev.strengths) ? ev.strengths.map(String) : [],
      concerns: Array.isArray(ev.concerns) ? ev.concerns.map(String) : [],
      partnershipRequired: Boolean(ev.partnershipRequired) || item.partnershipRequired,
    };
  });
}
