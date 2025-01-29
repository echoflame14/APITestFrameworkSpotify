/**
 * @fileoverview Comprehensive type definitions for Spotify Track-related entities
 * Includes interfaces for tracks, albums, artists, and related metadata
 */

import { ExternalUrls, Image, Restrictions } from './common';

/**
 * Represents various external identification systems for tracks
 */
export interface ExternalIds extends Record<string, string | undefined> {
    readonly isrc?: string;  // International Standard Recording Code
    readonly ean?: string;   // International Article Number
    readonly upc?: string;   // Universal Product Code
}

/**
 * Represents track restrictions by market or other factors
 */
export type RestrictionReason = 'market' | 'product' | 'explicit';

export interface RestrictionInfo {
    readonly reason: RestrictionReason;
}

/**
 * Represents a linked track for territory-specific track relinking
 */
export interface LinkedTrack {
    readonly external_urls: ExternalUrls;
    readonly href: string;
    readonly id: string;
    readonly type: 'track';
    readonly uri: string;
}

/**
 * Represents an artist with essential metadata
 */
export interface Artist {
    readonly external_urls: ExternalUrls;
    readonly href: string;
    readonly id: string;
    readonly name: string;
    readonly type: 'artist';
    readonly uri: string;
}

/**
 * Valid album types in the Spotify API
 */
export type AlbumType = 'album' | 'single' | 'compilation';

/**
 * Release date precision levels
 */
export type ReleaseDatePrecision = 'year' | 'month' | 'day';

/**
 * Represents an album with comprehensive metadata
 */
export interface Album {
    readonly album_type: AlbumType;
    readonly total_tracks: number;
    readonly available_markets: readonly string[];
    readonly external_urls: ExternalUrls;
    readonly href: string;
    readonly id: string;
    readonly images: readonly Image[];
    readonly name: string;
    readonly release_date: string;
    readonly release_date_precision: ReleaseDatePrecision;
    readonly restrictions?: Readonly<RestrictionInfo>;
    readonly type: 'album';
    readonly uri: string;
    readonly artists: readonly Artist[];
}

/**
 * Comprehensive interface for Spotify track objects
 */
export interface Track {
    readonly album: Album;
    readonly artists: readonly Artist[];
    readonly available_markets?: readonly string[];
    readonly disc_number: number;
    readonly duration_ms: number;
    readonly explicit: boolean;
    readonly external_ids: ExternalIds;
    readonly external_urls: ExternalUrls;
    readonly href: string;
    readonly id: string;
    readonly is_playable?: boolean;
    readonly linked_from?: LinkedTrack;
    readonly restrictions?: Readonly<RestrictionInfo>;
    readonly name: string;
    readonly popularity: number;
    readonly preview_url: string | null;
    readonly track_number: number;
    readonly type: 'track';
    readonly uri: string;
    readonly is_local: boolean;
}

/**
 * Parameters for track-related API requests
 */
export interface TrackRequestParams {
    readonly market?: string;  // ISO 3166-1 alpha-2 country code
}

/**
 * Validation interface for essential track properties
 */
export interface TrackValidation {
    readonly is_playable: boolean;
    readonly linked_from?: LinkedTrack;
    readonly duration_ms: number;
    readonly artists: readonly Artist[];
}

/**
 * Type guard to validate Track objects
 * @param response - Unknown response object to validate
 * @returns Type predicate indicating if response is a valid Track
 */
export function isValidTrack(response: unknown): response is Track {
    if (!response || typeof response !== 'object') return false;
    
    const track = response as Track;
    
    // Essential property checks
    const hasRequiredProps = !!(
        track.id &&
        track.name &&
        track.duration_ms > 0 &&
        Array.isArray(track.artists) &&
        track.artists.length > 0 &&
        track.type === 'track' &&
        track.album &&
        track.uri
    );

    if (!hasRequiredProps) return false;

    // Validate nested artist objects
    const hasValidArtists = track.artists.every(artist => 
        artist &&
        typeof artist === 'object' &&
        artist.id &&
        artist.name &&
        artist.type === 'artist'
    );

    // Validate album object
    const hasValidAlbum = !!(
        track.album.id &&
        track.album.name &&
        track.album.type === 'album' &&
        Array.isArray(track.album.images)
    );

    return hasValidArtists && hasValidAlbum;
}

/**
 * Custom error for track validation failures
 */
export class TrackValidationError extends Error {
    constructor(
        public readonly trackId: string,
        public readonly validationErrors: readonly string[],
        public readonly originalData?: unknown
    ) {
        super(`Track validation failed for ${trackId}: ${validationErrors.join(', ')}`);
        this.name = 'TrackValidationError';
        Object.setPrototypeOf(this, TrackValidationError.prototype);
    }
}

/**
 * Helper to extract essential track data for display
 * @param track - Valid track object
 * @returns Simplified track information
 */
export function getTrackSummary(track: Track) {
    return {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        duration: track.duration_ms,
        albumName: track.album.name
    };
}