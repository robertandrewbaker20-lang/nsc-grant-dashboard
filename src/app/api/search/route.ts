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
  let dismissed: string[] = [];
  try {
    const body = (await request.json()) as {
      profile?: SearchProfile;
      mode?: string;
      seed?: Opportunity[];
      dismissed?: string[];
    };
    if (body?.profile) {
      profile = { ...profile, ...body.profile };
    }
    if (body?.mode) mode = body.mode;
    if (Array.isArray(body?.seed)) seed = body.seed;
    if (Array.isArray(body?.dismissed)) {
      dismissed = body.dismissed.filter((key) => typeof key === "string");
    }
  } catch {
    // empty body uses saved profile
  }

  try {
    const result =
      mode === "federal"
        ? await runFederalSearch(profile, dismissed)
        : mode === "sources"
          ? await runSourceSearch(profile, seed, dismissed)
          : mode === "score"
            ? await runScoreSearch(profile, seed, dismissed)
            : await runSearch(profile, seed, dismissed);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      emptyResult([error instanceof Error ? error.message : "Search failed"]),
      { status: 500 },
    );
  }
}
