import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/profile";
import {
  runFederalSearch,
  runScoreSearch,
  runSearch,
  runSourceSearch,
} from "@/lib/search";
import type { Opportunity, SearchProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function emptyResult(errors: string[]) {
  return {
    fetched: 0,
    evaluated: 0,
    errors,
    opportunities: [],
    searchedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  let profile = await loadProfile();
  let mode = "complete";
  let seed: Opportunity[] = [];
  try {
    const body = (await request.json()) as {
      profile?: SearchProfile;
      mode?: string;
      seed?: Opportunity[];
    };
    if (body?.profile) {
      profile = { ...profile, ...body.profile };
    }
    if (body?.mode) mode = body.mode;
    if (Array.isArray(body?.seed)) seed = body.seed;
  } catch {
    // empty body uses saved profile
  }

  try {
    const result =
      mode === "federal"
        ? await runFederalSearch(profile)
        : mode === "sources"
          ? await runSourceSearch(profile, seed)
          : mode === "score"
            ? await runScoreSearch(profile, seed)
            : await runSearch(profile, seed);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      emptyResult([error instanceof Error ? error.message : "Search failed"]),
      { status: 500 },
    );
  }
}
