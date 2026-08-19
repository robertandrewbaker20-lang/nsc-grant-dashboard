"use client";

import type { DragEvent, ReactNode } from "react";

export function KanbanColumn({
  title,
  hint,
  accent,
  count,
  active,
  minHeightClass = "min-h-[420px]",
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: {
  title: string;
  hint: string;
  accent: string;
  count: number;
  active: boolean;
  minHeightClass?: string;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`nsc-card overflow-hidden transition-shadow ${minHeightClass} ${
        active ? "ring-2 ring-nsc-navy/25" : ""
      }`}
    >
      <div className={`h-1.5 ${accent}`} />
      <div className="p-3">
        <div className="mb-3 flex items-end justify-between gap-2 px-1">
          <div className="min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-nsc-navy-deep">
              {title}
            </h2>
            <p className="text-xs text-muted">{hint}</p>
          </div>
          <span className="shrink-0 rounded-full bg-nsc-navy px-2 py-0.5 text-xs font-bold text-white">
            {count}
          </span>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

export function KanbanEmpty({ label = "Drop a card here" }: { label?: string }) {
  return (
    <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-muted">
      {label}
    </p>
  );
}
