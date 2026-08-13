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

function Field({
  label,
  value,
  onChange,
  rows = 6,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  wide?: boolean;
}) {
  return (
    <label className={`block text-sm font-bold text-[#383636] ${wide ? "md:col-span-2" : ""}`}>
      {label}
      <textarea
        rows={rows}
        className="mt-1.5 w-full rounded-xl border border-[#afd4ff] bg-white p-3 font-normal text-sm leading-relaxed text-[#383636] outline-none focus:border-[#255097]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
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
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      });
      setStatus("Saved. Return to Portfolio and run a scan.");
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
    <section className="rounded-2xl border border-[#68acfb]/50 bg-white/85 p-6 backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#255097]">
            Search thesis
          </p>
          <h2 className="mt-1 text-xl font-black text-[#383636]">What the council is seeking</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#5b6573]">
            These fields drive Grants.gov and xAI search. Save, then run a scan from
            Portfolio.
          </p>
        </div>
        <button
          type="button"
          onClick={saveCriteria}
          disabled={saving}
          className="rounded-full bg-[#ce202a] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save parameters"}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Keywords (one per line)" value={keywordsText} onChange={setKeywordsText} />
        <Field label="Focus areas" value={focusText} onChange={setFocusText} />
        <Field
          label="Geography"
          value={profile.geography}
          rows={5}
          onChange={(geography) => setProfile((p) => ({ ...p, geography }))}
        />
        <Field
          label="Agencies and portals"
          value={agenciesText}
          rows={5}
          onChange={setAgenciesText}
        />
        <Field
          label="Looking for"
          value={profile.lookingFor}
          rows={5}
          wide
          onChange={(lookingFor) => setProfile((p) => ({ ...p, lookingFor }))}
        />
        <Field
          label="Match criteria"
          value={profile.matchCriteria}
          rows={5}
          onChange={(matchCriteria) => setProfile((p) => ({ ...p, matchCriteria }))}
        />
        <Field
          label="Poor fit"
          value={profile.poorFit}
          rows={5}
          onChange={(poorFit) => setProfile((p) => ({ ...p, poorFit }))}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-bold text-[#383636]">Funder types</p>
        <div className="flex flex-wrap gap-2">
          {FUNDER_OPTIONS.map((type) => {
            const on = profile.funderTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFunder(type)}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  on
                    ? "bg-[#255097] text-white"
                    : "border border-[#255097]/25 text-[#255097]"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>
      {status && <p className="mt-4 text-sm text-[#255097]">{status}</p>}
    </section>
  );
}
