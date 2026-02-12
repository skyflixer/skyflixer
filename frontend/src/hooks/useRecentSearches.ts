import { useState, useEffect, useCallback } from "react";
import {
  getRecentSearches,
  addRecentSearch as addSearchToStorage,
  removeRecentSearch as removeSearchFromStorage,
  clearRecentSearches as clearSearchesFromStorage,
} from "@/lib/storage";

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  // Load on mount
  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    
    addSearchToStorage(trimmed);
    setSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, 10);
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    removeSearchFromStorage(query);
    setSearches(prev => prev.filter(s => s.toLowerCase() !== query.toLowerCase()));
  }, []);

  const clearSearches = useCallback(() => {
    clearSearchesFromStorage();
    setSearches([]);
  }, []);

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
