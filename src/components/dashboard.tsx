"use client";

import { useMemo, useState } from "react";
import { WATCHLIST } from "@/lib/watchlist";
import type {
  FunderType,
  Opportunity,
  SearchProfile,
  SearchResult,
} from "@/lib/types";

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

function scoreClass(score: number | null) {
  if (score == null) return "bg-slate-200 text-slate-700";
  if (score >= 80) return "bg-[#274718] text-white";
  if (score >= 50) return "bg-[#83775f] text-white";
  return "bg-slate-300 text-slate-800";
}

export function Dashboard({ initialProfile }: { initialProfile: SearchProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [keywordsText, setKeywordsText] = useState(listToText(initialProfile.keywords));
  const [focusText, setFocusText] = useState(listToText(initialProfile.focusAreas));
  const [agenciesText, setAgenciesText] = useState(listToText(initialProfile.agencies));
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [filter, setFilter] = useState<"all" | RecommendationFilter>("all");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  type RecommendationFilter = "pursue" | "review" | "pass";

  const currentProfile = (): SearchProfile => ({
    ...profile,
    keywords: textToList(keywordsText),
    focusAreas: textToList(focusText),
    agencies: textToList(agenciesText),
  });

  const rows = useMemo(() => {
    const list = result?.opportunities ?? [];
    if (filter === "all") return list;
    return list.filter((o) => o.recommendation === filter);
  }, [result, filter]);

  async function saveCriteria() {
    setSaving(true);
    setStatus(null);
    try {
      const next = currentProfile();
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProfile(data.profile);
      setStatus("Search parameters saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function runSearch() {
    setRunning(true);
    setStatus(null);
    setSelected(null);
    try {
      const next = currentProfile();
      setProfile(next);
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: next }),
      });
      const data = (await res.json()) as SearchResult;
      setResult(data);
      const errNote = data.errors.length ? ` (${data.errors.length} notes)` : "";
      setStatus(
        `Found ${data.fetched} listings, scored ${data.evaluated}${errNote}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Search failed");
    } finally {
      setRunning(false);
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
    <div className="min-h-screen">
      <header className="border-b-4 border-[#ce202a] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Natural State Council" className="h-12 w-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#255097]">
                Scouting America · Arkansas
              </p>
              <h1 className="text-xl font-black text-[#383636]">Grant Finder</h1>
            </div>
          </div>
          <a
            href="https://www.naturalstatecouncil.org/"
            className="text-sm font-bold"
            target="_blank"
            rel="noreferrer"
          >
            naturalstatecouncil.org
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="rounded-lg border border-[#68acfb] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#255097]">Search parameters</h2>
              <p className="text-sm text-slate-600">
                Change keywords, focus areas, and funder types, then run a search.
                Grants.gov plus xAI web search score each listing for council fit.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveCriteria}
                disabled={saving}
                className="rounded border border-[#255097] px-4 py-2 text-sm font-bold text-[#255097] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={runSearch}
                disabled={running}
                className="rounded bg-[#ce202a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {running ? "Searching…" : "Run search"}
              </button>
            </div>
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
                    on
                      ? "bg-[#255097] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
          {status && <p className="mt-3 text-sm text-slate-700">{status}</p>}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <h2 className="font-bold text-[#255097]">Results</h2>
              <div className="flex gap-1 text-xs font-bold">
                {(["all", "pursue", "review", "pass"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded px-2 py-1 capitalize ${
                      filter === key
                        ? "bg-[#ce202a] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#68acfb] text-[#1a2f4d]">
                    <th className="px-3 py-2">Fit</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Funder</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        Run a search to list federal, state, foundation, and
                        corporate opportunities.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={`cursor-pointer ${
                        i % 2 === 0 ? "bg-[#AFD4FF]/40" : "bg-white"
                      } ${selected?.id === row.id ? "outline outline-2 outline-[#ce202a]" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${scoreClass(row.fitScore)}`}
                        >
                          {row.fitScore ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold">{row.title}</td>
                      <td className="px-3 py-2">{row.agency ?? row.source}</td>
                      <td className="px-3 py-2 capitalize">{row.funderType}</td>
                      <td className="px-3 py-2">{row.deadline ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div className="border-t border-slate-200 p-4">
                <h3 className="text-lg font-bold">{selected.title}</h3>
                <p className="text-sm text-slate-600">
                  {selected.agency} · {selected.source}
                  {selected.partnershipRequired ? " · Partnership likely required" : ""}
                </p>
                {selected.summary && <p className="mt-2 text-sm">{selected.summary}</p>}
                {selected.description && (
                  <p className="mt-2 text-sm text-slate-700">{selected.description}</p>
                )}
                {selected.strengths.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase text-[#274718]">Strengths</p>
                    <ul className="list-disc pl-5 text-sm">
                      {selected.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.concerns.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase text-[#ce202a]">Watch-outs</p>
                    <ul className="list-disc pl-5 text-sm">
                      {selected.concerns.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-bold"
                  >
                    Open listing →
                  </a>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <img src="/fleur.png" alt="" className="h-8 w-8" />
                <h2 className="font-bold text-[#255097]">Where to look</h2>
              </div>
              <ul className="space-y-2 text-sm">
                {WATCHLIST.map((item) => (
                  <li key={item.url}>
                    <a href={item.url} target="_blank" rel="noreferrer" className="font-bold">
                      {item.name}
                    </a>
                    <p className="text-xs text-slate-600">{item.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
