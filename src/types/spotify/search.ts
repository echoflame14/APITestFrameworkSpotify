// src/types/spotify/search.ts

// Supported search types from Spotify API
export type SearchType = 'album' | 'artist' | 'playlist' | 'track' | 'show' | 'episode' | 'audiobook';

// Search filter fields
export interface SearchFilters {
  artist?: string;
  album?: string;
  track?: string;
  year?: string | `${number}-${number}`; // Can be single year or range
  genre?: string;
  isrc?: string;
  upc?: string;
  tag?: 'hipster' | 'new';
}

// Base search parameters
export interface SearchParameters {
  q: string;
  type: SearchType[];
  market?: string;
  limit?: number;
  offset?: number;
  include_external?: 'audio';
  filters?: SearchFilters;
}

// Format for API request
export interface SearchRequestParams extends Omit<SearchParameters, 'type' | 'filters'> {
  type: string; // Comma-separated list of types
}

// Common interfaces
interface ExternalUrls {
  spotify: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface PaginatedResponse<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

// Spotify entity interfaces
interface SpotifyArtistRef {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: 'artist';
  uri: string;
}

interface SpotifyAlbumRef {
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
    reason: string;
  };
  type: 'album';
  uri: string;
  artists: SpotifyArtistRef[];
}

export interface SpotifyTrack {
  album: SpotifyAlbumRef;
  artists: SpotifyArtistRef[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_playable: boolean;
  linked_from?: any;
  restrictions?: {
    reason: string;
  };
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: 'track';
  uri: string;
  is_local: boolean;
}

export interface SpotifyArtist extends SpotifyArtistRef {
  followers: {
    href: string | null;
    total: number;
  };
  genres: string[];
  images: Image[];
  popularity: number;
}

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: {
    external_urls: ExternalUrls;
    followers?: {
      href: string | null;
      total: number;
    };
    href: string;
    id: string;
    type: 'user';
    uri: string;
    display_name: string;
  };
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: 'playlist';
  uri: string;
}

// Search response interface
export interface SearchResponse {
  tracks?: PaginatedResponse<SpotifyTrack>;
  artists?: PaginatedResponse<SpotifyArtist>;
  albums?: PaginatedResponse<SpotifyAlbumRef>;
  playlists?: PaginatedResponse<SpotifyPlaylist>;
  shows?: PaginatedResponse<SpotifyShow>;
  episodes?: PaginatedResponse<SpotifyEpisode>;
  audiobooks?: PaginatedResponse<SpotifyAudiobook>;
}

// Additional types for shows, episodes, and audiobooks
interface SpotifyShow {
  available_markets: string[];
  copyrights: Array<{
    text: string;
    type: string;
  }>;
  description: string;
  html_description: string;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  is_externally_hosted: boolean;
  languages: string[];
  media_type: string;
  name: string;
  publisher: string;
  type: 'show';
  uri: string;
  total_episodes: number;
}

interface SpotifyEpisode {
  audio_preview_url: string | null;
  description: string;
  html_description: string;
  duration_ms: number;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  is_externally_hosted: boolean;
  is_playable: boolean;
  language: string;
  languages: string[];
  name: string;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  resume_point?: {
    fully_played: boolean;
    resume_position_ms: number;
  };
  type: 'episode';
  uri: string;
  restrictions?: {
    reason: string;
  };
}

interface SpotifyAudiobook {
  authors: Array<{ name: string }>;
  available_markets: string[];
  copyrights: Array<{
    text: string;
    type: string;
  }>;
  description: string;
  html_description: string;
  edition?: string;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  languages: string[];
  media_type: string;
  name: string;
  narrators: Array<{ name: string }>;
  publisher: string;
  type: 'audiobook';
  uri: string;
  total_chapters: number;
}