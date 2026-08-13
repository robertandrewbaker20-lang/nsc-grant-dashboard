"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { OpportunityDetail } from "@/components/opportunity-detail";
import {
  readStoredProfile,
  readStoredResult,
  writeStoredResult,
} from "@/lib/client-store";
import { formatDeadline, hostFromUrl } from "@/lib/format";
import { WATCHLIST } from "@/lib/watchlist";
import type {
  Opportunity,
  Recommendation,
  SearchProfile,
  SearchResult,
} from "@/lib/types";

const LANES: { id: Recommendation; label: string; hint: string }[] = [
  { id: "review", label: "Review", hint: "Needs a closer look" },
  { id: "pursue", label: "Pursue", hint: "Staff should act" },
  { id: "pass", label: "Pass", hint: "Parked / not a fit" },
];

function laneOf(item: Opportunity): Recommendation {
  return item.recommendation && item.recommendation !== "pass"
    ? item.recommendation
    : item.recommendation === "pass"
      ? "pass"
      : "review";
}

export function Dashboard({ initialProfile }: { initialProfile: SearchProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const storedProfile = readStoredProfile();
    if (storedProfile) setProfile(storedProfile);
    const storedResult = readStoredResult();
    if (storedResult) {
      setResult(storedResult);
      writeStoredResult(storedResult);
      const hid = storedResult.errors.find((e) => e.startsWith("Hid "));
      setStatus(
        `Last scan ${new Date(storedResult.searchedAt).toLocaleString()} · ${storedResult.fetched} listings${hid ? ` · ${hid}` : ""}`,
      );
    }
  }, []);

  const list = result?.opportunities ?? [];
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
    setResult(next);
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
      const errNote = data.errors.length ? ` · ${data.errors.length} notes` : "";
      setStatus(`Scan complete · ${data.fetched} listings scored ${data.evaluated}${errNote}`);
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

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#255097]">
              Live grant pipeline
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-[#383636]">
              {profile.orgName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#5b6573]">
              Drag cards between Review, Pursue, and Pass. Open a card for the
              briefing, then use the application website to go to the funder.
              Site-specific awards outside Arkansas (for example Wright-Patterson
              STARBASE) are hidden.
            </p>
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={running}
            className="rounded-full bg-[#ce202a] px-6 py-2.5 text-sm font-black text-white shadow-[0_0_30px_rgba(206,32,42,0.35)] disabled:opacity-50"
          >
            {running ? "Scanning sources…" : "Run intelligence scan"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["In pipeline", String(list.length), "All returned opportunities"],
            ["Pursue", String(byLane.pursue.length), "Ready for staff action"],
            ["Review", String(byLane.review.length), "Needs a decision"],
            [
              "Next deadline",
              nextDeadline ? formatDeadline(nextDeadline.deadline) : "—",
              nextDeadline?.title ?? "No dated deadline yet",
            ],
          ].map(([label, value, hint]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#68acfb]/50 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#255097]">
                {label}
              </p>
              <p className="mt-2 truncate text-2xl font-black text-[#383636]">{value}</p>
              <p className="mt-1 truncate text-xs text-[#5b6573]">{hint}</p>
            </div>
          ))}
        </div>

        {status && (
          <p className="rounded-xl border border-[#68acfb]/40 bg-white/80 px-4 py-2 text-sm text-[#5b6573]">
            {status}
          </p>
        )}

        <section
          className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_400px]" : ""}`}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {LANES.map((lane) => (
              <div
                key={lane.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || draggingId;
                  if (id) moveTo(id, lane.id);
                  setDraggingId(null);
                }}
                className="min-h-[420px] rounded-2xl border border-[#68acfb]/45 bg-white/70 p-3 backdrop-blur-md"
              >
                <div className="mb-3 flex items-end justify-between px-1">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#255097]">
                      {lane.label}
                    </h3>
                    <p className="text-xs text-[#5b6573]">{lane.hint}</p>
                  </div>
                  <span className="rounded-full bg-[#255097] px-2 py-0.5 text-xs font-bold text-white">
                    {byLane[lane.id].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {byLane[lane.id].length === 0 && (
                    <p className="rounded-xl border border-dashed border-[#68acfb]/50 px-3 py-8 text-center text-xs text-[#5b6573]">
                      Drop a card here
                    </p>
                  )}
                  {byLane[lane.id].map((row) => (
                    <article
                      key={row.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(row.id);
                        e.dataTransfer.setData("text/plain", row.id);
                      }}
                      onClick={() =>
                        setSelectedId(row.id === selectedId ? null : row.id)
                      }
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        selectedId === row.id
                          ? "border-[#ce202a] bg-white text-[#383636] ring-2 ring-[#ce202a]/20"
                          : "border-[#afd4ff] bg-white text-[#383636] hover:border-[#255097]"
                      }`}
                    >
                      <p className="text-sm font-black leading-snug">{row.title}</p>
                      <p className="mt-1 text-xs leading-snug text-[#5b6573]">
                        {row.agency ?? row.source}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold">
                        <span className="capitalize">{row.funderType}</span>
                        <span>{formatDeadline(row.deadline)}</span>
                        <span>
                          {row.fitScore != null ? `Fit ${row.fitScore}` : "Not scored"}
                        </span>
                      </div>
                      {row.url && (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-block text-[11px] font-bold text-[#ce202a] underline"
                        >
                          {hostFromUrl(row.url)}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="xl:sticky xl:top-20 xl:h-[calc(100vh-7rem)]">
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

        {!selected && (
          <section className="rounded-2xl border border-[#68acfb]/45 bg-white/75 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <img src="/fleur.png" alt="" className="h-7 w-7" />
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#255097]">
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
                  className="rounded-xl border border-[#afd4ff] bg-white p-3 no-underline transition hover:border-[#255097]"
                >
                  <p className="text-sm font-bold text-[#255097]">{item.name}</p>
                  <p className="mt-1 text-xs text-[#5b6573]">{item.note}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
