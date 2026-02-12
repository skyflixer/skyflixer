import { useState, useEffect, useCallback, useRef } from "react";
import { searchMulti, TMDBMovie, TMDBTVShow } from "@/lib/tmdb";

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options;
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await searchMulti(searchQuery);
      
      // Filter out people and other non-media types
      const filtered = response.results.filter(item => 
        "title" in item || "name" in item
      );
      
      setResults(filtered);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Failed to search. Please try again.");
        console.error("Search error:", err);
      }
    } finally {
      setIsSearching(false);
    }
  }, [minQueryLength]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < minQueryLength) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debounceMs, minQueryLength, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    hasSearched,
    clearSearch,
    hasResults: results.length > 0,
    noResults: hasSearched && !isSearching && results.length === 0,
  };
}
