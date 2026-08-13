"use client";

import { useState } from "react";
import { useStoredProfile, writeStoredProfile } from "@/lib/client-store";
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
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  wide?: boolean;
  hint?: string;
}) {
  return (
    <label className={`nsc-label ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {hint && <span className="mt-0.5 block text-xs font-normal text-muted">{hint}</span>}
      <textarea
        rows={rows}
        className="nsc-input mt-2 font-normal"
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
  const stored = useStoredProfile(initialProfile);
  const source = stored === initialProfile ? "server" : "browser";
  return <ParametersFields key={source} initialProfile={stored} />;
}

function ParametersFields({ initialProfile }: { initialProfile: SearchProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [keywordsText, setKeywordsText] = useState(listToText(initialProfile.keywords));
  const [focusText, setFocusText] = useState(listToText(initialProfile.focusAreas));
  const [agenciesText, setAgenciesText] = useState(listToText(initialProfile.agencies));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    <section className="nsc-card p-6 sm:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-nsc-navy-link">
            Search thesis
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            What the council is seeking
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            These fields drive Grants.gov and web search. Save, then run a scan from
            Portfolio.
          </p>
        </div>
        <button
          type="button"
          onClick={saveCriteria}
          disabled={saving}
          className="rounded-md bg-nsc-navy-link px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#014274] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save parameters"}
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Keywords"
          hint="One per line"
          value={keywordsText}
          onChange={setKeywordsText}
        />
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
          hint="Listings matching this guidance stay out of Portfolio"
          value={profile.poorFit}
          rows={5}
          onChange={(poorFit) => setProfile((p) => ({ ...p, poorFit }))}
        />
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="nsc-label mb-3">Funder types</p>
        <div className="flex flex-wrap gap-2">
          {FUNDER_OPTIONS.map((type) => {
            const on = profile.funderTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFunder(type)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  on
                    ? "bg-nsc-navy text-white"
                    : "border border-line bg-white text-muted hover:border-nsc-navy hover:text-nsc-navy"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>
      {status && (
        <p className="mt-5 rounded-lg border border-nsc-row/80 bg-[#f4f8fd] px-4 py-3 text-sm font-semibold text-nsc-navy-deep">
          {status}
        </p>
      )}
    </section>
  );
}
