import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard, ContentCardSkeleton } from "./ContentCard";
import { TMDBMovie, TMDBTVShow, isMovie, getTitle, getReleaseYear, createSlug } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "@/hooks/use-toast";

interface ContentRowProps {
  title: string;
  items: (TMDBMovie | TMDBTVShow)[];
  isLoading?: boolean;
  showRank?: boolean;
  className?: string;
  action?: React.ReactNode;
}

export function ContentRow({
  title,
  items,
  isLoading = false,
  showRank = false,
  className,
  action,
}: ContentRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const handleCardClick = (item: TMDBMovie | TMDBTVShow) => {
    // Check if item has explicit type field (for Continue Watching items)
    const mediaType = (item as any).type || (isMovie(item) ? "movie" : "tv");
    navigate(`/${mediaType}/${createSlug(getTitle(item))}`, { state: { id: item.id } });
  };

  const handleWatchlistToggle = (item: TMDBMovie | TMDBTVShow) => {
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

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
    };
  }, [checkScrollPosition, items]);

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className={cn("relative py-4 group/row", className)}>
      {/* Title & Action */}
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-12 mb-3">
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold">
          {title}
        </h2>
        {action}
      </div>

      {/* Content Container */}
      <div className="relative content-row">
        {/* Left Arrow */}
        <button
          className={cn(
            "scroll-arrow left-2 md:left-4",
            "hidden md:flex",
            !showLeftArrow && "!opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex gap-2 overflow-x-auto hide-scrollbar",
            "px-4 md:px-8 lg:px-12",
            "scroll-smooth items-start"
          )}
          onScroll={checkScrollPosition}
          style={{
            scrollBehavior: "smooth",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            overflowY: "hidden",
            alignItems: "flex-start",
          }}
        >
          {isLoading
            ? Array.from({ length: 10 }).map((_, index) => (
              <ContentCardSkeleton
                key={index}
                className="w-[140px] md:w-[160px] lg:w-[180px]"
              />
            ))
            : items.map((item, index) => {
              // Check if item has explicit type field (for Continue Watching items)
              const mediaType = (item as any).type || (isMovie(item) ? "movie" : "tv");
              const itemTitle = getTitle(item);

              return (
                <div
                  key={`${mediaType}-${item.id}`}
                  className={cn(
                    "flex-shrink-0 cursor-pointer",
                    "md:hover:scale-110 md:hover:z-50 md:transition-transform md:duration-300"
                  )}
                  onClick={() => {
                    // Desktop hover card will be in expanded state
                    if (window.innerWidth < 768) {
                      handleCardClick(item);
                    }
                  }}
                >
                  <ContentCard
                    id={item.id}
                    type={mediaType}
                    title={itemTitle}
                    posterPath={item.poster_path}
                    backdropPath={item.backdrop_path}
                    voteAverage={item.vote_average}
                    releaseYear={getReleaseYear(item)}
                    overview={item.overview}
                    genreIds={item.genre_ids}
                    rank={showRank ? index + 1 : undefined}
                    className="w-[140px] md:w-[160px] lg:w-[180px]"
                    onClick={() => handleCardClick(item)}
                    onAddToWatchlist={() => handleWatchlistToggle(item)}
                    onRemoveFromWatchlist={() => handleWatchlistToggle(item)}
                    isInWatchlist={isInWatchlist(item.id, mediaType)}
                    index={index}
                    totalCount={items.length}
                  />
                </div>
              );
            })}
        </div>

        {/* Right Arrow */}
        <button
          className={cn(
            "scroll-arrow right-2 md:right-4",
            "hidden md:flex",
            !showRightArrow && "!opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
