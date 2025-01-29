import { BaseService, ServiceDependencies } from '../base.service';
import { ERROR_CODES, ErrorCode, ValidationErrors } from '../../core/http/errors/types';
import { 
    Playlist,
    PlaylistRequestParams,
    PagedPlaylists,
    UserPlaylistsParams
} from '../../types/spotify/playlist';
import { SpotifyHttpError } from '../../core/http/errors';
import { ResourceType, ServiceErrorContext } from '../error-handler';

export class PlaylistService extends BaseService {
    protected getResourceType(): ResourceType {
        return 'playlist';
    }

    async getUserPlaylists(userId: string, params?: UserPlaylistsParams): Promise<PagedPlaylists> {
        const validated = this.validatePaginationParams(params);
        const response = await this.request<PagedPlaylists>(
            'get',
            `/users/${encodeURIComponent(userId)}/playlists`,
            { params: validated }
        );
        
        return this.validatePagedResponse(response);
    }

    async getPlaylist(id: string, params?: PlaylistRequestParams): Promise<Playlist> {
        if (!/^[a-zA-Z0-9]{22}$/.test(id)) {
            throw this.createError(ERROR_CODES.INVALID_ID as ErrorCode, `Invalid playlist ID: ${id}`, id);
        }

        const validated = this.validateRequestParams(params);
        const response = await this.request<Playlist>('get', `/playlists/${id}`, {
            params: validated
        });

        if (!response?.id) {
            throw this.createError(ERROR_CODES.NOT_FOUND as ErrorCode, `Playlist not found: ${id}`, id);
        }

        return this.validatePlaylistResponse(response);
    }

    private validatePaginationParams(params?: UserPlaylistsParams): UserPlaylistsParams {
        const validated = { ...params };
        
        if (validated.limit && (validated.limit < 1 || validated.limit > 50)) {
            throw this.createError(ERROR_CODES.VALIDATION as ErrorCode, 'Limit must be between 1 and 50');
        }
        if (validated.offset && validated.offset < 0) {
            throw this.createError(ERROR_CODES.VALIDATION as ErrorCode, 'Offset cannot be negative');
        }

        return validated;
    }

    private validateRequestParams(params?: PlaylistRequestParams): PlaylistRequestParams {
        const validated = { ...params };

        if (validated.market && !this.validateMarketCode(validated.market)) {
            throw this.createError(ERROR_CODES.INVALID_MARKET as ErrorCode, 'Invalid market code provided');
        }

        if (validated.additional_types) {
            const types = validated.additional_types.split(',');
            if (!types.every(t => ['track', 'episode'].includes(t))) {
                throw this.createError(ERROR_CODES.VALIDATION as ErrorCode, 'Invalid additional types');
            }
        }

        return validated;
    }

    private validatePagedResponse(response: PagedPlaylists): PagedPlaylists {
        const requiredFields: Array<keyof PagedPlaylists> = ['items', 'limit', 'offset', 'total'];
        this.validateRequiredFields(response, requiredFields);
        
        response.items.forEach(item => {
            if (item.type !== 'playlist') {
                throw this.createError(
                    ERROR_CODES.INVALID_RESPONSE as ErrorCode,
                    `Invalid type: expected playlist, got ${item.type}`
                );
            }
        });

        return response;
    }

    private validatePlaylistResponse(playlist: Playlist): Playlist {
        const requiredFields: Array<keyof Playlist> = ['id', 'type', 'tracks'];
        this.validateRequiredFields(playlist, requiredFields);

        if (playlist.type !== 'playlist') {
            throw this.createError(
                ERROR_CODES.INVALID_RESPONSE as ErrorCode,
                `Invalid type: expected playlist, got ${playlist.type}`
            );
        }

        return playlist;
    }

    private createError(code: ErrorCode, message: string, resourceId?: string): SpotifyHttpError {
        const context: ServiceErrorContext = {
            resourceType: this.getResourceType(),
            resourceId,
            timestamp: new Date().toISOString()
        };

        return new SpotifyHttpError(message, 400, code, { contextData: context });
    }
}