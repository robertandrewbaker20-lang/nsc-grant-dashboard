"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import {
  readStoredProfile,
  readStoredResult,
  writeStoredResult,
} from "@/lib/client-store";
import { WATCHLIST } from "@/lib/watchlist";
import type { Opportunity, SearchProfile, SearchResult } from "@/lib/types";

function scoreClass(score: number | null) {
  if (score == null) return "bg-slate-200 text-slate-700";
  if (score >= 80) return "bg-[#274718] text-white";
  if (score >= 50) return "bg-[#83775f] text-white";
  return "bg-slate-300 text-slate-800";
}

type RecommendationFilter = "pursue" | "review" | "pass";

export function Dashboard({ initialProfile }: { initialProfile: SearchProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [filter, setFilter] = useState<"all" | RecommendationFilter>("all");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  useEffect(() => {
    const storedProfile = readStoredProfile();
    if (storedProfile) setProfile(storedProfile);
    const storedResult = readStoredResult();
    if (storedResult) {
      setResult(storedResult);
      setStatus(
        `Last search: ${storedResult.fetched} listings, scored ${storedResult.evaluated}.`,
      );
    }
  }, []);

  const rows = useMemo(() => {
    const list = result?.opportunities ?? [];
    if (filter === "all") return list;
    return list.filter((o) => o.recommendation === filter);
  }, [result, filter]);

  async function runSearch() {
    setRunning(true);
    setStatus(null);
    setSelected(null);
    try {
      const active = readStoredProfile() ?? profile;
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: active }),
      });
      const data = (await res.json()) as SearchResult;
      setResult(data);
      writeStoredResult(data);
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

  return (
    <div className="min-h-screen">
      <AppHeader active="results" />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-slate-600">
            Searching with {profile.keywords.length} saved keywords for{" "}
            {profile.orgName}. Change them under Search parameters.
          </p>
          <button
            type="button"
            onClick={runSearch}
            disabled={running}
            className="rounded bg-[#ce202a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {running ? "Searching…" : "Run search"}
          </button>
        </div>
        {status && <p className="text-sm text-slate-700">{status}</p>}

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
