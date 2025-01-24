import { ExternalUrls, Image, Restrictions } from './common';
import { Track } from './track'; // Add this import

export interface PagedPlaylists {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: Playlist[];
  }
  
  export interface UserPlaylistsParams {
    limit?: number;
    offset?: number;
  }

export interface Playlist {
  collaborative: boolean;
  description: string | null;
  external_urls: ExternalUrls;
  followers: {
    href: string | null;
    total: number;
  };
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    type: 'user';
    uri: string;
    display_name: string | null;
  };
  public: boolean | null;
  snapshot_id: string;
  tracks: {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: PlaylistItem[];
  };
  type: 'playlist';
  uri: string;
}

export interface PlaylistItem {
  added_at: string;
  added_by: {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    type: 'user';
    uri: string;
  };
  is_local: boolean;
  track: Track; // Reuse existing Track type
}

export interface PlaylistRequestParams {
  market?: string;
  fields?: string;
  additional_types?: string;
}