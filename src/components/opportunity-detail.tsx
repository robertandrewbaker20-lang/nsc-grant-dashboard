"use client";

import type { Opportunity } from "@/lib/types";

function formatDeadline(value: string | null) {
  if (!value) return "Not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
      <div className="text-sm leading-relaxed text-[#1c2430]">{children}</div>
    </section>
  );
}

export function OpportunityDetail({
  item,
  loading,
  onClose,
  onEnrich,
}: {
  item: Opportunity;
  loading: boolean;
  onClose: () => void;
  onEnrich: () => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#d5deea] bg-white shadow-[0_16px_40px_rgba(28,36,48,0.08)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#d5deea] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ce202a]">
            Opportunity briefing
          </p>
          <h3 className="mt-1 text-lg font-black leading-snug text-[#1c2430]">
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-[#5c6776]">
            {item.agency ?? item.source}
            {item.partnershipRequired ? " · Partnership likely" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm font-bold text-[#5c6776] hover:bg-[#eef2f7]"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-[#d5deea] bg-[#d5deea] sm:grid-cols-4">
        {[
          ["Amount", item.amount ?? "See listing"],
          ["Deadline", formatDeadline(item.deadline ?? item.timeline)],
          ["Type", item.funderType],
          ["Match", item.matchRequired ?? "Unknown"],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#f7f9fc] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6776]">
              {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold capitalize leading-snug">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <Section title="Overview">
          <p>{item.overview || item.summary || item.description || "Open the listing or load a full briefing."}</p>
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

        <Section title="How to apply">
          <p>{item.howToApply || "Use the official listing for the current application path."}</p>
        </Section>

        <Section title="Point of contact">
          {item.pocName || item.pocEmail || item.pocPhone ? (
            <div className="space-y-1">
              {item.pocName && <p className="font-semibold">{item.pocName}</p>}
              {item.pocEmail && (
                <p>
                  <a href={`mailto:${item.pocEmail}`}>{item.pocEmail}</a>
                </p>
              )}
              {item.pocPhone && <p>{item.pocPhone}</p>}
            </div>
          ) : (
            <p>No named contact on file. Check the listing or load a full briefing.</p>
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
            <ul className="list-disc space-y-1 pl-5 text-[#7a1f24]">
              {item.concerns.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#d5deea] bg-[#f7f9fc] px-5 py-3">
        <button
          type="button"
          onClick={onEnrich}
          disabled={loading}
          className="rounded-md bg-[#255097] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Researching…" : item.enriched ? "Refresh briefing" : "Load full briefing"}
        </button>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[#d5deea] bg-white px-3 py-2 text-sm font-bold text-[#255097] no-underline hover:border-[#68acfb]"
          >
            Official listing
          </a>
        )}
      </div>
    </aside>
  );
}
