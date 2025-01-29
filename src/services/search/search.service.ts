// src/services/search/search.service.ts

import { BaseService } from '../../services/base.service';
import { 
  SearchParameters, 
  SearchResponse, 
  SearchRequestParams,
  SearchType,
  SearchFilters
} from '../../types/spotify/search';
import { SpotifyHttpError } from '../../core/http/errors';
import { AxiosRequestConfig } from 'axios';

export class SearchService extends BaseService {
  /**
   * Search for Spotify catalog information about albums, artists, playlists, tracks, shows, episodes or audiobooks
   * @param params Search parameters including query and types to search
   * @throws {SpotifyHttpError} On validation or request errors
   */
  async search(params: SearchParameters): Promise<SearchResponse> {
    this.validateSearchParams(params);
    
    const query = this.buildSearchQuery(params);
    const requestParams: SearchRequestParams = {
      ...params,
      q: query,
      type: params.type.join(',')
    };

    if (params.market) {
      if (!this.isValidMarketCode(params.market)) {
        throw new SpotifyHttpError(`Invalid market code: ${params.market}`);
      }
    }

    const requestConfig: AxiosRequestConfig = {
      params: requestParams
    };

    const response = await this.request<SearchResponse>(
      'get',
      '/search',
      requestConfig
    );

    this.validateSearchResponse(response, params.type);
    return response;
  }

  private buildSearchQuery(params: SearchParameters): string {
    let query = params.q;
    
    if (params.filters) {
      const filterStrings = this.buildFilterStrings(params.filters, params.type);
      if (filterStrings.length > 0) {
        query = `${query} ${filterStrings.join(' ')}`;
      }
    }

    return query.trim();
  }

  private buildFilterStrings(filters: SearchFilters, types: SearchType[]): string[] {
    const filterStrings: string[] = [];

    // Check each filter and add if valid for the search types
    Object.entries(filters).forEach(([key, value]) => {
      if (value && this.isValidFilterForTypes(key as keyof SearchFilters, types)) {
        // Handle special tag filters
        if (key === 'tag' && (value === 'hipster' || value === 'new')) {
          filterStrings.push(`tag:${value}`);
        } else {
          filterStrings.push(`${key}:${value}`);
        }
      }
    });

    return filterStrings;
  }

  private isValidFilterForTypes(filter: keyof SearchFilters, types: SearchType[]): boolean {
    const filterTypeMap: Record<keyof SearchFilters, SearchType[]> = {
      artist: ['album', 'artist', 'track'],
      year: ['album', 'artist', 'track'],
      album: ['album', 'track'],
      genre: ['artist', 'track'],
      track: ['track'],
      isrc: ['track'],
      upc: ['album'],
      tag: ['album']
    };

    const allowedTypes = filterTypeMap[filter];
    return allowedTypes ? types.some(type => allowedTypes.includes(type)) : false;
  }

  private validateSearchParams(params: SearchParameters): void {
    // Validate query
    if (!params.q?.trim()) {
      throw new SpotifyHttpError('Search query cannot be empty');
    }

    // Validate types
    if (!params.type?.length) {
      throw new SpotifyHttpError('At least one search type must be specified');
    }

    // Validate limit
    if (params.limit !== undefined && (params.limit < 0 || params.limit > 50)) {
      throw new SpotifyHttpError('Limit must be between 0 and 50');
    }

    // Validate offset
    if (params.offset !== undefined && (params.offset < 0 || params.offset > 1000)) {
      throw new SpotifyHttpError('Offset must be between 0 and 1000');
    }

    // Validate search types
    const validTypes: SearchType[] = ['album', 'artist', 'playlist', 'track', 'show', 'episode', 'audiobook'];
    const invalidTypes = params.type.filter(type => !validTypes.includes(type));
    if (invalidTypes.length) {
      throw new SpotifyHttpError(`Invalid search type(s): ${invalidTypes.join(', ')}`);
    }

    // Validate filters if present
    if (params.filters) {
      this.validateFilters(params.filters, params.type);
    }
  }

  private validateFilters(filters: SearchFilters, types: SearchType[]): void {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !this.isValidFilterForTypes(key as keyof SearchFilters, types)) {
        throw new SpotifyHttpError(
          `Filter '${key}' cannot be used with the specified search types: ${types.join(', ')}`
        );
      }
    });

    // Validate tag values if present
    if (filters.tag && !['hipster', 'new'].includes(filters.tag)) {
      throw new SpotifyHttpError('Tag filter must be either "hipster" or "new"');
    }
  }

  private validateSearchResponse(response: SearchResponse, types: SearchType[]): void {
    for (const type of types) {
      const key = `${type}s` as keyof SearchResponse;
      const results = response[key];
      
      if (!results) {
        throw new SpotifyHttpError(`Missing ${type}s results in response`);
      }
  
      // Validate pagination fields without passing type
      this.validateRequiredFields(
        results,
        ['href', 'items', 'limit', 'offset', 'total'],
        'search' // Use 'search' as a generic resource type for pagination
      );
  
      // Validate common fields for each item without passing type
      for (const item of results.items) {
        this.validateRequiredFields(
          item,
          ['id', 'name', 'uri', 'type'],
          'search' // Use 'search' as a generic resource type for items
        );
      }
    }
  }
}