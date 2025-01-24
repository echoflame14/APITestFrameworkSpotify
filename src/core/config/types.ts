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