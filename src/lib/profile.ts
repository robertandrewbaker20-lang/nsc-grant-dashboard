import { promises as fs } from "fs";
import path from "path";
import type { SearchProfile } from "./types";
import defaults from "../../data/default-profile.json";

const PROFILE_PATH = path.join(process.cwd(), "data", "search-profile.json");

export function defaultProfile(): SearchProfile {
  return defaults as SearchProfile;
}

export async function loadProfile(): Promise<SearchProfile> {
  try {
    const text = await fs.readFile(PROFILE_PATH, "utf8");
    return { ...defaultProfile(), ...JSON.parse(text) };
  } catch {
    return defaultProfile();
  }
}

export async function saveProfile(profile: SearchProfile): Promise<SearchProfile> {
  const next = { ...defaultProfile(), ...profile };
  try {
    await fs.mkdir(path.dirname(PROFILE_PATH), { recursive: true });
    await fs.writeFile(PROFILE_PATH, JSON.stringify(next, null, 2));
  } catch {
    // Vercel filesystem is read-only except /tmp — keep in-memory response
  }
  return next;
}

export function profileToPrompt(profile: SearchProfile): string {
  return [
    `Organization: ${profile.orgName}`,
    `About:\n${profile.about}`,
    `Geography:\n${profile.geography}`,
    `Focus areas:\n${profile.focusAreas.map((f) => `- ${f}`).join("\n")}`,
    `Keywords: ${profile.keywords.join(", ")}`,
    `Agencies / portals: ${profile.agencies.join(", ")}`,
    `Funder types: ${profile.funderTypes.join(", ")}`,
    `Looking for:\n${profile.lookingFor}`,
    `Match criteria:\n${profile.matchCriteria}`,
    `Poor fit:\n${profile.poorFit}`,
  ].join("\n\n");
}
