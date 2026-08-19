"use client";

import type { DragEvent } from "react";
import { formatDeadline, hostFromUrl } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

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

export function GrantCard({
  item,
  selected,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  item: Opportunity;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const fit = fitBadge(item.fitScore);
  const soon = isSoon(item.deadline);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border bg-white p-3 transition ${
        selected
          ? "border-nsc-navy-link shadow-sm ring-2 ring-nsc-sky/40"
          : "border-line hover:border-nsc-navy"
      }`}
    >
      <p className="text-sm font-bold leading-snug text-ink">{item.title}</p>
      <p className="mt-1 text-xs leading-snug text-muted">{item.agency ?? item.source}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-nav px-2 py-0.5 text-[11px] font-semibold capitalize text-nsc-navy-deep">
          {item.funderType}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            soon ? "bg-[#fdecee] text-nsc-red-dark" : "bg-nav text-muted"
          }`}
        >
          {formatDeadline(item.deadline)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${fit.className}`}>
          {fit.label}
        </span>
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="mt-2 inline-block text-[11px] font-bold text-nsc-red no-underline hover:underline"
        >
          {hostFromUrl(item.url)}
        </a>
      )}
    </article>
  );
}
