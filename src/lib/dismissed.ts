import type { Opportunity } from "./types";

const STORAGE_KEY = "nsc-dismissed-opportunities";

type Listener = () => void;

const listeners = new Set<Listener>();

let cacheRaw: string | null = null;
let cache: string[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/** Stable keys so a later scan can recognize the same listing by id, URL, or title. */
export function dismissedKeys(item: Pick<Opportunity, "id" | "url" | "title">): string[] {
  const keys = [`id:${normalize(item.id)}`, `title:${normalize(item.title)}`];
  if (item.url) keys.push(`url:${normalize(item.url)}`);
  return keys;
}

function parseKeys(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const unique = new Set<string>();
    for (const value of parsed) {
      if (typeof value === "string" && value.trim()) unique.add(normalize(value));
    }
    return [...unique];
  } catch {
    return [];
  }
}

export function subscribeDismissed(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDismissedSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  cache = parseKeys(raw);
  return cache;
}

function writeDismissed(next: string[]) {
  if (typeof window === "undefined") return;
  const unique = [...new Set(next.map(normalize))];
  const raw = JSON.stringify(unique);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cacheRaw = raw;
  cache = unique;
  emit();
}

export function rememberDismissed(items: Pick<Opportunity, "id" | "url" | "title">[]) {
  if (items.length === 0) return;
  const next = new Set(getDismissedSnapshot());
  for (const item of items) {
    for (const key of dismissedKeys(item)) next.add(key);
  }
  writeDismissed([...next]);
}

export function isDismissed(
  item: Pick<Opportunity, "id" | "url" | "title">,
  keys: string[] = getDismissedSnapshot(),
) {
  if (keys.length === 0) return false;
  const blocked = new Set(keys);
  return dismissedKeys(item).some((key) => blocked.has(key));
}

export function filterDismissed<T extends Pick<Opportunity, "id" | "url" | "title">>(
  items: T[],
  keys: string[] = getDismissedSnapshot(),
): T[] {
  if (keys.length === 0) return items;
  return items.filter((item) => !isDismissed(item, keys));
}
