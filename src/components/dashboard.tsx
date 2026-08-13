"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { OpportunityDetail } from "@/components/opportunity-detail";
import {
  publicNotes,
  useStoredProfile,
  useStoredResult,
  writeStoredResult,
} from "@/lib/client-store";
import { formatDeadline, hostFromUrl } from "@/lib/format";
import { readResponseJson } from "@/lib/read-json";
import { WATCHLIST } from "@/lib/watchlist";
import type {
  Opportunity,
  Recommendation,
  SearchProfile,
  SearchResult,
} from "@/lib/types";

const LANES: {
  id: Recommendation;
  label: string;
  hint: string;
  accent: string;
}[] = [
  { id: "review", label: "Review", hint: "Needs a closer look", accent: "bg-nsc-gold" },
  { id: "pursue", label: "Pursue", hint: "Staff should act", accent: "bg-nsc-navy" },
  { id: "pass", label: "Pass", hint: "Parked / not a fit", accent: "bg-[#9aa3ad]" },
];

const EMPTY_LIST: Opportunity[] = [];

function laneOf(item: Opportunity): Recommendation {
  return item.recommendation ?? "review";
}

function fitBadge(score: number | null) {
  if (score == null) {
    return { label: "Not scored", className: "bg-nav text-muted" };
  }
  if (score >= 75) {
    return { label: `Fit ${score}`, className: "bg-[#e8f0e3] text-nsc-green" };
  }
  if (score >= 50) {
    return { label: `Fit ${score}`, className: "bg-[#fbf3d4] text-[#8a6d0a]" };
  }
  return { label: `Fit ${score}`, className: "bg-[#fdecee] text-nsc-red-dark" };
}

function isSoon(deadline: string | null) {
  if (!deadline) return false;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return false;
  const days = (date.getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 21;
}

export function Dashboard({ initialProfile }: { initialProfile: SearchProfile }) {
  const profile = useStoredProfile(initialProfile);
  const storedResult = useStoredResult();
  const [status, setStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [localResult, setLocalResult] = useState<SearchResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<Recommendation | null>(null);

  const result = localResult ?? storedResult;

  const list = useMemo(() => result?.opportunities ?? EMPTY_LIST, [result]);
  const selected = list.find((o) => o.id === selectedId) ?? null;

  const byLane = useMemo(() => {
    const grouped: Record<Recommendation, Opportunity[]> = {
      pursue: [],
      review: [],
      pass: [],
    };
    for (const item of list) grouped[laneOf(item)].push(item);
    return grouped;
  }, [list]);

  const nextDeadline = useMemo(() => {
    const dated = list
      .filter((o) => o.deadline && !Number.isNaN(new Date(o.deadline).getTime()))
      .sort(
        (a, b) =>
          new Date(a.deadline as string).getTime() -
          new Date(b.deadline as string).getTime(),
      );
    return dated[0] ?? null;
  }, [list]);

  function persist(next: SearchResult) {
    setLocalResult(next);
    writeStoredResult(next);
  }

  function moveTo(id: string, recommendation: Recommendation) {
    if (!result) return;
    persist({
      ...result,
      opportunities: result.opportunities.map((item) =>
        item.id === id ? { ...item, recommendation } : item,
      ),
    });
  }

  async function postSearch(body: Record<string, unknown>) {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await readResponseJson<SearchResult>(res);
    if (!Array.isArray(data.opportunities)) {
      throw new Error(data.errors?.[0] || "Search failed");
    }
    return data;
  }

  async function runSearch() {
    setRunning(true);
    setStatus(null);
    setNotes([]);
    setSelectedId(null);
    try {
      const active = profile;
      setStatus("Scanning Grants.gov…");
      const federal = await postSearch({ profile: active, mode: "federal" });
      persist(federal);
      setStatus(
        federal.fetched
          ? `Found ${federal.fetched} federal listings. Scanning foundations and scoring…`
          : "No federal listings yet. Scanning foundations…",
      );
      setNotes(publicNotes(federal.errors));

      try {
        const complete = await postSearch({
          profile: active,
          mode: "complete",
          seed: federal.opportunities,
        });
        persist(complete);
        setStatus(
          `Scan complete · ${complete.fetched} listings scored ${complete.evaluated}`,
        );
        setNotes(publicNotes(complete.errors));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The full scan did not finish.";
        if (federal.fetched) {
          setStatus(`Showing ${federal.fetched} federal listings`);
          setNotes((current) => [...current, `${message} Broader sources can be retried.`]);
        } else {
          throw error;
        }
      }
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
      const active = profile;
      const res = await fetch("/api/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: selected, profile: active }),
        cache: "no-store",
      });
      const data = await readResponseJson<{ opportunity?: Opportunity; error?: string }>(
        res,
      );
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

  const stats = [
    ["In pipeline", String(list.length), "All returned opportunities"],
    ["Pursue", String(byLane.pursue.length), "Ready for staff action"],
    ["Review", String(byLane.review.length), "Needs a decision"],
    [
      "Next deadline",
      nextDeadline ? formatDeadline(nextDeadline.deadline) : "—",
      nextDeadline?.title ?? "No dated deadline yet",
    ],
  ] as const;

  const displayStatus =
    status ??
    (!running && result
      ? `Last scan ${new Date(result.searchedAt).toLocaleString()} · ${result.fetched} listings`
      : null);
  const displayNotes = notes.length > 0 ? notes : publicNotes(result?.errors ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-nsc-navy-link">
            Live grant pipeline
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            {profile.orgName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Drag cards between Review, Pursue, and Pass. Open a card for the briefing,
            then use the application website to go to the funder.
          </p>
        </div>
        <button
          type="button"
          onClick={runSearch}
          disabled={running}
          className="rounded-md bg-nsc-navy-link px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#014274] disabled:opacity-50"
        >
          {running ? "Scanning sources…" : "Scan for grants"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="nsc-card overflow-hidden">
            <div className="h-1 bg-nsc-navy" />
            <div className="px-4 py-4">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-nsc-navy-link">
                {label}
              </p>
              <p className="mt-2 truncate text-2xl font-bold text-ink">{value}</p>
              <p className="mt-1 truncate text-xs text-muted">{hint}</p>
            </div>
          </div>
        ))}
      </div>

      {displayStatus && (
        <p className="rounded-lg border border-nsc-row/70 bg-white px-4 py-2.5 text-sm text-muted">
          {displayStatus}
        </p>
      )}
      {displayNotes.length > 0 && (
        <ul className="rounded-lg border border-[#f0d0d5] bg-[#fdf6f6] px-4 py-3 text-sm text-nsc-red-dark">
          {displayNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      {list.length === 0 && !running && (
        <section className="nsc-card flex flex-col items-center px-6 py-14 text-center">
          <Image src="/fleur.png" alt="" width={64} height={64} className="h-16 w-16" />
          <h2 className="mt-4 text-xl font-bold text-ink">No opportunities in the pipeline yet</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Confirm search parameters, then scan Grants.gov and the council&apos;s source
            network for open federal, foundation, and corporate awards.
          </p>
        </section>
      )}

      {running && list.length === 0 && (
        <section className="nsc-card px-6 py-12 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-nsc-navy-link">
            Scanning sources
          </p>
          <p className="mt-2 text-sm text-muted">
            Checking Grants.gov and the council source network. This can take a minute.
          </p>
        </section>
      )}

      {list.length > 0 && (
      <section
        className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_400px]" : ""}`}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {LANES.map((lane) => (
            <div
              key={lane.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverLane(lane.id);
              }}
              onDragLeave={() => setOverLane((current) => (current === lane.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || draggingId;
                if (id) moveTo(id, lane.id);
                setDraggingId(null);
                setOverLane(null);
              }}
              className={`nsc-card min-h-[420px] overflow-hidden transition-shadow ${
                overLane === lane.id ? "ring-2 ring-nsc-navy/25" : ""
              }`}
            >
              <div className={`h-1.5 ${lane.accent}`} />
              <div className="p-3">
                <div className="mb-3 flex items-end justify-between px-1">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-nsc-navy-deep">
                      {lane.label}
                    </h2>
                    <p className="text-xs text-muted">{lane.hint}</p>
                  </div>
                  <span className="rounded-full bg-nsc-navy px-2 py-0.5 text-xs font-bold text-white">
                    {byLane[lane.id].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {byLane[lane.id].length === 0 && (
                    <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-muted">
                      Drop a card here
                    </p>
                  )}
                  {byLane[lane.id].map((row) => {
                    const fit = fitBadge(row.fitScore);
                    const soon = isSoon(row.deadline);
                    return (
                      <article
                        key={row.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggingId(row.id);
                          e.dataTransfer.setData("text/plain", row.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverLane(null);
                        }}
                        onClick={() =>
                          setSelectedId(row.id === selectedId ? null : row.id)
                        }
                        className={`cursor-pointer rounded-lg border bg-white p-3 transition ${
                          selectedId === row.id
                            ? "border-nsc-navy-link shadow-sm ring-2 ring-nsc-sky/40"
                            : "border-line hover:border-nsc-navy"
                        }`}
                      >
                        <p className="text-sm font-bold leading-snug text-ink">{row.title}</p>
                        <p className="mt-1 text-xs leading-snug text-muted">
                          {row.agency ?? row.source}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-nav px-2 py-0.5 text-[11px] font-semibold capitalize text-nsc-navy-deep">
                            {row.funderType}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              soon ? "bg-[#fdecee] text-nsc-red-dark" : "bg-nav text-muted"
                            }`}
                          >
                            {formatDeadline(row.deadline)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${fit.className}`}
                          >
                            {fit.label}
                          </span>
                        </div>
                        {row.url && (
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-block text-[11px] font-bold text-nsc-red no-underline hover:underline"
                          >
                            {hostFromUrl(row.url)}
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="xl:sticky xl:top-[11.5rem] xl:h-[calc(100vh-13rem)]">
            <OpportunityDetail
              item={selected}
              loading={enriching}
              onClose={() => setSelectedId(null)}
              onEnrich={loadBriefing}
              onMove={(next) => moveTo(selected.id, next)}
            />
          </div>
        )}
      </section>
      )}

      {!selected && (
        <section className="nsc-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Image src="/fleur.png" alt="" width={28} height={28} className="h-7 w-7" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-nsc-navy-deep">
              Source network
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WATCHLIST.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line bg-white p-3 no-underline transition hover:border-nsc-navy-link hover:shadow-sm"
              >
                <p className="text-sm font-bold text-nsc-navy-link">{item.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.note}</p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
