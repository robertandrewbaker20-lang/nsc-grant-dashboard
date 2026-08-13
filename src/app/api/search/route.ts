import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/profile";
import { runSearch } from "@/lib/search";
import type { SearchProfile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  let profile = await loadProfile();
  try {
    const body = (await request.json()) as { profile?: SearchProfile };
    if (body?.profile) {
      profile = { ...profile, ...body.profile };
    }
  } catch {
    // empty body uses saved profile
  }

  try {
    const result = await runSearch(profile);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        fetched: 0,
        evaluated: 0,
        errors: [error instanceof Error ? error.message : "Search failed"],
        opportunities: [],
        searchedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
