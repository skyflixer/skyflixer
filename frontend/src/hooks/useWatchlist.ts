import { useState, useEffect, useCallback } from "react";
import {
  WatchlistItem,
  getWatchlist,
  addToWatchlist as addToWatchlistStorage,
  removeFromWatchlist as removeFromWatchlistStorage,
  isInWatchlist as checkIsInWatchlist,
  sortWatchlist,
  WatchlistSortOption,
} from "@/lib/storage";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [sortBy, setSortBy] = useState<WatchlistSortOption>("recently_added");
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlist on mount
  useEffect(() => {
    const loaded = getWatchlist();
    setWatchlist(loaded);
    setIsLoading(false);
  }, []);

  const addToWatchlist = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    addToWatchlistStorage(item);
    setWatchlist(prev => {
      // Check if already exists
      if (prev.some(w => w.id === item.id && w.type === item.type)) {
        return prev;
      }
      return [{ ...item, addedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number, type: "movie" | "tv") => {
    removeFromWatchlistStorage(id, type);
    setWatchlist(prev => prev.filter(w => !(w.id === id && w.type === type)));
  }, []);

  const isInWatchlist = useCallback((id: number, type: "movie" | "tv") => {
    return watchlist.some(w => w.id === id && w.type === type);
  }, [watchlist]);

  const toggleWatchlist = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    if (isInWatchlist(item.id, item.type)) {
      removeFromWatchlist(item.id, item.type);
      return false;
    } else {
      addToWatchlist(item);
      return true;
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  const sortedWatchlist = sortWatchlist(watchlist, sortBy);

  return {
    watchlist: sortedWatchlist,
    rawWatchlist: watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
    sortBy,
    setSortBy,
    count: watchlist.length,
  };
}
