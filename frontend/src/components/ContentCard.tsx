import React from "react";
import { cn } from "@/lib/utils";
import { getImageUrl, IMAGE_SIZES, createSlug } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";

interface ContentCardSkeletonProps {
  className?: string;
}

export function ContentCardSkeleton({ className }: ContentCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 aspect-[2/3] rounded-md overflow-hidden shimmer",
        className
      )}
    />
  );
}

interface ContentCardProps {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  releaseYear?: string;
  overview?: string;
  genreIds?: number[];
  rank?: number; // For Top 10 badge
  className?: string;
  onClick?: () => void;
  onAddToWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  onRemoveFromWatchlist?: () => void;
  isInWatchlist?: boolean;
  hoverPosition?: "top" | "center";
}

export function ContentCard({
  id,
  type,
  title,
  posterPath,
  backdropPath,
  voteAverage,
  releaseYear,
  overview,
  genreIds,
  rank,
  className,
  onClick,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist,
  index = 0,
  totalCount = 0,
  hoverPosition = "top",
}: ContentCardProps & { index?: number; totalCount?: number; hoverPosition?: "top" | "center" }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Detect if card is at edges to prevent overflow
  const isLeftEdge = index === 0; // First card
  const isRightEdge = totalCount > 0 && index === totalCount - 1; // Last card

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500); // Netflix-style 0.5s delay
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const imageUrl = getImageUrl(posterPath, IMAGE_SIZES.poster.medium);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex-shrink-0 cursor-pointer group",
        "transition-transform duration-300 ease-out",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${title}${releaseYear ? ` (${releaseYear})` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Main Card */}
      <div
        className={cn(
          "relative aspect-[2/3] rounded-md overflow-hidden",
          "transition-all duration-300 ease-out",
          // Removed scaling on the card itself to prevent jitter, hover card handles the "pop"
          isHovered && "z-50"
        )}
      >
        {/* Image */}
        {!imageLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}
        <img
          src={imageUrl}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
            setImageLoaded(true);
          }}
        />

        {/* Top 10 Badge */}
        {rank && rank <= 10 && (
          <div className="top-10-badge">
            TOP {rank}
          </div>
        )}

        {/* Gradient Overlay on Hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          )}
        />

        {/* Quick Info on Hover */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "transform translate-y-2 group-hover:translate-y-0"
          )}
        >
          {/* Metadata hidden as requested */}
        </div>
      </div>

      {/* Expanded Card on Hover (SKYFLIXERED) - FIXED POSITIONING */}
      {isHovered && (
        <div
          className={cn(
            "absolute z-50",
            hoverPosition === "top" ? "bottom-full mb-2" : "top-1/2 -translate-y-1/2",
            isLeftEdge ? "left-0 origin-bottom-left" :
              isRightEdge ? "right-0 origin-bottom-right" :
                "left-1/2 -translate-x-1/2 origin-bottom",
            "w-[320px] bg-card rounded-lg overflow-hidden shadow-2xl",
            "animate-scale-in"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            animationDuration: "400ms",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Backdrop Image */}
          <div className="relative aspect-video">
            <img
              src={getImageUrl(backdropPath || posterPath, IMAGE_SIZES.backdrop.medium)}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-opacity-90 transition text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  if (type === 'tv') {
                    navigate(`/tv/${createSlug(title)}`, { state: { id, openPlayer: true } });
                  } else {
                    navigate(`/movie/${createSlug(title)}`, { state: { id, openPlayer: true } });
                  }
                }}
              >
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>

              <button
                className="w-10 h-10 border-2 border-gray-500 rounded-full flex items-center justify-center hover:border-white transition"
                onClick={(e) => {
                  e.stopPropagation();
                  isInWatchlist ? onRemoveFromWatchlist?.() : onAddToWatchlist?.();
                }}
                aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isInWatchlist ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>

              <button
                className="w-10 h-10 border-2 border-gray-500 rounded-full flex items-center justify-center hover:border-white transition ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                aria-label="More info"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Match & Info - Hidden as requested */}
            {/* 
            <div className="flex items-center gap-2 text-sm">
              {voteAverage !== undefined && voteAverage > 0 && (
                <span className="text-skyflix-success font-semibold">
                  {Math.round(voteAverage * 10)}% Match
                </span>
              )}
              {releaseYear && <span className="text-muted-foreground">{releaseYear}</span>}
              <span className="age-badge">
                {type === "movie" ? "FHD" : "Series"}
              </span>
              <span className="age-badge">13+</span>
            </div>
            */}

            {/* Genres - showing generic since we just have IDs */}
            <div className="text-xs text-muted-foreground">
              {type === "movie" ? "Movie" : "TV Series"} • Thriller • Drama
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
