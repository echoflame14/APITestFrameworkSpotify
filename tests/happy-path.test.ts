import { Track } from '@/types/spotify/track';
import { ConsoleLogger } from '@/core/logging/console-logger';
import { SpotifyHttpError } from '@/core/http/errors';
import { TestContext, setupTestContext } from '@/__tests__/utils/setup';
import { TRACK_IDS, TEST_TIMEOUTS } from '@/__tests__/utils/constants';

describe('Track Service - Happy Path', () => {
    let context: TestContext;

    beforeAll(async () => {
        context = await setupTestContext();
    }, 30000); // Increased timeout for initial setup

    test('should fetch Bohemian Rhapsody track details', async () => {
        const track = await context.trackService.getTrack(TRACK_IDS.BOHEMIAN_RHAPSODY);
        
        // Basic track verification
        expect(track.id).toBe(TRACK_IDS.BOHEMIAN_RHAPSODY);
        expect(track.type).toBe('track');
        
        // Artist verification (more flexible assertion)
        expect(track.artists).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Queen'
                })
            ])
        );
    }, 10000);

    test('should fetch track with market parameter', async () => {
        const track = await context.trackService.getTrack(TRACK_IDS.BOHEMIAN_RHAPSODY, 'US');
        
        expect(track.id).toBe(TRACK_IDS.BOHEMIAN_RHAPSODY);
        expect(track.type).toBe('track');
        
        // Market availability check
        if (track.available_markets) {
            expect(track.available_markets).toContain('US');
        }
    }, 10000);

    test('should return track metadata fields', async () => {
        const track = await context.trackService.getTrack(TRACK_IDS.BOHEMIAN_RHAPSODY);
        
        // Verify required fields are present
        expect(track).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                type: 'track',
                uri: expect.stringContaining('spotify:track:'),
                duration_ms: expect.any(Number),
                explicit: expect.any(Boolean)
            })
        );
    }, 10000);
});