// src/types/spotify/common.ts
export interface ExternalUrls {
    spotify: string;
}

export interface Restrictions {
    reason: 'market' | 'product' | 'explicit';
}

export interface Image {
    url: string;
    height: number;
    width: number;
}
