// src/lib/auth/auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import type { Account } from 'next-auth';
import { TokenManager } from './token-manager';
import { SpotifyHttpError } from '@/core/http/errors/spotify-errors';

// Token-specific types
export interface SpotifyToken extends JWT {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  error?: string;
}

export interface SpotifyUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface SpotifySession extends Session {
  error?: string;
  accessToken?: string;
  user?: SpotifyUser;
}

// Spotify OAuth scopes
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');

// Helper function to create a token object
function createTokenObject(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): SpotifyToken {
  return {
    accessToken,
    refreshToken,
    accessTokenExpires: Date.now() + expiresIn * 1000,
  };
}

export const authConfig: NextAuthConfig = {
  providers: [], // Moved to auth.ts
  callbacks: {
    async jwt({ token, account }) {
      const tokenManager = TokenManager.getInstance();

      try {
        // Initial sign in
        if (account) {
          return createTokenObject(
            account.access_token!,
            account.refresh_token!,
            account.expires_in as number
          );
        }

        const spotifyToken = token as SpotifyToken;

        // Check if token needs refresh
        if (tokenManager.shouldRefreshToken(spotifyToken)) {
          const refreshedToken = await tokenManager.refreshToken(spotifyToken);
          return refreshedToken;
        }

        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        
        // Handle specific Spotify errors
        if (error instanceof SpotifyHttpError) {
          return {
            ...token,
            error: error.code,
          };
        }

        // Handle unknown errors
        return {
          ...token,
          error: 'TokenRefreshError',
        };
      }
    },

    async session({ session, token }: { session: SpotifySession; token: JWT }) {
      try {
        // Copy error from token to session if present
        if (token.error) {
          session.error = token.error as string;
        }

        // Copy access token to session
        session.accessToken = token.accessToken as string;

        // Add user data if available
        if (token.sub && session.user) {
          session.user = {
            ...session.user,
            // We don't set the id since it's not in our SpotifyUser type
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          };
        }

        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        session.error = 'SessionError';
        return session;
      }
    }
  },

  pages: {
    signIn: '/login',
  },

  // Additional security configurations
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};