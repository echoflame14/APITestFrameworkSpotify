// src/debug-auth.ts
import dotenv from 'dotenv';
import { AuthHandler } from './core/auth/handler';
import { ConsoleLogger } from './core/logging/console-logger';

async function debugAuth() {
    // Load environment variables
    dotenv.config();
    
    console.log('Environment variables loaded:', {
        clientId: process.env.SPOTIFY_CLIENT_ID ? 'present' : 'missing',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? 'present' : 'missing',
        tokenEndpoint: process.env.SPOTIFY_TOKEN_ENDPOINT || 'https://accounts.spotify.com/api/token'
    });

    const logger = new ConsoleLogger();
    
    const authConfig = {
        clientId: process.env.SPOTIFY_CLIENT_ID!,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
        tokenEndpoint: process.env.SPOTIFY_TOKEN_ENDPOINT || 'https://accounts.spotify.com/api/token'
    };

    try {
        const authHandler = new AuthHandler(authConfig, logger);
        await authHandler.initialize();
        console.log('Authentication successful!');
    } catch (error) {
        console.error('Authentication failed:', error);
    }
}

debugAuth().catch(console.error);