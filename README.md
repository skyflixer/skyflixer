# SKYFLIX Streaming Platform

A modern streaming platform built with React (frontend) and Express.js (backend), featuring content from TMDB API.

## Project Structure

```
skyflix/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/      # API configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── server.js    # Main server file
│   ├── .env             # Backend environment variables
│   └── package.json
│
├── frontend/            # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/   # API service layer
│   │   └── App.tsx
│   ├── .env            # Frontend environment variables
│   └── package.json
│
├── package.json        # Root package.json with npm scripts
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skyflix
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   
   This command will install dependencies for the root, backend, and frontend.

### Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend/` directory:
```
PORT=5000
TMDB_API_KEY=your_tmdb_api_key_here
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

#### Frontend (.env)
Create a `.env` file in the `frontend/` directory:
```
VITE_BACKEND_URL=http://localhost:5000
```

**Note:** The backend `.env` already contains the TMDB API key. For production, make sure to use your own API key.

## Running the Application

### Development Mode (Recommended)

Start both frontend and backend servers simultaneously:
```bash
npm run dev
```

This will start:
- **Backend API** on `http://localhost:5000`
- **Frontend** on `http://localhost:8080`

### Individual Servers

Start backend only:
```bash
npm run dev:backend
```

Start frontend only:
```bash
npm run dev:frontend
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build the frontend for production
- `npm run install:all` - Install all dependencies
- `npm run preview` - Preview the production build

## Features

- 🎬 Browse movies and TV shows from TMDB
- 🔍 Search functionality
- 📺 Watch content with video player integration
- 👤 Profile management system
- 📱 Responsive design for mobile and desktop
- ⚡ Fast and optimized with Vite
- 🎨 Modern UI with Tailwind CSS and shadcn/ui components

## API Endpoints

The backend provides the following TMDB API endpoints:

### Movies
- `GET /api/tmdb/movie/popular` - Get popular movies
- `GET /api/tmdb/movie/top_rated` - Get top rated movies
- `GET /api/tmdb/movie/:id` - Get movie details
- `GET /api/tmdb/movie/:id/credits` - Get movie credits
- `GET /api/tmdb/movie/:id/similar` - Get similar movies

### TV Shows
- `GET /api/tmdb/tv/popular` - Get popular TV shows
- `GET /api/tmdb/tv/top_rated` - Get top rated TV shows
- `GET /api/tmdb/tv/:id` - Get TV show details
- `GET /api/tmdb/tv/:id/credits` - Get TV show credits

### Search
- `GET /api/tmdb/search/multi?query=term` - Search movies and TV shows
- `GET /api/tmdb/search/movie?query=term` - Search movies
- `GET /api/tmdb/search/tv?query=term` - Search TV shows

### Other
- `GET /api/tmdb/trending/:mediaType/:timeWindow` - Get trending content
- `GET /health` - Backend health check

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Axios for API calls
- React Router for navigation
- Radix UI primitives

### Backend
- Express.js
- Axios for TMDB API calls
- CORS enabled
- Environment variable management with dotenv
- In-memory caching

## Development

### Frontend Development
The frontend uses Vite for fast hot module replacement (HMR). Any changes to the frontend code will automatically reload in the browser.

### Backend Development
The backend uses nodemon for automatic restart on file changes. The server will restart whenever you modify any `.js` file in the backend.

### Debugging
- Backend logs are displayed in the console with request paths
- Frontend errors appear in the browser console
- Use `http://localhost:5000/health` to check backend status

## Troubleshooting

### Backend not starting
- Check if port 5000 is already in use
- Verify environment variables in `backend/.env`
- Ensure all dependencies are installed: `cd backend && npm install`

### Frontend not connecting to backend
- Verify `VITE_BACKEND_URL` in `frontend/.env` is set to `http://localhost:5000`
- Check if backend is running
- Check browser console for CORS errors

### API errors
- Verify TMDB API key is correct in `backend/.env`
- Check if you've exceeded TMDB API rate limits
- Review backend console for detailed error messages

## Production Build

To build the frontend for production:
```bash
npm run build
```

The build output will be in `frontend/dist/`.

## License

MIT
