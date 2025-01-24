import { BaseService, ServiceDependencies } from '../base.service';
import { Track, TrackRequestParams } from '../../types/spotify/track';
import { SpotifyHttpError } from '../../core/http/errors'; // Fixed import path

export class TrackService extends BaseService {
    constructor(dependencies: ServiceDependencies) {
        super(dependencies);
    }

    /**
     * Fetches detailed track information from Spotify
     * @param id - The Spotify track ID
     * @param market - Optional ISO 3166-1 alpha-2 country code
     * @throws {SpotifyHttpError} When the API request fails
     */
    async getTrack(id: string, market?: string): Promise<Track> {
        try {
            const params: TrackRequestParams = {};
            if (market) {
                if (!this.isValidMarketCode(market)) {
                    throw new SpotifyHttpError(
                        'Invalid market code provided',
                        400,
                        'INVALID_MARKET'
                    );
                }
                params.market = market;
            }

            const track = await this.request<Track>('get', `/tracks/${id}`, {
                params,
                validateStatus: (status: number) => {
                    return status === 200 || status === 404;
                }
            });

            return this.validateTrackResponse(track);
        } catch (error) {
            throw this.handleTrackError(error as SpotifyHttpError, id);
        }
    }

    private isValidMarketCode(market: string): boolean {
        // Use official ISO 3166-1 alpha-2 regex
        return /^[A-Z]{2}$/.test(market) && 
               Intl.getCanonicalLocales(market).length > 0;
    }


    private validateTrackResponse(track: Track): Track {
        const requiredFields = ['id', 'name', 'type', 'uri'] as const;
        for (const field of requiredFields) {
            if (!track[field]) {
                throw new SpotifyHttpError(
                    `Invalid track response: missing ${field}`,
                    500,
                    'INVALID_RESPONSE'
                );
            }
        }

        if (!['track', 'episode'].includes(track.type)) {
            throw new SpotifyHttpError(
                'Invalid response: not a track',
                500,
                'INVALID_RESPONSE'
            );
        }

        return track;
    }

    private handleTrackError(error: SpotifyHttpError, trackId: string): never {
        // Change all error.status to error.statusCode
        switch (error.statusCode) {  // ← Updated here
            case 404:
                throw new SpotifyHttpError(
                    `Track not found: ${trackId}`,
                    404,  // This maps to statusCode
                    'TRACK_NOT_FOUND'
                );
            case 400:
                if (error.message.includes('market')) {
                    throw new SpotifyHttpError(
                        'Invalid market code provided',
                        400,  // statusCode
                        'INVALID_MARKET'
                    );
                }
                throw error;
            case 429:
                throw new SpotifyHttpError(
                    'Rate limit exceeded. Please try again later.',
                    429,  // statusCode
                    'RATE_LIMIT_EXCEEDED'
                );
            default:
                throw error;
        }
    }
}