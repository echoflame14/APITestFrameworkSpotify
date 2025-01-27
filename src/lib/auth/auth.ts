// src/lib/auth/auth.ts
import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import { authConfig, SPOTIFY_SCOPES } from "./auth.config";

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope: SPOTIFY_SCOPES }
      }
    })
  ]
});