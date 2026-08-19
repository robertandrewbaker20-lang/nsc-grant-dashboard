"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GrantCard } from "@/components/grant-card";
import { KanbanColumn, KanbanEmpty } from "@/components/kanban-column";
import { OpportunityDetail } from "@/components/opportunity-detail";
import {
  publicNotes,
  useStoredProfile,
  useStoredResult,
  writeStoredResult,
} from "@/lib/client-store";
import {
  PURSUIT_STAGES,
  stageOf,
  usePursuitStages,
  writePursuitStage,
  type PursuitStage,
} from "@/lib/pursuit";
import { readResponseJson } from "@/lib/read-json";
import type { Opportunity, Recommendation, SearchProfile, SearchResult } from "@/lib/types";

const EMPTY_LIST: Opportunity[] = [];

export function PursuitBoard({ initialProfile }: { initialProfile: SearchProfile }) {
  const profile = useStoredProfile(initialProfile);
  const storedResult = useStoredResult();
  const stages = usePursuitStages();
  const [status, setStatus] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [localResult, setLocalResult] = useState<SearchResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PursuitStage | null>(null);

  const result = localResult ?? storedResult;
  const list = useMemo(
    () => (result?.opportunities ?? EMPTY_LIST).filter((item) => item.recommendation === "pursue"),
    [result],
  );
  const selected = list.find((item) => item.id === selectedId) ?? null;

  const byStage = useMemo(() => {
    const grouped = Object.fromEntries(
      PURSUIT_STAGES.map((stage) => [stage.id, [] as Opportunity[]]),
    ) as Record<PursuitStage, Opportunity[]>;
    for (const item of list) grouped[stageOf(item, stages)].push(item);
    return grouped;
  }, [list, stages]);

  function persist(next: SearchResult) {
    setLocalResult(next);
    writeStoredResult(next);
  }

  function moveInPipeline(id: string, recommendation: Recommendation) {
    if (!result) return;
    persist({
      ...result,
      opportunities: result.opportunities.map((item) =>
        item.id === id ? { ...item, recommendation } : item,
      ),
    });
    if (recommendation !== "pursue" && selectedId === id) {
      setSelectedId(null);
    }
  }

  function moveToStage(id: string, stage: PursuitStage) {
    const item = list.find((row) => row.id === id);
    if (item) writePursuitStage(item, stage);
  }

  async function loadBriefing() {
    if (!selected) return;
    setEnriching(true);
    try {
      const res = await fetch("/api/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: selected, profile }),
        cache: "no-store",
      });
      const data = await readResponseJson<{ opportunity?: Opportunity; error?: string }>(res);
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

  const notes = publicNotes(result?.errors ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.18em] text-nsc-navy-link">
            Pursuit pipeline
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Awards in progress</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Grants moved to Pursue live here. Drag cards through application, review, scoring,
            decision, and post-award work.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-nsc-navy/25 px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-nsc-navy no-underline transition-colors hover:bg-nsc-row/30"
        >
          Back to portfolio
        </Link>
      </div>

      {status && (
        <p className="rounded-lg border border-nsc-row/70 bg-white px-4 py-2.5 text-sm text-muted">
          {status}
        </p>
      )}
      {notes.length > 0 && (
        <ul className="rounded-lg border border-[#f0d0d5] bg-[#fdf6f6] px-4 py-3 text-sm text-nsc-red-dark">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      {list.length === 0 && (
        <section className="nsc-card flex flex-col items-center px-6 py-14 text-center">
          <Image src="/fleur.png" alt="" width={64} height={64} className="h-16 w-16" />
          <h2 className="mt-4 text-xl font-bold text-ink">No grants in Pursue yet</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Drop a card into Pursue on the portfolio board, then open this board to track
            application through award and project tasks.
          </p>
          <Link
            href="/"
            className="mt-5 rounded-md bg-nsc-navy-link px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white no-underline shadow-sm transition-colors hover:bg-[#014274]"
          >
            Go to portfolio
          </Link>
        </section>
      )}

      {list.length > 0 && (
        <section
          className={`grid gap-5 ${selected ? "xl:grid-cols-[minmax(0,1fr)_400px]" : ""}`}
        >
          <div className="min-w-0 overflow-x-auto pb-2">
            <div className="flex w-max gap-4">
              {PURSUIT_STAGES.map((stage) => (
                <div key={stage.id} className="w-[280px] shrink-0">
                  <KanbanColumn
                    title={stage.label}
                    hint={stage.hint}
                    accent={stage.accent}
                    count={byStage[stage.id].length}
                    active={overStage === stage.id}
                    minHeightClass="min-h-[520px]"
                    onDragOver={(event) => {
                      event.preventDefault();
                      setOverStage(stage.id);
                    }}
                    onDragLeave={() =>
                      setOverStage((current) => (current === stage.id ? null : current))
                    }
                    onDrop={(event) => {
                      event.preventDefault();
                      const id = event.dataTransfer.getData("text/plain") || draggingId;
                      if (id) moveToStage(id, stage.id);
                      setDraggingId(null);
                      setOverStage(null);
                    }}
                  >
                    {byStage[stage.id].length === 0 && <KanbanEmpty />}
                    {byStage[stage.id].map((row) => (
                      <GrantCard
                        key={row.id}
                        item={row}
                        selected={selectedId === row.id}
                        onSelect={() => setSelectedId(row.id === selectedId ? null : row.id)}
                        onDragStart={(event) => {
                          setDraggingId(row.id);
                          event.dataTransfer.setData("text/plain", row.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStage(null);
                        }}
                      />
                    ))}
                  </KanbanColumn>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div className="xl:sticky xl:top-[11.5rem] xl:h-[calc(100vh-13rem)]">
              <OpportunityDetail
                item={selected}
                loading={enriching}
                onClose={() => setSelectedId(null)}
                onEnrich={loadBriefing}
                onMove={(next) => moveInPipeline(selected.id, next)}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
