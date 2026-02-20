// Auto-detect environment: use local backend when running on localhost, otherwise HuggingFace
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (isLocalhost ? 'http://localhost:5000/api' : 'https://skyflixer1-skyflixer-backend.hf.space/api');
