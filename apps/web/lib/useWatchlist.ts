"use client";

import { useCallback, useEffect, useState } from "react";
import { WatchlistItem } from "@probable/sdk";
import { getAuthedSdk } from "./sdk";
import {
  getLocalWatchlist, isLocalWatched, toggleLocalWatch, setLocalAlert, onLocalWatchlistChange,
} from "./localWatchlist";

export interface WatchEntry {
  eventId: string;
  slug: string;
  title: string;
  image: string | null;
  above: number | null;
  below: number | null;
  fired: boolean;
}

function fromServer(it: WatchlistItem): WatchEntry {
  return { eventId: it.eventId, slug: it.slug, title: it.title, image: it.image, above: it.alertAbove, below: it.alertBelow, fired: it.alertFired };
}

// Unified watchlist: server-backed (via the API + Prisma) when signed in,
// localStorage otherwise. Same shape either way so pages don't care which.
export function useWatchlist() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<WatchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem("probable_session");
    setToken(cached ? JSON.parse(cached).token : null);
  }, []);

  const sdk = token ? getAuthedSdk() : null;

  const refresh = useCallback(async () => {
    if (sdk) {
      try { setItems((await sdk.watchlist.list()).map(fromServer)); } catch { /* keep stale */ }
    } else {
      setItems(getLocalWatchlist());
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    refresh();
    if (sdk) return;
    const unsubscribe = onLocalWatchlistChange(() => refresh());
    return () => { unsubscribe(); };
  }, [refresh, token]);

  const isWatched = useCallback((id: string | number) => items.some((i) => i.eventId === String(id)), [items]);

  const toggle = useCallback(async (event: { id: string | number; slug: string; title: string; image?: string | null }) => {
    if (sdk) {
      const id = String(event.id);
      if (isWatched(id)) await sdk.watchlist.remove(id);
      else await sdk.watchlist.add({ eventId: id, slug: event.slug, title: event.title, image: event.image ?? null });
      await refresh();
    } else {
      toggleLocalWatch(event);
    }
  }, [sdk, isWatched, refresh]);

  const setAlert = useCallback(async (eventId: string, above: number | null, below: number | null) => {
    if (sdk) {
      await sdk.watchlist.setAlert(eventId, { above, below });
      await refresh();
    } else {
      setLocalAlert(eventId, above, below);
    }
  }, [sdk, refresh]);

  return { items, loading, isWatched, toggle, setAlert, signedIn: !!token };
}
