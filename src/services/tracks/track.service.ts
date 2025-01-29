import { BaseService, ServiceDependencies } from '../base.service';
import { Track, TrackRequestParams } from '../../types/spotify/track';
import { SpotifyHttpError } from '../../core/http/errors';
import { ERROR_CODES } from '../../core/http/errors/types';
import { ResourceType, ServiceErrorHandler } from '../error-handler';

/**
 * Service for interacting with Spotify's Track API endpoints
 * @class TrackService
 * @extends BaseService
 */
export class TrackService extends BaseService {
    constructor(dependencies: ServiceDependencies) {
        super(dependencies);
    }

    protected getResourceType(): ResourceType {
        return 'track';
    }

    /**
     * Fetches detailed track information from Spotify
     * @param id - The Spotify track ID
     * @param market - Optional ISO 3166-1 alpha-2 country code
     * @throws {SpotifyHttpError} When the API request fails
     * @returns {Promise<Track>} The track details
     */
    async getTrack(id: string, market?: string): Promise<Track> {
        try {
            // Validate and prepare request parameters
            const params = await this.prepareRequestParams(market);

            // Make the API request
            const track = await this.request<Track>('get', `/tracks/${id}`, {
                params,
                validateStatus: status => status === 200 || status === 404
            });

            // Validate the response
            return this.validateTrackResponse(track);
        } catch (error) {
            throw ServiceErrorHandler.handleError(error as SpotifyHttpError, 
                this.createErrorContext(id, market ? { market } : undefined)
            );
        }
    }

    /**
     * Validates the track response and ensures all required fields are present
     * @private
     */
    private validateTrackResponse(track: Track): Track {
        // Use base class method for common field validation
        this.validateRequiredFields(track, ['id', 'name', 'type', 'uri']);

        // Track-specific validation
        if (!['track', 'episode'].includes(track.type)) {
            throw new SpotifyHttpError(
                `Invalid response: expected track type, got ${track.type}`,
                500,
                'INVALID_RESPONSE'
            );
        }

        return track;
    }

    /**
     * Prepares and validates request parameters
     * @private
     */
    private async prepareRequestParams(market?: string): Promise<TrackRequestParams> {
        const params: TrackRequestParams = {};
    
        if (market) {
            if (!this.validateMarketCode(market)) {
                throw new SpotifyHttpError(
                    'Invalid market code provided',
                    400,
                    ERROR_CODES.INVALID_MARKET,
                    { market }
                );
            }
            return { ...params, market };
        }
    
        return params;
    }
}