// src/__tests__/utils/constants.ts
export const TRACK_IDS = {
    BOHEMIAN_RHAPSODY: '7tFiyTwD0nx5a1eklYtX2J', // Verified track ID
    COMPILATION_TRACK: '5mJd9OobqE7UZ5TgDvKPHV', // From compilation "Now That's What I Call Music!"
    SINGLE_TRACK: '6rqhFgbbKwnb9MLmUQDhG6',      // Example: "Easy On Me" (Single) - Adele
    GEO_RESTRICTED: '2S5ogg0l3YdV3AEWYIwl8k',    // Hypothetical geo-restricted track (Japan)
    NON_EXISTENT: 'nonexistentid12345',
};

export const MARKETS = {
    US: 'US',
    JP: 'JP',
    GB: 'GB',
    INVALID: 'XX'
} as const;

export const TEST_TIMEOUTS = {
    QUICK: 5000,
    NORMAL: 10000,
    EXTENDED: 30000,
    NETWORK: 15000
} as const;


// Type for track IDs to ensure type safety
export type TrackId = keyof typeof TRACK_IDS;
export type Market = keyof typeof MARKETS;
export type TimeoutType = keyof typeof TEST_TIMEOUTS;

// Exported response structure based on Spotify API documentation
export interface SpotifyImage {
    url: string;
    height: number;
    width: number;
}

export interface SpotifyArtist {
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: 'artist';
    uri: string;
}

export interface SpotifyAlbum {
    album_type: 'album' | 'single' | 'compilation';
    total_tracks: number;
    available_markets: string[];
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    images: SpotifyImage[];
    name: string;
    release_date: string;
    release_date_precision: 'year' | 'month' | 'day';
    restrictions?: {
        reason: 'market' | 'product' | 'explicit';
    };
    type: 'album';
    uri: string;
    artists: SpotifyArtist[];
}

// Test utilities
export const validateTestEnvironment = (): void => {
    const required = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}. ` +
            'Please add them to your .env file.'
        );
    }
};