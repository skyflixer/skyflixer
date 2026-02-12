import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContentRow } from "@/components/ContentRow";
import { SearchOverlay } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils";
import {
  discoverTVShows,
  discoverMovies,
  TMDBMovie,
  TMDBTVShow,
} from "@/lib/tmdb";

interface ContentSection {
  title: string;
  items: (TMDBMovie | TMDBTVShow)[];
  isLoading: boolean;
}

const ANIME_CATEGORIES = [
  { id: "popular", name: "Popular" },
  { id: "action", name: "Action" },
  { id: "romance", name: "Romance" },
  { id: "comedy", name: "Comedy" },
  { id: "drama", name: "Drama" },
  { id: "fantasy", name: "Fantasy" },
  { id: "sci-fi", name: "Sci-Fi" },
];

export default function AnimePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("popular");
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [selectedCategory]);

  const loadContent = async () => {
    setIsLoading(true);
    
    try {
      const sectionConfigs = [
        { title: "Popular Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Top Rated Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "vote_average.desc", "vote_average.gte": 8 }) },
        { title: "Anime Movies", fetch: () => discoverMovies({ with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc" }) },
        { title: "Action Anime", fetch: () => discoverTVShows({ with_genres: "16,10759", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Romance Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Comedy Anime", fetch: () => discoverTVShows({ with_genres: "16,35", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Drama Anime", fetch: () => discoverTVShows({ with_genres: "16,18", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Sci-Fi & Fantasy Anime", fetch: () => discoverTVShows({ with_genres: "16,10765", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Mystery Anime", fetch: () => discoverTVShows({ with_genres: "16,9648", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Family Anime", fetch: () => discoverTVShows({ with_genres: "16,10751", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Top Rated Anime Movies", fetch: () => discoverMovies({ with_genres: "16", with_original_language: "ja", sort_by: "vote_average.desc", "vote_average.gte": 8 }) },
        { title: "New Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "first_air_date.desc" }) },
        { title: "Adventure Anime", fetch: () => discoverTVShows({ with_genres: "16,10759", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Horror Anime", fetch: () => discoverMovies({ with_genres: "16,27", with_original_language: "ja", sort_by: "popularity.desc" }) },
        { title: "Music Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Supernatural Anime", fetch: () => discoverTVShows({ with_genres: "16,10765", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Kids Anime", fetch: () => discoverTVShows({ with_genres: "16,10762", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Classic Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "first_air_date.asc", "first_air_date.lte": "2010-01-01" }) },
        { title: "Sports Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Slice of Life", fetch: () => discoverTVShows({ with_genres: "16,18", with_origin_country: "JP", sort_by: "popularity.desc" }) },
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
      console.error("Failed to load anime:", error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />
      
      {/* Page Header */}
      <div className="px-4 md:px-8 lg:px-12 pt-6 pb-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6">Anime</h1>
        
        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {ANIME_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedCategory === category.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {category.name}
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
