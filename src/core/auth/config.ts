// src/core/auth/config.ts

export interface AuthConfig {
    clientId: string;
    clientSecret: string;
    tokenEndpoint?: string;
}

export const DEFAULT_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

export const validateAuthConfig = (config: AuthConfig): AuthConfig => {
    if (!config.clientId || !config.clientSecret) {
        throw new Error('Missing required Spotify credentials');
    }

    return {
        ...config,
        tokenEndpoint: config.tokenEndpoint || DEFAULT_TOKEN_ENDPOINT
    };
};