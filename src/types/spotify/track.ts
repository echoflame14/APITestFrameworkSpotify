
// src/types/spotify/track.ts
import { ExternalUrls, Image, Restrictions } from './common';

// External IDs interface
export interface ExternalIds {
    isrc?: string;  // International Standard Recording Code
    ean?: string;   // International Article Number
    upc?: string;   // Universal Product Code
}

// Linked Track interface for track relinking
export interface LinkedTrack {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    type: 'track';
    uri: string;
}

// Artist interface
export interface Artist {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    name: string;
    type: 'artist';
    uri: string;
}

// Album interface
export interface Album {
    album_type: 'album' | 'single' | 'compilation';
    total_tracks: number;
    available_markets: string[];
    external_urls: ExternalUrls;
    href: string;
    id: string;
    images: Image[];
    name: string;
    release_date: string;
    release_date_precision: 'year' | 'month' | 'day';
    restrictions?: {
        reason: 'market' | 'product' | 'explicit';
    };
    type: 'album';
    uri: string;
    artists: Artist[];
}

// Main Track interface
export interface Track {
    album: Album;
    artists: Artist[];
    available_markets?: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: ExternalIds;
    external_urls: ExternalUrls;
    href: string;
    id: string;
    is_playable?: boolean;
    linked_from?: LinkedTrack;
    restrictions?: {
        reason: 'market' | 'product' | 'explicit';
    };
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: 'track';
    uri: string;
    is_local: boolean;
}

// Optional parameters for track requests
export interface TrackRequestParams {
    market?: string;  // ISO 3166-1 alpha-2 country code
}