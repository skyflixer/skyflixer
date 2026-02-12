import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { TopTenRow } from "@/components/TopTenRow";
import { SearchOverlay } from "@/components/SearchOverlay";
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getPopularTVShows,
  getTopRatedTVShows,
  discoverMovies,
  discoverTVShows,
  TMDBMovie,
  TMDBTVShow,
  MOVIE_GENRES,
  TV_GENRES,
  getImageUrl,
  IMAGE_SIZES,
} from "@/lib/tmdb";


interface ContentSection {
  title: string;
  items: (TMDBMovie | TMDBTVShow)[];
  isLoading: boolean;
  showRank?: boolean;
}

import { useContinueWatching } from "@/hooks/useContinueWatching";

export default function HomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [heroItems, setHeroItems] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const [sections, setSections] = useState<ContentSection[]>([]);

  // Check for continue watching (reactive)
  const continueWatching = useContinueWatching();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      // Load hero content first
      const trending = await getTrending("all", "week");
      if (trending.results.length > 0) {
        // Pass top 10 items for hero carousel
        setHeroItems(trending.results.slice(0, 10));
      }
      setIsHeroLoading(false);

      // Initialize sections with loading state
      const sectionConfigs = [
        {
          title: "Trending Now",
          fetch: () => getTrending("all", "week"),
          isTopTen: false
        },
        {
          title: "Top 10 Today",
          fetch: () => getTrending("all", "day"),
          showRank: true,
          isTopTen: true
        },
        { title: "Popular Movies", fetch: () => getPopularMovies() },
        { title: "Popular TV Shows", fetch: () => getPopularTVShows() },
        { title: "Top Rated Movies", fetch: () => getTopRatedMovies() },
        { title: "Top Rated TV Shows", fetch: () => getTopRatedTVShows() },
        { title: "Now Playing in Theaters", fetch: () => getNowPlayingMovies() },
        { title: "Coming Soon", fetch: () => getUpcomingMovies() },
        { title: "Action Movies", fetch: () => discoverMovies({ with_genres: "28", sort_by: "popularity.desc" }) },
        { title: "Comedy Movies", fetch: () => discoverMovies({ with_genres: "35", sort_by: "popularity.desc" }) },
        { title: "Horror Movies", fetch: () => discoverMovies({ with_genres: "27", sort_by: "popularity.desc" }) },
        { title: "Romance Movies", fetch: () => discoverMovies({ with_genres: "10749", sort_by: "popularity.desc" }) },
        { title: "Sci-Fi Movies", fetch: () => discoverMovies({ with_genres: "878", sort_by: "popularity.desc" }) },
        { title: "Thriller Movies", fetch: () => discoverMovies({ with_genres: "53", sort_by: "popularity.desc" }) },
        { title: "Drama Series", fetch: () => discoverTVShows({ with_genres: "18", sort_by: "popularity.desc" }) },
        { title: "Crime Series", fetch: () => discoverTVShows({ with_genres: "80", sort_by: "popularity.desc" }) },
        { title: "Sci-Fi & Fantasy Series", fetch: () => discoverTVShows({ with_genres: "10765", sort_by: "popularity.desc" }) },
        { title: "Korean Dramas", fetch: () => discoverTVShows({ with_origin_country: "KR", sort_by: "popularity.desc" }) },
        { title: "British Series", fetch: () => discoverTVShows({ with_origin_country: "GB", sort_by: "popularity.desc" }) },
        { title: "Anime", fetch: () => discoverTVShows({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }) },
        { title: "Documentary", fetch: () => discoverMovies({ with_genres: "99", sort_by: "popularity.desc" }) },
        { title: "Family Movies", fetch: () => discoverMovies({ with_genres: "10751", sort_by: "popularity.desc" }) },
        { title: "War Movies", fetch: () => discoverMovies({ with_genres: "10752", sort_by: "popularity.desc" }) },
        { title: "Mystery Series", fetch: () => discoverTVShows({ with_genres: "9648", sort_by: "popularity.desc" }) },
        { title: "Reality TV", fetch: () => discoverTVShows({ with_genres: "10764", sort_by: "popularity.desc" }) },
        { title: "Adventure Movies", fetch: () => discoverMovies({ with_genres: "12", sort_by: "popularity.desc" }) },
        { title: "Fantasy Movies", fetch: () => discoverMovies({ with_genres: "14", sort_by: "popularity.desc" }) },
        { title: "Music & Musical", fetch: () => discoverMovies({ with_genres: "10402", sort_by: "popularity.desc" }) },
        { title: "Western", fetch: () => discoverMovies({ with_genres: "37", sort_by: "popularity.desc" }) },
        { title: "History", fetch: () => discoverMovies({ with_genres: "36", sort_by: "popularity.desc" }) },
      ];

      // Set initial loading state
      setSections(
        sectionConfigs.map((config) => ({
          title: config.title,
          items: [],
          isLoading: true,
          showRank: config.showRank,
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
      console.error("Failed to load content:", error);
      setIsHeroLoading(false);
    }
  };

  // Check for continue watching
  // const continueWatching = getContinueWatching(); // Replaced by hook above

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Hero Banner */}
      <HeroBanner items={heroItems} isLoading={isHeroLoading} className="-mt-14 md:-mt-16" />

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 md:-mt-40 pb-12">
        {sections.map((section, index) => {
          const isTopTen = section.showRank === true;

          // Render the section
          const sectionNode = isTopTen && section.items.length > 0 ? (
            <TopTenRow
              key={section.title}
              title={section.title}
              items={section.items.slice(0, 10).map((item, idx) => ({
                id: item.id,
                rank: idx + 1,
                title: "title" in item ? item.title : item.name,
                posterPath: getImageUrl(item.poster_path, IMAGE_SIZES.poster.medium),
                mediaType: "media_type" in item ? (item.media_type as "movie" | "tv") : ("title" in item ? "movie" : "tv"),
                isNew: idx < 2,
              }))}
            />
          ) : (
            <ContentRow
              key={section.title}
              title={section.title}
              items={section.items}
              isLoading={section.isLoading}
              showRank={section.showRank}
            />
          );

          // If this is the "Trending Now" section (index 0), render Continue Watching after it
          if (index === 0) {
            return (
              <React.Fragment key={section.title}>
                {sectionNode}

                {/* Continue Watching Row */}
                {continueWatching.length > 0 && (
                  <ContentRow
                    title="Continue Watching"
                    action={
                      <button
                        onClick={() => {
                          localStorage.removeItem("skyflix_continue_watching");
                          window.location.reload(); // Simple reload to refresh state
                        }}
                        className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    }
                    items={continueWatching.map((item) => ({
                      id: item.id,
                      type: item.type,  // CRITICAL: Pass through explicit type field
                      title: item.title,
                      name: item.title,
                      poster_path: item.posterPath,
                      backdrop_path: item.backdropPath,
                      overview: "",
                      vote_average: 0,
                      vote_count: 0,
                      genre_ids: [],
                      popularity: 0,
                      original_language: "en",
                      release_date: "",
                      first_air_date: "",
                      adult: false,
                      video: false,
                      original_title: item.title,
                      original_name: item.title,
                      origin_country: [],
                    } as any))}
                  />
                )}
              </React.Fragment>
            );
          }

          return sectionNode;
        })}
      </div>

      <Footer />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
