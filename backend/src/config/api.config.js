import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    tmdb: {
        apiKey: process.env.TMDB_API_KEY,
        baseUrl: 'https://api.themoviedb.org/3',
        imageBase: 'https://image.tmdb.org/t/p',
    },
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'https://skyflixer.pages.dev',
            'https://skyflixer.pages.dev',       // Cloudflare Pages (new)
            'https://skyflixer.netlify.app',      // Netlify (old, kept as fallback)
            'http://localhost:8080',              // Frontend dev server (Vite)
            'http://127.0.0.1:8080',
            'http://localhost:5173',             // Vite default (fallback)
            'http://127.0.0.1:5173'
        ],
        credentials: true,
    },

    cache: {
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
    },
};
