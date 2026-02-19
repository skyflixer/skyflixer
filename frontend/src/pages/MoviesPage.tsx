import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContentRow } from "@/components/ContentRow";
import { SearchOverlay } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils";
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  discoverMovies,
  TMDBMovie,
  MOVIE_GENRES,
} from "@/lib/tmdb";

interface ContentSection {
  title: string;
  items: TMDBMovie[];
  isLoading: boolean;
}

export default function MoviesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [selectedGenre]);

  const loadContent = async () => {
    setIsLoading(true);

    try {
      const genreFilter = selectedGenre ? { with_genres: String(selectedGenre) } : {};

      const sectionConfigs = [
        { title: "Popular Movies", fetch: () => selectedGenre ? discoverMovies({ ...genreFilter, sort_by: "popularity.desc" }) : getPopularMovies() },
        { title: "Top Rated", fetch: () => selectedGenre ? discoverMovies({ ...genreFilter, sort_by: "vote_average.desc", "vote_average.gte": 7 }) : getTopRatedMovies() },
        { title: "Now Playing", fetch: () => selectedGenre ? discoverMovies({ ...genreFilter, sort_by: "release_date.desc" }) : getNowPlayingMovies() },
        { title: "Coming Soon", fetch: () => getUpcomingMovies() },
        ...MOVIE_GENRES.filter(g => !selectedGenre || g.id === selectedGenre).slice(0, 16).map(genre => ({
          title: genre.name,
          fetch: () => discoverMovies({ with_genres: String(genre.id), sort_by: "popularity.desc" }),
        })),
      ];

      // Set initial loading state
      setSections(
        sectionConfigs.map((config) => ({
          title: config.title,
          items: [],
          isLoading: true,
        }))
      );

      // Load each section
      for (let i = 0; i < sectionConfigs.length; i++) {
        try {
          const response = await sectionConfigs[i].fetch();
          setSections((prev) =>
            prev.map((section, idx) =>
              idx === i
                ? { ...section, items: response.results.slice(0, 25), isLoading: false }
                : section
            )
          );
        } catch (error) {
          console.error(`Failed to load ${sectionConfigs[i].title}:`, error);
          setSections((prev) =>
            prev.map((section, idx) =>
              idx === i ? { ...section, isLoading: false } : section
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to load movies:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Page Header */}
      <div className="px-4 md:px-8 lg:px-12 pt-6 pb-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">Movies</h1>

        {/* Genre Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setSelectedGenre(null)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              selectedGenre === null
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            All
          </button>
          {MOVIE_GENRES.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedGenre === genre.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rows */}
      <div className="pb-12">
        {sections.map((section) => (
          <ContentRow
            key={section.title}
            title={section.title}
            items={section.items}
            isLoading={section.isLoading}
          />
        ))}
      </div>

      <Footer />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
