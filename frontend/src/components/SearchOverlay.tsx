import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X, Search as SearchIcon, Clock, Trash2 } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { ContentCard } from "./ContentCard";
import { isMovie, getTitle, getReleaseYear, createSlug } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "@/hooks/use-toast";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { query, setQuery, results, isSearching, hasSearched, noResults, clearSearch } = useSearch();
  const { searches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearch(query.trim());
    }
  };

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    addSearch(searchTerm);
  };

  const handleResultClick = (item: any) => {
    const mediaType = isMovie(item) ? "movie" : "tv";
    addSearch(query);
    onClose();
    navigate(`/${mediaType}/${createSlug(getTitle(item))}`, { state: { id: item.id } });
  };

  const handleWatchlistToggle = (item: any) => {
    const mediaType = isMovie(item) ? "movie" : "tv";
    const itemTitle = getTitle(item);

    const added = toggleWatchlist({
      id: item.id,
      type: mediaType,
      title: itemTitle,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      overview: item.overview,
      releaseYear: getReleaseYear(item),
      voteAverage: item.vote_average,
    });

    toast({
      title: added ? "Added to Watchlist" : "Removed from Watchlist",
      description: itemTitle,
      duration: 2000,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-background animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center gap-4 px-4 md:px-8 lg:px-12 h-16 md:h-20">
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
            <SearchIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV shows, anime..."
              className="flex-1 bg-transparent text-lg md:text-xl text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Search"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        <div className="px-4 md:px-8 lg:px-12 py-6">
          {/* Loading State */}
          {isSearching && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* No Results */}
          {noResults && (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground mb-2">
                No results found for "{query}"
              </p>
              <p className="text-sm text-muted-foreground">
                Try searching for a different movie, TV show, or anime
              </p>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Search Results</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {results.map((item) => {
                  const mediaType = isMovie(item) ? "movie" : "tv";
                  return (
                    <ContentCard
                      key={`${mediaType}-${item.id}`}
                      id={item.id}
                      type={mediaType}
                      title={getTitle(item)}
                      posterPath={item.poster_path}
                      backdropPath={item.backdrop_path}
                      voteAverage={item.vote_average}
                      releaseYear={getReleaseYear(item)}
                      overview={item.overview}
                      onClick={() => handleResultClick(item)}
                      onAddToWatchlist={() => handleWatchlistToggle(item)}
                      onRemoveFromWatchlist={() => handleWatchlistToggle(item)}
                      isInWatchlist={isInWatchlist(item.id, mediaType)}
                      hoverPosition="center"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Searches - Show when no query */}
          {!query && !hasSearched && searches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Searches
                </h2>
                <button
                  onClick={clearSearches}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searches.map((search) => (
                  <div
                    key={search}
                    className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 group"
                  >
                    <button
                      onClick={() => handleRecentSearchClick(search)}
                      className="text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {search}
                    </button>
                    <button
                      onClick={() => removeSearch(search)}
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${search} from recent searches`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!query && !hasSearched && searches.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-xl text-muted-foreground mb-2">
                Search for movies, TV shows, or anime
              </p>
              <p className="text-sm text-muted-foreground">
                Start typing to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
