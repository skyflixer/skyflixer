

# 🎬 SKYFLIX - Premium Streaming Platform

## Project Overview
Build **SKYFLIX**, a Netflix-improved streaming platform with premium design, Netflix-style animations, and full TMDB API integration. The app will be fully responsive, work on all devices, and feature a polished, modern UI that surpasses Netflix in design quality.

---

## 🎨 Core Design System

### Visual Identity
- **Dark Theme**: Deep black (#0a0a0a to #141414) with electric blue accent (#0ea5e9)
- **Typography**: Inter font family, responsive sizing across all breakpoints
- **Effects**: Glassmorphism, backdrop blur, smooth gradients, deep shadows
- **Animation Standard**: Netflix-style with 1.5x scale hover, 0.5s delay, smooth cubic-bezier transitions

### Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px  
- Laptop: 1024px - 1439px
- Desktop: 1440px+

---

## 📱 Features & Pages

### 1. Profile Selection Screen (Entry Point)
- "Who's watching?" full-screen interface
- 5 profile slots with customizable avatars
- "Add Profile" option with modal form
- "Manage Profiles" mode with edit/delete capability
- Smooth fade transitions to homepage

### 2. Navigation Bar (All Pages)
- **Desktop**: SKYFLIX logo + horizontal nav links + search/notifications/profile icons
- **Mobile**: Hamburger menu with slide-out navigation
- Transparent on top, becomes solid (#0a0a0a) with blur on scroll
- Sticky positioning with smooth transitions

### 3. Homepage
- **Hero Banner**: 80vh (desktop) / 60vh (mobile) with featured content
  - Large title (64px → 32px responsive)
  - Play + More Info buttons with clear visibility
  - Age rating badge and content tags
- **Content Rows**: 30 horizontal scrollable rows × 25 cards each
  - Categories: Trending, Top 10, Popular, New Releases, Continue Watching, Genre-specific rows
  - **Netflix-style hover**: 1.5x scale with expanded card showing action buttons, metadata, genres
  - Scroll arrows visible on row hover (desktop only)
  - Touch swipe on mobile

### 4. Movies Page
- Page title with genre filter pills (scrollable on mobile)
- 20 rows × 25 movies each
- Genre-filtered content from TMDB
- Same card design and hover effects as homepage

### 5. TV Shows Page
- Same structure as Movies page
- TV-specific genre filters
- 20 rows × 25 shows each
- Origin country filters (Korean, British, etc.)

### 6. Anime Page
- Filtered from TMDB (Animation genre + Japan origin)
- 20 rows × 25 anime titles
- Anime-specific categories (Shonen, Isekai, Slice of Life, etc.)

### 7. My Watch List Page
- **Empty State**: Centered message with "Browse Content" button
- **With Items**: Responsive grid layout (6/4/3/2 columns based on screen)
- Remove button on hover (desktop) or always visible (mobile)
- Sort/Filter dropdown (Recently Added, A-Z, Rating, etc.)
- Confirmation dialog for removals

### 8. Movie Detail Page
- Full hero with backdrop image and gradient overlays
- Title, year, duration, HD badge, age rating, content tags
- Full synopsis, cast list (expandable), genres, mood tags
- Floating "+ Add to Watchlist" button
- "More Like This" section: 3×2 grid of similar movies (randomized each load)

### 9. TV Show Detail Page
- Same hero as movie detail
- Seasons info displayed
- **Episodes Section**:
  - Season selector dropdown (SEASON 01, SEASON 02 format)
  - Vertical episode list with thumbnails, titles, durations
  - Download button (⬇) on each episode
- "More Like This" section with similar shows

### 10. Download Modal
- Full-screen overlay with episode info
- Quality options (480p, 720p HD, 1080p, 4K)
- File size display for each option
- Direct download links (admin-provided, stored in localStorage)

### 11. Search Functionality
- Full-screen search overlay triggered by search icon
- Auto-focused search input with live results
- Real-time search with 300ms debounce
- Results grid (5-6 columns desktop, 2 columns mobile)
- Recent searches stored in localStorage
- No results state with helpful message
- ESC key to close

### 12. Footer (All Pages)
- Copyright text and indexing disclaimer
- Links: Privacy Policy, DMCA, Credits, Join Telegram
- Telegram link highlighted with accent color
- Responsive stacking (horizontal desktop, vertical mobile)

### 13. Static Pages
- Privacy Policy, DMCA, Credits pages
- Admin-editable content (stored in localStorage)
- Consistent styling with back navigation

---

## 🔌 Technical Implementation

### TMDB API Integration
- API Key: `f89e5199c51d928d4280f590b31ca5cd`
- Endpoints: Trending, Popular, Top Rated, Search, Discover, Details, Recommendations
- Image optimization: Use appropriate sizes (w342 for cards, w780 for detail, original for hero)
- Response caching (1 hour) in localStorage
- Proper error handling and retry logic

### Data Storage (localStorage)
- User profiles (name, avatar, settings)
- Watch list items
- Watch history/continue watching
- Recent searches
- Admin content (download links, static page content)
- API response cache

### Performance Optimizations
- Lazy loading for images and components
- Skeleton screens with shimmer animation (no spinners)
- Code splitting by route
- Debounced search and scroll events
- GPU-accelerated animations (transform, opacity only)
- Intersection Observer for viewport-based loading

### Accessibility (WCAG AA)
- Semantic HTML structure
- ARIA labels on all interactive elements
- Full keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Visible focus states
- Color contrast compliance (4.5:1 minimum)
- Reduced motion support

---

## 🎯 User Experience Highlights

### Animations & Micro-interactions
- Netflix-style card expansion (1.5x scale, 0.5s hover delay)
- Smooth page transitions with fade effects
- Button hover states with subtle scale
- Toast notifications for actions (add/remove watchlist)
- Scroll arrows appear on row hover

### Mobile Experience
- Touch-friendly (44x44px minimum tap targets)
- Native swipe gestures for horizontal scrolling
- Hamburger menu navigation
- Full-screen modals optimized for mobile
- Responsive typography and spacing

---

## 📋 Deliverables

1. **Fully responsive frontend** matching all design specifications
2. **Complete TMDB integration** with caching
3. **All 13+ screens/pages** with consistent styling
4. **Netflix-quality animations** and interactions
5. **Working watch list** with localStorage persistence
6. **Search functionality** with real-time results
7. **Download modal system** ready for admin links
8. **Profile management** system

This will be a polished, production-ready streaming platform UI that rivals Netflix in design and user experience! 🚀

