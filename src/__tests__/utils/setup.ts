// src/__tests__/utils/setup.ts
import { TrackService } from '../../services/tracks/track.service';
import { PlaylistService } from '../../services/playlists/playlist.service';
import { HttpClient } from '../../core/http/client';
import { AuthHandler } from '../../core/auth/handler';
import { ConsoleLogger } from '../../core/logging/console-logger';
import { AuthConfig } from '../../core/auth/types';
import { ServiceDependencies } from '../../services/base.service';

import dotenv from 'dotenv';

// Load environment variables once
dotenv.config();

export interface TestContext {
    trackService: TrackService;
    playlistService: PlaylistService;
    httpClient: HttpClient;
    authHandler: AuthHandler;
    logger: ConsoleLogger;
  }
  

  export async function setupTestContext(): Promise<TestContext> {
    const logger = new ConsoleLogger();

    // Load configuration with defaults
    const authConfig: AuthConfig = {
        clientId: process.env.SPOTIFY_CLIENT_ID!,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
        tokenEndpoint: process.env.SPOTIFY_TOKEN_ENDPOINT || 'https://accounts.spotify.com/api/token'
    };

    // Initialize auth handler
    const authHandler = new AuthHandler(authConfig, logger);
    await authHandler.initialize();

    // Initialize HTTP client
    const httpClient = new HttpClient({
        baseURL: process.env.SPOTIFY_API_BASE || 'https://api.spotify.com/v1',
        timeout: parseInt(process.env.SPOTIFY_TIMEOUT || '10000'),
        retries: parseInt(process.env.SPOTIFY_RETRIES || '3'),
        retryDelay: parseInt(process.env.SPOTIFY_RETRY_DELAY || '1000')
    }, logger);

    // Initialize track service
    const trackService = new TrackService({ http: httpClient, auth: authHandler });

      
    const deps = {
        http: httpClient,
        auth: authHandler
    };
    
      return {
        trackService: new TrackService(deps),
        playlistService: new PlaylistService(deps),
        httpClient,
        authHandler,
        logger
      };

};