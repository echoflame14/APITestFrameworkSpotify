// src/__tests__/market.test.ts

/**
 * @module MarketValidationTests
 * @description Comprehensive validation of Spotify API market code handling
 * 
 * ## Key Testing Areas:
 * - ISO 3166-1 alpha-2 market code validation
 * - Geographic restriction enforcement
 * - Error propagation through service layers
 * - HttpClient error transformation behavior
 * 
 * @see {@link HttpClient#validateMarketCode} Underlying market validation
 * @see {@link TrackService#getTrack} Market parameter handling
 * @see {@link SpotifyHttpError} Error formatting standards
 */

import { TestContext, setupTestContext } from './utils/setup';
import { TRACK_IDS, MARKETS, TEST_TIMEOUTS } from './utils/constants';
import dotenv from 'dotenv';

// Load test-specific environment configuration
dotenv.config({ path: '.env.test' });

/**
 * @typedef {Object} MarketTestContext
 * @description Extended test context with market testing utilities
 * @property {TrackService} trackService - Instrumented track service
 * @property {HttpClient} httpClient - Configured HTTP client
 * @property {AuthHandler} authHandler - Active auth management
 * @property {ConsoleLogger} logger - Test-configured logger
 */

/**
 * @function describe
 * @description Validation suite for market code handling in track requests
 * @see {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2} Market code standard
 */
describe('Spotify API Market Code Handling Validation', () => {
    /** @type {MarketTestContext} */
    let context: TestContext;

    /**
     * Initialize full service stack with test configuration
     * @async
     * @function beforeAll
     * @example
     * // Initialization sequence:
     * 1. Load .env.test configuration
     * 2. Validate credentials
     * 3. Establish auth tokens
     * 4. Configure HTTP client
     * 5. Initialize track service
     */
    beforeAll(async () => {
        context = await setupTestContext();
    }, TEST_TIMEOUTS.EXTENDED);

    /**
     * @test {TrackService#getTrack}
     * @description Validates market code validation layer behavior
     * 
     * ## Verification Points:
     * - Rejects invalid market formats
     * - Proper error type propagation
     * - Correct HTTP status code mapping
     * - Error message clarity
     * 
     * @param {string} TRACK_IDS.BOHEMIAN_RHAPSODY Valid track ID
     * @param {string} 'INVALID_MARKET' Malformed market code
     * @throws {SpotifyHttpError} Expected 400 status code
     * @see {@link https://developer.spotify.com/documentation/web-api/concepts/market} Spotify Market Docs
     */
    test('Invalid Market Code Rejection', async () => {
        try {
            await context.trackService.getTrack(
                TRACK_IDS.BOHEMIAN_RHAPSODY,
                'INVALID_MARKET'
            );
            fail('Expected market validation error');
        } catch (error: any) {
            // Validate error formatting
            expect(error.message).toMatch(/invalid market code/i);
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('INVALID_MARKET');
        }
    }, TEST_TIMEOUTS.NORMAL);
});