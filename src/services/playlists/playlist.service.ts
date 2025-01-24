import { BaseService, ServiceDependencies } from '../base.service';
import { 
  Playlist,
  PlaylistRequestParams,
  PagedPlaylists,
  UserPlaylistsParams
} from '../../types/spotify/playlist';
import { 
  SpotifyHttpError,
  SpotifyRateLimitError
} from '../../core/http/errors';

/**
 * Service for interacting with Spotify's Playlist API endpoints.
 * Handles playlist retrieval, validation, and error management.
 * 
 * @extends BaseService
 */
export class PlaylistService extends BaseService {
    constructor(dependencies: ServiceDependencies) {
        super(dependencies);
    }

    /**
     * Get playlists owned or followed by a Spotify user
     * @param userId - The user's Spotify user ID
     * @param params - Pagination parameters
     */
    async getUserPlaylists(
        userId: string,
        params?: UserPlaylistsParams
    ): Promise<PagedPlaylists> {
        try {
            const validatedParams = this.validateUserPlaylistParams(params);
            
            const response = await this.request<PagedPlaylists>(
                'get',
                `/users/${encodeURIComponent(userId)}/playlists`,
                { params: validatedParams }
            );

            return this.validatePagedResponse(response);
        } catch (error) {
            throw this.handleUserPlaylistError(error as SpotifyHttpError, userId);
        }
    }

    /**
     * Fetches detailed playlist information from Spotify's API.
     * 
     * @param {string} id - The Spotify playlist ID
     * @param {PlaylistRequestParams} [params] - Optional request parameters
     * @returns {Promise<Playlist>} The playlist details
     * @throws {SpotifyHttpError} 
     *         - With code 'INVALID_ID_FORMAT' if ID format is invalid
     *         - With code 'PLAYLIST_NOT_FOUND' if playlist doesn't exist
     *         - With code 'INVALID_MARKET' if market code is invalid
     */
    async getPlaylist(id: string, params?: PlaylistRequestParams): Promise<Playlist> {
        if (!this.isValidPlaylistId(id)) {
            throw new SpotifyHttpError(
              `INVALID_ID_FORMAT: Invalid playlist ID format: ${id}`,
              400,
              'INVALID_ID_FORMAT',
              {
                  contextData: {
                      resourceType: 'playlist',
                      resourceId: id
                  }
              }
          );
        }

        try {
            const validatedParams = this.validateParams(params);
            
            const response = await this.request<Playlist>('get', `/playlists/${id}`, {
                params: validatedParams,
                validateStatus: (status: number) => status === 200 || status === 404
            });

            // Handle 404 response explicitly
            if (!response || !response.id) {
                throw new SpotifyHttpError(
                    `Playlist not found: ${id}`,
                    404,
                    'PLAYLIST_NOT_FOUND',
                    {
                        contextData: {
                            resourceType: 'playlist',
                            resourceId: id
                        }
                    }
                );
            }

            return this.validatePlaylistResponse(response);
        } catch (error) {
            throw this.handlePlaylistError(error as SpotifyHttpError, id);
        }
    }

    private validateUserPlaylistParams(params?: UserPlaylistsParams): UserPlaylistsParams {
        const validated = params ? { ...params } : {};
        
        if (validated.limit && (validated.limit < 1 || validated.limit > 50)) {
            throw new SpotifyHttpError(
                'Limit must be between 1 and 50',
                400,
                'INVALID_PARAM',
                { contextData: { param: 'limit', value: validated.limit } }
            );
        }

        if (validated.offset && validated.offset < 0) {
            throw new SpotifyHttpError(
                'Offset cannot be negative',
                400,
                'INVALID_PARAM',
                { contextData: { param: 'offset', value: validated.offset } }
            );
        }

        return validated;
    }

    private validateParams(params?: PlaylistRequestParams): PlaylistRequestParams {
        const validated: PlaylistRequestParams = { ...params };

        if (validated.market && !this.isValidMarketCode(validated.market)) {
            throw new SpotifyHttpError(
                'Invalid market code provided',
                400,
                'INVALID_MARKET',
                {
                    contextData: {
                        resourceType: 'playlist',
                        requestParams: { market: validated.market }
                    }
                }
            );
        }

        if (validated.additional_types) {
            const types = validated.additional_types.split(',');
            if (!types.every(t => ['track', 'episode'].includes(t))) {
                throw new SpotifyHttpError(
                    'Invalid additional types parameter',
                    400,
                    'INVALID_PARAM',
                    {
                        contextData: {
                            resourceType: 'playlist',
                            requestParams: { types }
                        }
                    }
                );
            }
        }

        return validated;
    }

    private validatePagedResponse(response: PagedPlaylists): PagedPlaylists {
        const requiredFields: (keyof PagedPlaylists)[] = ['items', 'limit', 'offset', 'total'];
        this.validateRequiredFields(response, requiredFields, 'paged-playlists');
        response.items.forEach(item => {
            if (item.type !== 'playlist') {
                throw new SpotifyHttpError(
                    'Invalid item type in paged response',
                    500,
                    'INVALID_RESPONSE',
                    { contextData: { receivedType: item.type } }
                );
            }
            this.validatePlaylistResponse(item);
        });

        return response;
    }

    private handleUserPlaylistError(error: SpotifyHttpError, userId: string): never {
        if (error.statusCode === 403) {
            throw new SpotifyHttpError(
                `Access denied to user's playlists: ${userId}`,
                403,
                'ACCESS_DENIED',
                {
                    contextData: {
                        resourceType: 'user-playlists',
                        userId,
                        requiredScopes: ['playlist-read-private', 'playlist-read-collaborative']
                    }
                }
            );
        }

        return this.handlePlaylistError(error, `user:${userId}`);
    }

    private hasNestedProperty(obj: Playlist, path: string): boolean {
        const parts = path.split('.');
        let current: any = obj;
    
        for (const part of parts) {
            if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, part)) {
                return false;
            }
            current = current[part];
        }
    
        return true;
    }
    
    private getMissingFields(playlist: Playlist | null): string[] {
        if (!playlist) return ['id', 'tracks.href'];
        
        const requiredFields = ['id', 'tracks.href'];
        return requiredFields.filter(field => !this.hasNestedProperty(playlist, field));
    }

    private validatePlaylistResponse(playlist: Playlist): Playlist {
        if (playlist.type !== 'playlist') {
            throw new SpotifyHttpError(
                'Unexpected response type - expected playlist',
                500,
                'INVALID_RESPONSE_TYPE',
                {
                    contextData: {
                        expectedType: 'playlist',
                        receivedType: playlist.type
                    }
                }
            );
        }

        const missingFields = this.getMissingFields(playlist);
        if (missingFields.length > 0) {
            throw new SpotifyHttpError(
                `Invalid playlist response: missing ${missingFields.join(', ')}`,
                500,
                'INVALID_RESPONSE',
                {
                    contextData: {
                        missingFields,
                        receivedData: playlist
                    }
                }
            );
        }

        return playlist;
    }

    private handlePlaylistError(error: SpotifyHttpError, playlistId: string): never {
        if (error instanceof SpotifyRateLimitError) {
            throw new SpotifyRateLimitError(
                error.message,
                error.getRetryAfter(),
                {
                    ...error.data,
                    contextData: {
                        resourceType: 'playlist',
                        resourceId: playlistId
                    }
                }
            );
        }

        if (error.statusCode === 404) {
            throw new SpotifyHttpError(
                `PLAYLIST_NOT_FOUND: Playlist not found: ${playlistId}`,
                404,
                'PLAYLIST_NOT_FOUND',
                {
                    contextData: {
                        resourceType: 'playlist',
                        resourceId: playlistId
                    }
                }
            );
        }

        if (error.code === 'INVALID_RESPONSE') {
            throw new SpotifyHttpError(
                `Invalid playlist response: ${error.message}`,
                500,
                'INVALID_RESPONSE',
                {
                    contextData: {
                        resourceType: 'playlist',
                        validationErrors: {
                            missingFields: error.data?.contextData?.validationErrors?.missingFields,
                            invalidTypes: error.data?.contextData?.validationErrors?.invalidTypes,
                            expectedType: error.data?.contextData?.validationErrors?.expectedType,
                            receivedType: error.data?.contextData?.validationErrors?.receivedType
                        }
                    }
                }
            );
        }

        throw new SpotifyHttpError(
            `Playlist request failed: ${error.message}`,
            error.statusCode || 500,
            error.code || 'UNKNOWN_ERROR',
            {
                contextData: {
                    resourceType: 'playlist',
                    resourceId: playlistId,
                    originalStatus: error.statusCode
                }
            }
        );
    }

    private isValidPlaylistId(id: string): boolean {
        return /^[a-zA-Z0-9]{22}$/.test(id);
    }
}