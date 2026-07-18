"use client";

// Watchlist storage for signed-out visitors. Signed-in users get the
// server-backed version via the API instead (see useWatchlist.ts).

export interface LocalWatchItem {
  eventId: string;
  slug: string;
  title: string;
  image: string | null;
  above: number | null;
  below: number | null;
  fired: boolean;
}

const KEY = "probable_watchlist";
const listeners = new Set<() => void>();

function read(): Record<string, LocalWatchItem> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

function write(data: Record<string, LocalWatchItem>) {
  localStorage.setItem(KEY, JSON.stringify(data));
  listeners.forEach((fn) => fn());
}

export function getLocalWatchlist(): LocalWatchItem[] {
  return Object.values(read());
}

export function isLocalWatched(eventId: string) {
  return !!read()[eventId];
}

export function toggleLocalWatch(event: { id: string | number; slug: string; title: string; image?: string | null }) {
  const data = read();
  const id = String(event.id);
  if (data[id]) delete data[id];
  else data[id] = { eventId: id, slug: event.slug, title: event.title, image: event.image ?? null, above: null, below: null, fired: false };
  write(data);
}

export function setLocalAlert(eventId: string, above: number | null, below: number | null) {
  const data = read();
  if (data[eventId]) {
    data[eventId].above = above;
    data[eventId].below = below;
    data[eventId].fired = false;
    write(data);
  }
}

export function onLocalWatchlistChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
