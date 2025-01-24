// src/__tests__/utils/test-data.ts
import type { Playlist } from '../../types/spotify/playlist';

export const TEST_DATA = {
  TRACKS: {
    BOHEMIAN_RHAPSODY: {
      id: '3z8h0TU7ReDPLIbEnYhWZb',
      name: 'Bohemian Rhapsody',
      artists: [{ name: 'Queen' }],
      album: { name: 'A Night at the Opera' }
    }
  },
  PLAYLISTS: {
    EXAMPLE: {
      collaborative: false,
      description: 'Spotify Official Playlist',
      external_urls: {
        spotify: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
      },
      followers: { href: null, total: 1000 },
      href: 'https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M',
      id: '37i9dQZF1DXcBWIGoYBM5M', // Valid Spotify-owned playlist ID
      images: [{
        url: 'https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228',
        height: 300,
        width: 300
      }],
      name: "Today's Top Hits",
      owner: {
        external_urls: { spotify: 'https://open.spotify.com/user/spotify' },
        href: 'https://api.spotify.com/v1/users/spotify',
        id: 'spotify', // Verified Spotify owner ID
        type: 'user',
        uri: 'spotify:user:spotify',
        display_name: 'Spotify'
      },
      public: true,
      snapshot_id: 'MTY5NjgyODIxNiwwMDAwMDAwMGQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0Mjdl',
      tracks: {
        href: 'https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M/tracks',
        items: [],
        limit: 100,
        next: null,
        offset: 0,
        previous: null,
        total: 50
      },
      type: 'playlist',
      uri: 'spotify:playlist:37i9dQZF1DXcBWIGoYBM5M',
      available_markets: ['US', 'GB', 'CA']
    } as Playlist,
    // Remove RATE_LIMITED entry as we'll test with real requests
  },
  MARKETS: {
    US: 'US',
    GB: 'GB',
    JP: 'JP'
  }
};