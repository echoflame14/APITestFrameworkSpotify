// src/core/config/manager.ts
import { SpotifyConfig } from './types';
import dotenv from 'dotenv';

export class ConfigManager {
    private config: SpotifyConfig;

    constructor() {
        // Load environment variables
        dotenv.config();
        
        this.config = this.loadConfig();
    }

    private loadConfig(): SpotifyConfig {
        const {
            SPOTIFY_CLIENT_ID,
            SPOTIFY_CLIENT_SECRET,
            SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token',
            SPOTIFY_API_BASE = 'https://api.spotify.com/v1',
            SPOTIFY_TIMEOUT = '10000',
            SPOTIFY_RETRIES = '3',
            SPOTIFY_RETRY_DELAY = '1000'
        } = process.env;

        // Validate required credentials
        if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
            throw new Error('Missing required Spotify credentials in environment variables');
        }

        return {
            auth: {
                clientId: SPOTIFY_CLIENT_ID,
                clientSecret: SPOTIFY_CLIENT_SECRET,
                tokenEndpoint: SPOTIFY_TOKEN_ENDPOINT
            },
            api: {
                baseURL: SPOTIFY_API_BASE,
                timeout: parseInt(SPOTIFY_TIMEOUT, 10),
                retries: parseInt(SPOTIFY_RETRIES, 10),
                retryDelay: parseInt(SPOTIFY_RETRY_DELAY, 10)
            }
        };
    }

    getConfig(): SpotifyConfig {
        return this.config;
    }
}