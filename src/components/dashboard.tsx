"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { OpportunityDetail } from "@/components/opportunity-detail";
import {
  readStoredProfile,
  readStoredResult,
  writeStoredResult,
} from "@/lib/client-store";
import { WATCHLIST } from "@/lib/watchlist";
import type { Opportunity, SearchProfile, SearchResult } from "@/lib/types";

type RecommendationFilter = "pursue" | "review" | "pass";

function formatDeadline(value: string | null) {
  if (!value) return "Open / rolling";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function recStyle(rec: Opportunity["recommendation"]) {
  if (rec === "pursue") return "bg-[#274718] text-white";
  if (rec === "review") return "bg-[#83775f] text-white";
  if (rec === "pass") return "bg-slate-400 text-white";
  return "bg-slate-200 text-slate-700";
}

function barColor(rec: Opportunity["recommendation"]) {
  if (rec === "pursue") return "bg-[#274718]";
  if (rec === "review") return "bg-[#83775f]";
  if (rec === "pass") return "bg-slate-300";
  return "bg-[#68acfb]";
}

export function Dashboard({ initialProfile }: { initialProfile: SearchProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [filter, setFilter] = useState<"all" | RecommendationFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const selected = rows.find((o) => o.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const list = result?.opportunities ?? [];
    return {
      total: list.length,
      pursue: list.filter((o) => o.recommendation === "pursue").length,
      review: list.filter((o) => o.recommendation === "review").length,
    };
  }, [result]);

  function persist(next: SearchResult) {
    setResult(next);
    writeStoredResult(next);
  }

  async function runSearch() {
    setRunning(true);
    setStatus(null);
    setSelectedId(null);
    try {
      const active = readStoredProfile() ?? profile;
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: active }),
      });
      const data = (await res.json()) as SearchResult;
      persist(data);
      const errNote = data.errors.length ? ` (${data.errors.length} notes)` : "";
      setStatus(`Found ${data.fetched} listings, scored ${data.evaluated}${errNote}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Search failed");
    } finally {
      setRunning(false);
    }
  }

  async function loadBriefing() {
    if (!selected) return;
    setEnriching(true);
    try {
      const active = readStoredProfile() ?? profile;
      const res = await fetch("/api/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: selected, profile: active }),
      });
      const data = (await res.json()) as { opportunity?: Opportunity; error?: string };
      if (!res.ok || !data.opportunity) {
        throw new Error(data.error || "Briefing failed");
      }
      if (result) {
        persist({
          ...result,
          opportunities: result.opportunities.map((item) =>
            item.id === data.opportunity!.id ? data.opportunity! : item,
          ),
        });
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Briefing failed");
    } finally {
      setEnriching(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader active="results" />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#255097]">
              Opportunity portfolio
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              {profile.orgName}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[#5c6776]">
              {profile.keywords.length} active keywords. Click a card for overview,
              requirements, contact, amount, and how to apply.
            </p>
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={running}
            className="rounded-md bg-[#ce202a] px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {running ? "Searching…" : "Run search"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["In portfolio", stats.total],
            ["Pursue", stats.pursue],
            ["Review", stats.review],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-[#d5deea] bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c6776]">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black text-[#1c2430]">{value}</p>
            </div>
          ))}
        </div>

        {status && (
          <p className="rounded-lg border border-[#d5deea] bg-white px-4 py-2 text-sm text-[#5c6776]">
            {status}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {(["all", "pursue", "review", "pass"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                filter === key
                  ? "bg-[#ce202a] text-white"
                  : "bg-white text-[#5c6776] ring-1 ring-[#d5deea]"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <section
          className={`grid gap-5 ${selected ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]" : "lg:grid-cols-[minmax(0,1fr)_280px]"}`}
        >
          <div className="space-y-3">
            {rows.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#d5deea] bg-white px-6 py-16 text-center text-sm text-[#5c6776]">
                Run a search to build the portfolio of federal, state, foundation,
                and corporate opportunities.
              </div>
            )}

            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id === selectedId ? null : row.id)}
                className={`flex w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                  selectedId === row.id
                    ? "border-[#ce202a] ring-2 ring-[#ce202a]/20"
                    : "border-[#d5deea] hover:border-[#68acfb]"
                }`}
              >
                <span className={`w-1.5 shrink-0 ${barColor(row.recommendation)}`} />
                <span className="min-w-0 flex-1 px-4 py-3.5">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-black leading-snug text-[#1c2430]">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-[#5c6776]">
                        {row.agency ?? row.source}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${recStyle(row.recommendation)}`}
                    >
                      {row.fitScore ?? "—"} {row.recommendation ?? ""}
                    </span>
                  </span>
                  <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#1c2430]">
                    <span className="capitalize">
                      <span className="text-[#5c6776]">Type </span>
                      {row.funderType}
                    </span>
                    <span>
                      <span className="text-[#5c6776]">Deadline </span>
                      {formatDeadline(row.deadline)}
                    </span>
                    {row.amount && (
                      <span>
                        <span className="text-[#5c6776]">Amount </span>
                        {row.amount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]">
              <OpportunityDetail
                item={selected}
                loading={enriching}
                onClose={() => setSelectedId(null)}
                onEnrich={loadBriefing}
              />
            </div>
          ) : (
            <aside className="rounded-2xl border border-[#d5deea] bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-fit">
              <div className="mb-3 flex items-center gap-2">
                <img src="/fleur.png" alt="" className="h-7 w-7" />
                <h2 className="text-sm font-black text-[#255097]">Priority sources</h2>
              </div>
              <ul className="space-y-3">
                {WATCHLIST.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold leading-snug no-underline hover:underline"
                    >
                      {item.name}
                    </a>
                    <p className="text-xs leading-snug text-[#5c6776]">{item.note}</p>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </section>
      </main>
    </div>
  );
}
