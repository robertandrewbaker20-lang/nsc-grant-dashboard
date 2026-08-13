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
      <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-nsc-navy-link">
        {title}
      </h4>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
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
    <aside className="nsc-card flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-nsc-red">
            Briefing
          </p>
          <h3 className="mt-1 text-lg font-bold leading-snug text-ink">{item.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {item.agency ?? item.source}
            {item.partnershipRequired ? " · Partnership likely" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm font-bold text-muted hover:bg-nav hover:text-ink"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
        {[
          ["Amount", item.amount ?? "See listing"],
          ["Deadline", formatDeadline(item.deadline ?? item.timeline)],
          ["Type", item.funderType],
          ["Match", item.matchRequired ?? "Unknown"],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#f7f9fc] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-0.5 text-sm font-semibold capitalize leading-snug">{value}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-line px-5 py-3">
        <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Move in pipeline
        </p>
        <div className="flex flex-wrap gap-2">
          {LANES.map((lane) => (
            <button
              key={lane}
              type="button"
              onClick={() => onMove(lane)}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                item.recommendation === lane
                  ? "bg-nsc-navy text-white"
                  : "border border-nsc-navy/25 text-nsc-navy hover:bg-nsc-row/30"
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
                className="block rounded-lg border border-nsc-sky/70 bg-[#f4f8fd] px-4 py-3 no-underline transition hover:border-nsc-navy"
              >
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-nsc-navy-link">
                  Application website
                </p>
                <p className="mt-1 text-sm font-bold text-nsc-red">Open {host}</p>
                <p className="mt-0.5 break-all text-xs text-muted">{item.url}</p>
              </a>
            ) : (
              <p className="text-muted">
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
                  <a href={`mailto:${item.pocEmail}`} className="text-nsc-red underline">
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
            <ul className="list-disc space-y-1 pl-5 text-nsc-red-dark">
              {item.concerns.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-[#f7f9fc] px-5 py-3">
        <button
          type="button"
          onClick={onEnrich}
          disabled={loading}
          className="rounded-md bg-nsc-navy px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-nsc-navy-deep disabled:opacity-50"
        >
          {loading ? "Researching…" : item.enriched ? "Refresh briefing" : "Load full briefing"}
        </button>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-nsc-red px-3 py-2 text-sm font-bold text-nsc-red no-underline hover:bg-[#ce202a]/5"
          >
            Go to {host}
          </a>
        )}
      </div>
    </aside>
  );
}
