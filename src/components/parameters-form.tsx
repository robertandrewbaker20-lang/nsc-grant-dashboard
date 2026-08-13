"use client";

import { useEffect, useState } from "react";
import { readStoredProfile, writeStoredProfile } from "@/lib/client-store";
import type { FunderType, SearchProfile } from "@/lib/types";

const FUNDER_OPTIONS: FunderType[] = [
  "federal",
  "state",
  "foundation",
  "corporate",
  "civic",
];

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ParametersForm({
  initialProfile,
}: {
  initialProfile: SearchProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [keywordsText, setKeywordsText] = useState(listToText(initialProfile.keywords));
  const [focusText, setFocusText] = useState(listToText(initialProfile.focusAreas));
  const [agenciesText, setAgenciesText] = useState(listToText(initialProfile.agencies));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = readStoredProfile();
    if (!stored) return;
    setProfile(stored);
    setKeywordsText(listToText(stored.keywords));
    setFocusText(listToText(stored.focusAreas));
    setAgenciesText(listToText(stored.agencies));
  }, []);

  function currentProfile(): SearchProfile {
    return {
      ...profile,
      keywords: textToList(keywordsText),
      focusAreas: textToList(focusText),
      agencies: textToList(agenciesText),
    };
  }

  async function saveCriteria() {
    setSaving(true);
    setStatus(null);
    try {
      const next = currentProfile();
      writeStoredProfile(next);
      setProfile(next);
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      });
      if (!res.ok) {
        setStatus("Saved in this browser. Return to Results and run a search.");
        return;
      }
      setStatus("Search parameters saved. Return to Results and run a search.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleFunder(type: FunderType) {
    setProfile((p) => {
      const has = p.funderTypes.includes(type);
      return {
        ...p,
        funderTypes: has
          ? p.funderTypes.filter((t) => t !== type)
          : [...p.funderTypes, type],
      };
    });
  }

  return (
    <section className="rounded-lg border border-[#68acfb] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#255097]">Search parameters</h2>
          <p className="text-sm text-slate-600">
            These keywords, focus areas, and funder types drive Grants.gov and xAI
            search. Save here, then run the search from Results.
          </p>
        </div>
        <button
          type="button"
          onClick={saveCriteria}
          disabled={saving}
          className="rounded bg-[#ce202a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold">
          Keywords (one per line)
          <textarea
            className="mt-1 h-32 w-full rounded border border-slate-300 p-2 font-normal"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
          />
        </label>
        <label className="block text-sm font-bold">
          Focus areas
          <textarea
            className="mt-1 h-32 w-full rounded border border-slate-300 p-2 font-normal"
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
          />
        </label>
        <label className="block text-sm font-bold">
          Geography
          <textarea
            className="mt-1 h-24 w-full rounded border border-slate-300 p-2 font-normal"
            value={profile.geography}
            onChange={(e) =>
              setProfile((p) => ({ ...p, geography: e.target.value }))
            }
          />
        </label>
        <label className="block text-sm font-bold">
          Agencies and portals to prefer
          <textarea
            className="mt-1 h-24 w-full rounded border border-slate-300 p-2 font-normal"
            value={agenciesText}
            onChange={(e) => setAgenciesText(e.target.value)}
          />
        </label>
        <label className="block text-sm font-bold md:col-span-2">
          Looking for
          <textarea
            className="mt-1 h-24 w-full rounded border border-slate-300 p-2 font-normal"
            value={profile.lookingFor}
            onChange={(e) =>
              setProfile((p) => ({ ...p, lookingFor: e.target.value }))
            }
          />
        </label>
        <label className="block text-sm font-bold">
          Match criteria
          <textarea
            className="mt-1 h-24 w-full rounded border border-slate-300 p-2 font-normal"
            value={profile.matchCriteria}
            onChange={(e) =>
              setProfile((p) => ({ ...p, matchCriteria: e.target.value }))
            }
          />
        </label>
        <label className="block text-sm font-bold">
          Poor fit
          <textarea
            className="mt-1 h-24 w-full rounded border border-slate-300 p-2 font-normal"
            value={profile.poorFit}
            onChange={(e) =>
              setProfile((p) => ({ ...p, poorFit: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FUNDER_OPTIONS.map((type) => {
          const on = profile.funderTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleFunder(type)}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                on ? "bg-[#255097] text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
      {status && <p className="mt-3 text-sm text-slate-700">{status}</p>}
    </section>
  );
}
