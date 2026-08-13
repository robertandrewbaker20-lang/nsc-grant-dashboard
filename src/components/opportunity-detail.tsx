"use client";

import { formatDeadline, hostFromUrl } from "@/lib/format";
import type { Opportunity, Recommendation } from "@/lib/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">
        {title}
      </h4>
      <div className="text-sm leading-relaxed text-slate-200">{children}</div>
    </section>
  );
}

const LANES: Recommendation[] = ["pursue", "review", "pass"];

export function OpportunityDetail({
  item,
  loading,
  onClose,
  onEnrich,
  onMove,
}: {
  item: Opportunity;
  loading: boolean;
  onClose: () => void;
  onEnrich: () => void;
  onMove: (next: Recommendation) => void;
}) {
  const host = hostFromUrl(item.url);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-[0_0_80px_rgba(15,23,42,0.65)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-rose-400">
            Briefing
          </p>
          <h3 className="mt-1 text-lg font-black leading-snug text-white">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {item.agency ?? item.source}
            {item.partnershipRequired ? " · Partnership likely" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 sm:grid-cols-4">
        {[
          ["Amount", item.amount ?? "See listing"],
          ["Deadline", formatDeadline(item.deadline ?? item.timeline)],
          ["Type", item.funderType],
          ["Match", item.matchRequired ?? "Unknown"],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-950/60 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold capitalize leading-snug text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-b border-white/10 px-5 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Move in pipeline
        </p>
        <div className="flex flex-wrap gap-2">
          {LANES.map((lane) => (
            <button
              key={lane}
              type="button"
              onClick={() => onMove(lane)}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                item.recommendation === lane
                  ? "bg-white text-slate-950"
                  : "border border-white/15 text-slate-200 hover:bg-white/10"
              }`}
            >
              {lane}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <Section title="Overview">
          <p>
            {item.overview ||
              item.summary ||
              item.description ||
              "Load a briefing or open the application site for program detail."}
          </p>
        </Section>

        <Section title="How to apply">
          <div className="space-y-3">
            {item.howToApply && <p>{item.howToApply}</p>}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-teal-300/30 bg-teal-400/10 px-4 py-3 no-underline transition hover:border-teal-200 hover:bg-teal-400/15"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300">
                  Application website
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  Open {host}
                </p>
                <p className="mt-0.5 break-all text-xs text-slate-400">{item.url}</p>
              </a>
            ) : (
              <p className="text-slate-400">
                No application URL was returned for this listing. Run Load full
                briefing to try to find one.
              </p>
            )}
          </div>
        </Section>

        {item.eligibility && (
          <Section title="Eligibility">
            <p>{item.eligibility}</p>
          </Section>
        )}

        {item.requirements.length > 0 && (
          <Section title="Requirements">
            <ul className="list-disc space-y-1 pl-5">
              {item.requirements.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Point of contact">
          {item.pocName || item.pocEmail || item.pocPhone ? (
            <div className="space-y-1">
              {item.pocName && <p className="font-semibold text-white">{item.pocName}</p>}
              {item.pocEmail && (
                <p>
                  <a href={`mailto:${item.pocEmail}`} className="text-teal-300 underline">
                    {item.pocEmail}
                  </a>
                </p>
              )}
              {item.pocPhone && <p>{item.pocPhone}</p>}
            </div>
          ) : (
            <p>No named contact yet. Load a full briefing or use the application site.</p>
          )}
        </Section>

        {item.nextSteps.length > 0 && (
          <Section title="Suggested next steps">
            <ol className="list-decimal space-y-1 pl-5">
              {item.nextSteps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Section>
        )}

        {item.strengths.length > 0 && (
          <Section title="Why this may fit">
            <ul className="list-disc space-y-1 pl-5">
              {item.strengths.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}

        {item.concerns.length > 0 && (
          <Section title="Watch-outs">
            <ul className="list-disc space-y-1 pl-5 text-rose-200">
              {item.concerns.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/30 px-5 py-3">
        <button
          type="button"
          onClick={onEnrich}
          disabled={loading}
          className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Researching…" : item.enriched ? "Refresh briefing" : "Load full briefing"}
        </button>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-3 py-2 text-sm font-bold text-white no-underline hover:bg-white/10"
          >
            Go to {host}
          </a>
        )}
      </div>
    </aside>
  );
}
