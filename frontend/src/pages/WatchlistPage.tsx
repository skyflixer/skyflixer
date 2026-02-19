import React, { useState } from "react";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ContentCard } from "@/components/ContentCard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";
import { WatchlistSortOption } from "@/lib/storage";
import { createSlug } from "@/lib/tmdb";
import { Trash2, ArrowUpDown, Film, Tv } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { watchlist, sortBy, setSortBy, removeFromWatchlist, count } = useWatchlist();
  const [itemToRemove, setItemToRemove] = useState<{ id: number; type: "movie" | "tv"; title: string } | null>(null);
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");

  const filteredWatchlist = watchlist.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  const handleRemove = () => {
    if (itemToRemove) {
      removeFromWatchlist(itemToRemove.id, itemToRemove.type);
      toast({
        title: "Removed from Watchlist",
        description: itemToRemove.title,
        duration: 2000,
      });
      setItemToRemove(null);
    }
  };

  const handleCardClick = (item: typeof watchlist[0]) => {
    navigate(`/${item.type}/${createSlug(item.title)}`, { state: { id: item.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="My Watchlist — Saved Movies & TV Shows"
        description="Your personal watchlist on Skyflixer. Save movies, TV shows & anime to watch later. Keep track of everything you want to stream — all in one place."
      />
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Page Header */}
      <div className="px-4 md:px-8 lg:px-12 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">My List</h1>
            <p className="text-muted-foreground mt-1">
              {count} {count === 1 ? "title" : "titles"}
            </p>
          </div>

          {/* Filters & Sort */}
          {count > 0 && (
            <div className="flex items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    filterType === "all"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("movie")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    filterType === "movie"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Film className="w-4 h-4" />
                  Movies
                </button>
                <button
                  onClick={() => setFilterType("tv")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    filterType === "tv"
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Tv className="w-4 h-4" />
                  TV Shows
                </button>
              </div>

              {/* Sort Dropdown */}
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as WatchlistSortOption)}
              >
                <SelectTrigger className="w-[180px] bg-muted border-border">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="recently_added">Recently Added</SelectItem>
                  <SelectItem value="a_z">A-Z</SelectItem>
                  <SelectItem value="z_a">Z-A</SelectItem>
                  <SelectItem value="rating_high">Rating (High to Low)</SelectItem>
                  <SelectItem value="rating_low">Rating (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 lg:px-12 pb-12 min-h-[50vh]">
        {count === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Film className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Browse movies and TV shows to add them to your watchlist
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="btn-play"
            >
              Browse Content
            </button>
          </div>
        ) : filteredWatchlist.length === 0 ? (
          /* No results for filter */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              No {filterType === "movie" ? "movies" : "TV shows"} in your watchlist
            </p>
          </div>
        ) : (
          /* Watchlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {filteredWatchlist.map((item) => (
              <div key={`${item.type}-${item.id}`} className="relative group">
                <ContentCard
                  id={item.id}
                  type={item.type}
                  title={item.title}
                  posterPath={item.posterPath}
                  backdropPath={item.backdropPath}
                  voteAverage={item.voteAverage}
                  releaseYear={item.releaseYear}
                  overview={item.overview}
                  onClick={() => handleCardClick(item)}
                  isInWatchlist={true}
                  onRemoveFromWatchlist={() =>
                    setItemToRemove({ id: item.id, type: item.type, title: item.title })
                  }
                  hoverPosition="center"
                />

                {/* Remove Button - Always visible on mobile, hover on desktop */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToRemove({ id: item.id, type: item.type, title: item.title });
                  }}
                  className={cn(
                    "absolute top-2 right-2 z-20 p-2 rounded-full",
                    "bg-background/80 backdrop-blur-sm",
                    "text-foreground hover:text-destructive hover:bg-destructive/20",
                    "transition-all duration-200",
                    "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  )}
                  aria-label={`Remove ${item.title} from watchlist`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Watchlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{itemToRemove?.title}" from your watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
