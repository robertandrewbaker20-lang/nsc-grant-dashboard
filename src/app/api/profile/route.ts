import { NextResponse } from "next/server";
import { loadProfile, saveProfile } from "@/lib/profile";
import type { SearchProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await loadProfile();
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  let body: { profile?: SearchProfile };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.profile) {
    return NextResponse.json({ error: "Missing profile" }, { status: 400 });
  }
  const profile = await saveProfile(body.profile);
  return NextResponse.json({ profile });
}
