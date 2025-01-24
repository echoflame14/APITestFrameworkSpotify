// src/__tests__/error.test.ts
import { TestContext, setupTestContext } from './utils/setup';
import { TRACK_IDS, TEST_TIMEOUTS } from './utils/constants';
import dotenv from 'dotenv';

dotenv.config();

describe('Track Service - Error Handling', () => {
    let context: TestContext;

    beforeAll(async () => {
        context = await setupTestContext();
    }, TEST_TIMEOUTS.EXTENDED);

    test('should handle non-existent track IDs', async () => {
        try {
            await context.trackService.getTrack(TRACK_IDS.NON_EXISTENT);
            fail('Should have thrown an error for non-existent track');
        } catch (error: any) {
            expect(error.message).toMatch(/404|invalid|not found/i);
        }
    }, TEST_TIMEOUTS.NORMAL);

    test('should handle rate limiting gracefully', async () => {
        const requests = Array(50).fill(null).map(() => 
            context.trackService.getTrack(TRACK_IDS.BOHEMIAN_RHAPSODY)
        );

        try {
            await Promise.all(requests);
            // If no rate limit hit, test passes
        } catch (error: any) {
            // If rate limited, verify error
            if (error.message.match(/429|rate limit|too many request/i)) {
                // Expected rate limit error
                return;
            }
            throw error; // Re-throw if it's a different error
        }
    }, TEST_TIMEOUTS.EXTENDED);

    test('should handle network errors', async () => {
        // Store original URL
        const originalUrl = context.httpClient['client'].defaults.baseURL;
        
        try {
            // Set invalid URL
            context.httpClient['client'].defaults.baseURL = 'https://invalid-spotify-api.example';
            
            await context.trackService.getTrack(TRACK_IDS.BOHEMIAN_RHAPSODY);
            fail('Should have thrown a network error');
        } catch (error: any) {
            expect(error.message).toMatch(/network|ENOTFOUND|ECONNREFUSED|getaddrinfo/i);
        } finally {
            // Restore original URL
            context.httpClient['client'].defaults.baseURL = originalUrl;
        }
    }, TEST_TIMEOUTS.NETWORK);

    afterEach(async () => {
        // Add delay between tests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
});