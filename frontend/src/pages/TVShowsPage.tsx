import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContentRow } from "@/components/ContentRow";
import { SearchOverlay } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils";
import {
  getPopularTVShows,
  getTopRatedTVShows,
  getOnAirTVShows,
  getAiringTodayTVShows,
  discoverTVShows,
  TMDBTVShow,
  TV_GENRES,
} from "@/lib/tmdb";

interface ContentSection {
  title: string;
  items: TMDBTVShow[];
  isLoading: boolean;
}

const ORIGIN_COUNTRIES = [
  { code: "US", name: "American" },
  { code: "GB", name: "British" },
  { code: "KR", name: "Korean" },
  { code: "JP", name: "Japanese" },
  { code: "ES", name: "Spanish" },
  { code: "FR", name: "French" },
  { code: "DE", name: "German" },
  { code: "IN", name: "Indian" },
];

export default function TVShowsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [selectedGenre, selectedCountry]);

  const loadContent = async () => {
    setIsLoading(true);

    try {
      const filters: any = {};
      if (selectedGenre) filters.with_genres = String(selectedGenre);
      if (selectedCountry) filters.with_origin_country = selectedCountry;

      const sectionConfigs = [
        { title: "Popular TV Shows", fetch: () => selectedGenre || selectedCountry ? discoverTVShows({ ...filters, sort_by: "popularity.desc" }) : getPopularTVShows() },
        { title: "Top Rated", fetch: () => selectedGenre || selectedCountry ? discoverTVShows({ ...filters, sort_by: "vote_average.desc", "vote_average.gte": 7 }) : getTopRatedTVShows() },
        { title: "Currently Airing", fetch: () => getOnAirTVShows() },
        { title: "Airing Today", fetch: () => getAiringTodayTVShows() },
        ...TV_GENRES.filter(g => !selectedGenre || g.id === selectedGenre).slice(0, 12).map(genre => ({
          title: genre.name,
          fetch: () => discoverTVShows({ with_genres: String(genre.id), sort_by: "popularity.desc" }),
        })),
        ...ORIGIN_COUNTRIES.filter(c => !selectedCountry || c.code === selectedCountry).map(country => ({
          title: `${country.name} Series`,
          fetch: () => discoverTVShows({ with_origin_country: country.code, sort_by: "popularity.desc" }),
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
      console.error("Failed to load TV shows:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Page Header */}
      <div className="px-4 md:px-8 lg:px-12 pt-6 pb-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">TV Shows</h1>

        {/* Genre Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4">
          <button
            onClick={() => setSelectedGenre(null)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              selectedGenre === null
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            All Genres
          </button>
          {TV_GENRES.map((genre) => (
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

        {/* Country Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setSelectedCountry(null)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              selectedCountry === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            All Countries
          </button>
          {ORIGIN_COUNTRIES.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelectedCountry(country.code)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedCountry === country.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {country.name}
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
