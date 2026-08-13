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
      <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#255097]">
        {title}
      </h4>
      <div className="text-sm leading-relaxed text-[#383636]">{children}</div>
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
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#68acfb]/50 bg-white/90 shadow-lg backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 border-b border-[#afd4ff] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ce202a]">
            Briefing
          </p>
          <h3 className="mt-1 text-lg font-black leading-snug text-[#383636]">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-[#5b6573]">
            {item.agency ?? item.source}
            {item.partnershipRequired ? " · Partnership likely" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm font-bold text-[#5b6573] hover:bg-[#eef4fb]"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-[#afd4ff] bg-[#afd4ff] sm:grid-cols-4">
        {[
          ["Amount", item.amount ?? "See listing"],
          ["Deadline", formatDeadline(item.deadline ?? item.timeline)],
          ["Type", item.funderType],
          ["Match", item.matchRequired ?? "Unknown"],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#f4f8fd] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b6573]">
              {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold capitalize leading-snug">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-b border-[#afd4ff] px-5 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5b6573]">
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
                  ? "bg-[#255097] text-white"
                  : "border border-[#255097]/25 text-[#255097] hover:bg-[#AFD4FF]/40"
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
                className="block rounded-xl border border-[#68acfb] bg-[#e8f2ff] px-4 py-3 no-underline transition hover:border-[#255097]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#255097]">
                  Application website
                </p>
                <p className="mt-1 text-sm font-black text-[#ce202a]">Open {host}</p>
                <p className="mt-0.5 break-all text-xs text-[#5b6573]">{item.url}</p>
              </a>
            ) : (
              <p className="text-[#5b6573]">
                No application URL yet. Load a full briefing to try to find one.
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
              {item.pocName && <p className="font-semibold">{item.pocName}</p>}
              {item.pocEmail && (
                <p>
                  <a href={`mailto:${item.pocEmail}`} className="text-[#ce202a] underline">
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
            <ul className="list-disc space-y-1 pl-5 text-[#a51820]">
              {item.concerns.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#afd4ff] bg-[#f4f8fd] px-5 py-3">
        <button
          type="button"
          onClick={onEnrich}
          disabled={loading}
          className="rounded-full bg-[#255097] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Researching…" : item.enriched ? "Refresh briefing" : "Load full briefing"}
        </button>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#ce202a] px-3 py-2 text-sm font-bold text-[#ce202a] no-underline hover:bg-[#ce202a]/5"
          >
            Go to {host}
          </a>
        )}
      </div>
    </aside>
  );
}
