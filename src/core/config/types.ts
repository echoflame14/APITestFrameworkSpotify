// src/core/config/types.ts
export interface SpotifyConfig {
    auth: {
        clientId: string;
        clientSecret: string;
        tokenEndpoint: string;
    };
    api: {
        baseURL: string;
        timeout: number;
        retries: number;
        retryDelay: number;
    };
}

// Add this if not already present in the file
export type ResourceType = 
  'track' | 
  'playlist' | 
  'album' | 
  'artist' |
  'paged-playlists';  // Add the new resource type