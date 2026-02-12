import axios from 'axios';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://skyflixer.netlify.app';

/**
 * Axios instance configured for backend API
 */
const apiClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor for debugging
 */
apiClient.interceptors.request.use(
    (config) => {
        // You can add auth tokens here if needed in the future
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error: No response from server');
        } else {
            // Error in request setup
            console.error('Request Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
