import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/api.config.js';
import tmdbRoutes from './routes/tmdb.routes.js';
import videohostingRoutes from './routes/videohosting.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { rebuildIndex, startAutoRefresh } from './services/videoindex.service.js';

const app = express();

// Middleware
app.use(compression());
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (config.port === 5000 || process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SKYFLIX Backend API' });
});

// Root
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running successfully' });
});

// API routes
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/videohosting', videohostingRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`\n🚀 SKYFLIX Backend API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 TMDB API: http://localhost:${PORT}/api/tmdb`);
    console.log(`🌐 CORS enabled for: ${config.cors.origin}\n`);

    // Build the video index in the background (non-blocking — zero startup delay)
    rebuildIndex().catch(err => console.error('[startup] Index build failed:', err.message));
    startAutoRefresh();
});

export default app;
