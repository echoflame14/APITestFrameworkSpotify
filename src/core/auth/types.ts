export interface AuthConfig {
    clientId: string;
    clientSecret: string;
    tokenEndpoint: string;
  }
  
export interface AuthToken {
    accessToken: string;
    expiresAt: number;
}