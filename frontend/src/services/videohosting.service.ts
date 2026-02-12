import apiClient from './api.service';

/**
 * TMDB Data interface for video hosting
 */
export interface VideoHostingRequest {
    title: string;
    type: 'movie' | 'series' | 'tv';
    year?: number;
    season?: number;
    episode?: number;
}

/**
 * Single server response
 */
export interface ServerResponse {
    hostName: string;
    available: boolean;
    embedUrl?: string;
    downloadUrl?: string;
    source?: 'primary' | 'fallback';
    error?: string;
}

/**
 * Complete response from backend
 */
export interface VideoHostingResponse {
    servers: {
        streamp2p?: ServerResponse;
        seekstreaming?: ServerResponse;
        upnshare?: ServerResponse;
        rpmshare?: ServerResponse;
    };
    availableCount: number;
    tmdbData: VideoHostingRequest;
}

/**
 * Fetch videos from all hosting services
 */
export async function fetchVideoHosting(tmdbData: VideoHostingRequest): Promise<VideoHostingResponse> {
    try {
        const response = await apiClient.post<VideoHostingResponse>('/api/videohosting/fetch', tmdbData);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching video hosting:', error);
        throw error;
    }
}

/**
 * Get video hosting service status
 */
export async function getVideoHostingStatus() {
    try {
        const response = await apiClient.get('/api/videohosting/status');
        return response.data;
    } catch (error: any) {
        console.error('Error getting video hosting status:', error);
        throw error;
    }
}

/**
 * Get first available server
 */
export function getFirstAvailableServer(response: VideoHostingResponse): ServerResponse | null {
    const servers = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'] as const;

    for (const serverName of servers) {
        const server = response.servers[serverName];
        if (server && server.available && server.embedUrl) {
            return server;
        }
    }

    return null;
}

/**
 * Get all available servers
 */
export function getAvailableServers(response: VideoHostingResponse): ServerResponse[] {
    const servers = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'] as const;
    const available: ServerResponse[] = [];

    for (const serverName of servers) {
        const server = response.servers[serverName];
        if (server && server.available && server.embedUrl) {
            available.push(server);
        }
    }

    return available;
}
