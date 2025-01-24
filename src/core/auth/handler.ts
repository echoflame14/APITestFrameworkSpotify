// src/core/auth/handler.ts
import axios, { AxiosError } from 'axios';
import { Logger } from '../logging/types';
import { AuthConfig } from './types';
import { AuthToken } from './types';

export class AuthHandler {
    private token: AuthToken | null = null;
    private readonly config: AuthConfig;
    private readonly logger: Logger;

    constructor(config: AuthConfig, logger: Logger) {
        this.config = config;
        this.logger = logger;
        
        this.logger.info('Auth config received:', {
            clientId: config.clientId ? 'present' : 'missing',
            clientSecret: config.clientSecret ? 'present' : 'missing',
            tokenEndpoint: config.tokenEndpoint
        });
        
        // Validate configuration
        this.validateConfig();
    }

    async initialize(): Promise<void> {
        // Fetch initial token
        await this.fetchNewToken();
    }
    
    private validateConfig(): void {
        const { clientId, clientSecret, tokenEndpoint } = this.config;
        
        const missingFields = [];
        if (!clientId) missingFields.push('clientId');
        if (!clientSecret) missingFields.push('clientSecret');
        if (!tokenEndpoint) missingFields.push('tokenEndpoint');
        
        if (missingFields.length > 0) {
            throw new Error(`Invalid auth configuration: missing fields: ${missingFields.join(', ')}`);
        }
    }

    async getAuthHeader(): Promise<Record<string, string>> {
        const token = await this.getValidToken();
        return { Authorization: `Bearer ${token.accessToken}` };
    }

    private async getValidToken(): Promise<AuthToken> {
        if (!this.token || this.isTokenExpired()) {
            this.token = await this.fetchNewToken();
        }
        return this.token;
    }

    private isTokenExpired(): boolean {
        if (!this.token) return true;
        
        // Add 60-second buffer to handle edge cases
        const bufferTime = 60 * 1000;
        return Date.now() + bufferTime >= this.token.expiresAt;
    }

    private async fetchNewToken(): Promise<AuthToken> {
        try {
            this.logger.info('Fetching new Spotify access token');
            
            const params = new URLSearchParams({
                grant_type: 'client_credentials'
            });
            
            const authString = Buffer.from(
                `${this.config.clientId}:${this.config.clientSecret}`
            ).toString('base64');
            
            this.logger.info('Making token request to:', {
                url: this.config.tokenEndpoint,
                grant_type: 'client_credentials'
            });

            const response = await axios.post(
                this.config.tokenEndpoint,
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${authString}`
                    }
                }
            );

            if (!response.data.access_token) {
                throw new Error('No access token in response');
            }

            const { access_token, expires_in } = response.data;
            
            const token: AuthToken = {
                accessToken: access_token,
                expiresAt: Date.now() + (expires_in * 1000)
            };

            this.logger.info('Successfully obtained new access token');
            return token;

        } catch (error) {
            const axiosError = error as AxiosError;
            this.logger.error('Failed to fetch Spotify access token:', {
                status: axiosError.response?.status,
                statusText: axiosError.response?.statusText,
                data: axiosError.response?.data,
                config: {
                    url: axiosError.config?.url,
                    method: axiosError.config?.method,
                    headers: {
                        ...axiosError.config?.headers,
                        Authorization: 'REDACTED'  // Don't log auth header
                    }
                }
            });
            
            throw new Error(
                `Authentication failed: ${axiosError.response?.status} ${axiosError.response?.statusText}`
            );
        }
    }
}