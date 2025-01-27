// src/lib/auth/token-manager.ts
import { SpotifyHttpError } from '@/core/http/errors/spotify-errors';
import type { SpotifyToken } from './auth.config';

export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<SpotifyToken> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!this.instance) {
      this.instance = new TokenManager();
    }
    return this.instance;
  }

  async refreshToken(token: SpotifyToken): Promise<SpotifyToken> {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    try {
      this.refreshPromise = this.performTokenRefresh(token);
      const refreshedToken = await this.refreshPromise;
      return refreshedToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(token: SpotifyToken): Promise<SpotifyToken> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new SpotifyHttpError(
          error.error_description || 'Failed to refresh token',
          response.status,
          'AUTHENTICATION_ERROR'
        );
      }

      const refreshedTokens = await response.json();

      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      };
    } catch (error) {
      if (error instanceof SpotifyHttpError) {
        throw error;
      }
      throw new SpotifyHttpError(
        'Failed to refresh access token',
        401,
        'AUTHENTICATION_ERROR'
      );
    }
  }

  isTokenExpired(token: SpotifyToken): boolean {
    return Date.now() >= (token.accessTokenExpires || 0);
  }

  shouldRefreshToken(token: SpotifyToken): boolean {
    // Refresh if token is expired or will expire in the next 5 minutes
    const expiresIn = (token.accessTokenExpires || 0) - Date.now();
    return expiresIn < 5 * 60 * 1000;
  }
}