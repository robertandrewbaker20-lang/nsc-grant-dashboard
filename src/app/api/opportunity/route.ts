import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/profile";
import type { Opportunity, SearchProfile } from "@/lib/types";
import { enrichOpportunity } from "@/lib/xai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: { opportunity?: Opportunity; profile?: SearchProfile };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.opportunity?.title) {
    return NextResponse.json({ error: "Missing opportunity" }, { status: 400 });
  }

  const profile = body.profile ?? (await loadProfile());

  try {
    const opportunity = await enrichOpportunity(profile, body.opportunity);
    return NextResponse.json({ opportunity });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Briefing failed" },
      { status: 500 },
    );
  }
}
