import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import Lenis from 'lenis';

// Lazy load all page components for code splitting
const ProfileSelection = lazy(() => import("./pages/ProfileSelection"));
const HomePage = lazy(() => import("./pages/HomePage"));
const MoviesPage = lazy(() => import("./pages/MoviesPage"));
const TVShowsPage = lazy(() => import("./pages/TVShowsPage"));
const AnimePage = lazy(() => import("./pages/AnimePage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const MovieDetailPage = lazy(() => import("./pages/MovieDetailPage"));
const TVShowDetailPage = lazy(() => import("./pages/TVShowDetailPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const DMCAPage = lazy(() => import("./pages/DMCAPage"));
const CreditsPage = lazy(() => import("./pages/CreditsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VideoPlayerPage = lazy(() => import("./pages/VideoPlayerPage"));
const DownloadPage = lazy(() => import("./pages/DownloadPage"));

// Admin pages
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => {
  // Initialize smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: true,
      touchMultiplier: 2,
    } as any);

    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Block right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ProfileSelection />} />
              <Route path="/browse" element={<HomePage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/tv-shows" element={<TVShowsPage />} />
              <Route path="/anime" element={<AnimePage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/movie/:slug" element={<MovieDetailPage />} />
              <Route path="/tv/:slug" element={<TVShowDetailPage />} />
              <Route path="/tv/:slug/season-:season-episode-:episode" element={<TVShowDetailPage />} />
              <Route path="/watch/:type/:id" element={<VideoPlayerPage />} />
              <Route path="/download/:type/:id" element={<DownloadPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/dmca" element={<DMCAPage />} />
              <Route path="/credits" element={<CreditsPage />} />

              {/* Admin Routes */}
              <Route path="/zends3389" element={<AdminLoginPage />} />
              <Route path="/zends3389/dashboard" element={<AdminDashboardPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
