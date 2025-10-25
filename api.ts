import type { VideoServer } from './types';

/**
 * Builds a video source URL based on the selected server.
 * @param server The selected video server ID.
 * @param mediaType 'tv' or 'movie'.
 * @param tmdbId The TMDB ID.
 * @param season The season number (for TV shows).
 * @param episode The episode number (for TV shows).
 * @returns The full source URL for the iframe.
 */
export const buildSourceUrl = (
    server: VideoServer,
    mediaType: 'tv' | 'movie' | null,
    tmdbId: number | null,
    season?: number,
    episode?: number,
    vidsrcDomain?: string,
    autoplay?: boolean,
    subtitleLanguage?: string,
): string | null => {
    if (!mediaType || !tmdbId) return null;

    switch (server) {
        case 'embed-api': { // Server 1
            const url = new URL('https://player.embed-api.stream/');
            url.searchParams.set('id', tmdbId.toString());
            if (mediaType === 'tv') {
                if (season === undefined || episode === undefined) return null;
                url.searchParams.set('s', season.toString());
                url.searchParams.set('e', episode.toString());
            }
            return url.toString();
        }
        case 'vidsrc': { // Server 2 - Vidsrc (Path-based format)
            const domain = vidsrcDomain || 'vsrc.su';
            let baseUrl = '';
            if (mediaType === 'movie') {
                baseUrl = `https://${domain}/embed/movie/${tmdbId}`;
            } else if (mediaType === 'tv') {
                if (season === undefined || episode === undefined) return null;
                baseUrl = `https://${domain}/embed/tv/${tmdbId}/${season}-${episode}`;
            } else {
                return null;
            }

            const params = new URLSearchParams();
            if (autoplay) {
                params.set('autoplay', '1');
                if (mediaType === 'tv') {
                    params.set('autonext', '1');
                }
            }
            if (subtitleLanguage) {
                params.set('ds_lang', subtitleLanguage);
            }
            
            const queryString = params.toString();
            return queryString ? `${baseUrl}?${queryString}` : baseUrl;
        }
        case 'vidsrc-pk': { // Server 3 - VidSrc PK
            if (mediaType === 'movie') {
                return `https://embed.vidsrc.pk/movie/${tmdbId}`;
            }
            if (mediaType === 'tv') {
                if (season === undefined || episode === undefined) return null;
                return `https://embed.vidsrc.pk/tv/${tmdbId}/${season}-${episode}`;
            }
            return null;
        }
        default: {
             // Fallback to the first server if something is wrong
            const url = new URL('https://player.embed-api.stream/');
            url.searchParams.set('id', tmdbId.toString());
             if (mediaType === 'tv') {
                if (season === undefined || episode === undefined) return null;
                url.searchParams.set('s', season.toString());
                url.searchParams.set('e', episode.toString());
            }
            return url.toString();
        }
    }
};