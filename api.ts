/**
 * Builds a video source URL for the iframe player using the Embed API service.
 * @param mediaType 'tv' or 'movie'.
 * @param tmdbId The TMDB ID.
 * @param season The season number (for TV shows).
 * @param episode The episode number (for TV shows).
 * @returns The full source URL for the iframe.
 */
export const buildSourceUrl = (
    mediaType: 'tv' | 'movie' | null,
    tmdbId: number | null,
    season?: number,
    episode?: number,
): string | null => {
    if (!mediaType || !tmdbId) return null;

    const baseUrl = `https://player.embed-api.stream/?id=${tmdbId}`;

    if (mediaType === 'movie') {
        return baseUrl;
    }

    if (mediaType === 'tv' && season && episode) {
        return `${baseUrl}&s=${season}&e=${episode}`;
    }
    
    // For a TV show, if season/episode is not provided, we can't build a valid URL.
    return null;
};
