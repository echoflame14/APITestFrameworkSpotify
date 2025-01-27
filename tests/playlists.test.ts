import axios, { AxiosError } from 'axios'; // Correct import statement
import { TestContext, setupTestContext } from './utils/setup';
import { TEST_TIMEOUTS } from './utils/constants';
import { TEST_DATA } from './utils/test-data';
import { SpotifyRateLimitError } from '../core/http/errors';

describe('Spotify Playlist Service Integration Tests', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestContext();
  }, TEST_TIMEOUTS.EXTENDED);


 // src/__tests__/playlists.test.ts
    test('Fetch complete playlist metadata', async () => {
        const playlist = await context.playlistService.getPlaylist(
            '37i9dQZF1DXcBWIGoYBM5M',
            { market: TEST_DATA.MARKETS.US } // Add market parameter
        );
    
    
        // Basic validation
        expect(playlist).toMatchObject({
        id: '37i9dQZF1DXcBWIGoYBM5M',
        type: 'playlist',
        tracks: {
            items: expect.any(Array)
        }
        });
    
        // Additional checks
        expect(playlist.owner.id).toBe('spotify');
        expect(playlist.name).toBeTruthy();
    }, TEST_TIMEOUTS.EXTENDED);

    test('Handle playlist not found error', async () => {
        // Valid format but non-existent ID
        const validButFakeId = '0y9uTzK9cNAc22aaaaaaaq'; // 22-character alphanumeric
        
        await expect(context.playlistService.getPlaylist(validButFakeId))
        .rejects.toMatchObject({
            code: 'PLAYLIST_NOT_FOUND',
            message: expect.stringContaining('Playlist not found'),
            statusCode: 404
        });
    }, TEST_TIMEOUTS.NORMAL);

  test('Reject invalid playlist ID formats', async () => {
    const testCases = [
      { id: 'invalid_id', reason: 'Too short' },
      { id: '0y9uTzK9cNAc22aaaaaaaq!', reason: 'Special character' },
      { id: '0y9uTzK9cNAc22aaaaaaa', reason: '21 characters' } // One short
    ];

    for (const { id, reason } of testCases) {
      await expect(context.playlistService.getPlaylist(id))
        .rejects.toMatchObject({
          code: 'INVALID_ID_FORMAT',
          message: expect.stringContaining('Invalid playlist ID format'),
          statusCode: 400
        })
        .catch(error => {
          throw new Error(`Failed case: ${reason}\n${error}`);
        });
    }
  }, TEST_TIMEOUTS.NORMAL);
});