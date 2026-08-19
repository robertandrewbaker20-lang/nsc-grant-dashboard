import { useSyncExternalStore } from "react";
import type { Opportunity } from "./types";

export type PursuitStage =
  | "application"
  | "preliminary-review"
  | "scoring"
  | "decision"
  | "declined"
  | "awarded"
  | "contracting"
  | "awarded-project-tasks";

export const DEFAULT_PURSUIT_STAGE: PursuitStage = "application";

export const PURSUIT_STAGES: {
  id: PursuitStage;
  label: string;
  hint: string;
  accent: string;
}[] = [
  {
    id: "application",
    label: "Application stage",
    hint: "Preparing and submitting",
    accent: "bg-nsc-navy",
  },
  {
    id: "preliminary-review",
    label: "Preliminary review",
    hint: "Funder is screening",
    accent: "bg-nsc-sky",
  },
  {
    id: "scoring",
    label: "Scoring",
    hint: "Under evaluation",
    accent: "bg-nsc-gold",
  },
  {
    id: "decision",
    label: "Decision",
    hint: "Awaiting award notice",
    accent: "bg-nsc-navy-deep",
  },
  {
    id: "declined",
    label: "Declined",
    hint: "Not awarded",
    accent: "bg-[#9aa3ad]",
  },
  {
    id: "awarded",
    label: "Awarded",
    hint: "Notice of award received",
    accent: "bg-nsc-green",
  },
  {
    id: "contracting",
    label: "Contracting tasks",
    hint: "Agreements and setup",
    accent: "bg-[#5b4a9a]",
  },
  {
    id: "awarded-project-tasks",
    label: "Awarded Project Tasks",
    hint: "Delivery and reporting",
    accent: "bg-nsc-red",
  },
];

const STAGE_IDS = new Set<string>(PURSUIT_STAGES.map((stage) => stage.id));

export function isPursuitStage(value: string): value is PursuitStage {
  return STAGE_IDS.has(value);
}

export function pursuitKey(item: Pick<Opportunity, "id" | "url">) {
  return (item.url || item.id).toLowerCase();
}

const STORAGE_KEY = "nsc-pursuit-stages";

type StageMap = Record<string, PursuitStage>;
type Listener = () => void;

const listeners = new Set<Listener>();

let cacheRaw: string | null = null;
let cache: StageMap = {};

function emit() {
  listeners.forEach((listener) => listener());
}

function parseStages(raw: string | null): StageMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: StageMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && isPursuitStage(value)) {
        next[key] = value;
      }
    }
    return next;
  } catch {
    return {};
  }
}

export function subscribePursuitStages(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPursuitStagesSnapshot(): StageMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  cache = parseStages(raw);
  return cache;
}

function writeStages(next: StageMap) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cacheRaw = raw;
  cache = next;
  emit();
}

export function stageOf(item: Pick<Opportunity, "id" | "url">, stages: StageMap): PursuitStage {
  return stages[pursuitKey(item)] ?? DEFAULT_PURSUIT_STAGE;
}

export function ensurePursuitStage(item: Pick<Opportunity, "id" | "url">) {
  const key = pursuitKey(item);
  const current = getPursuitStagesSnapshot();
  if (current[key]) return;
  writeStages({ ...current, [key]: DEFAULT_PURSUIT_STAGE });
}

export function writePursuitStage(item: Pick<Opportunity, "id" | "url">, stage: PursuitStage) {
  const key = pursuitKey(item);
  const current = getPursuitStagesSnapshot();
  if (current[key] === stage) return;
  writeStages({ ...current, [key]: stage });
}

export function usePursuitStages(): StageMap {
  return useSyncExternalStore(subscribePursuitStages, getPursuitStagesSnapshot, () => ({}));
}
