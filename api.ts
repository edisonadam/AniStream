import type { Anime, Character, VoiceActor, VideoServer, NewsPromo, Manga, WatchlistStatus } from './types';

/**
 * A wrapper for the fetch API that includes automatic retries on rate limiting (429) or network errors.
 * @param url The URL to fetch.
 * @param retries The number of times to retry on failure.
 * @param delay The base delay in milliseconds between retries.
 * @returns A promise that resolves to the Response object.
 */
export const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url);
            // If we get a 429 (Too Many Requests) and we have retries left, wait and try again.
            if (response.status === 429 && i < retries) {
                const retryAfterHeader = response.headers.get('Retry-After');
                // The header can be in seconds. Default to exponential backoff.
                const waitTime = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : delay * (i + 1); 
                
                console.warn(`Rate limit hit for ${url}. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            // If the response is anything else (ok or another error), return it immediately.
            return response;
        } catch (error) {
            // This catches network errors (e.g., offline).
            if (i < retries) {
                const waitTime = delay * (i + 1); // Exponential backoff for network errors
                console.warn(`Network error for ${url}. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            // If this was the last retry, throw the error.
            throw error;
        }
    }
    // This should theoretically not be reached, but it's a safeguard.
    throw new Error(`Fetch failed for ${url} after multiple retries.`);
};

const CONSUMET_API = 'https://api.consumet.org';

// Helper to get consumet ID for an anime, with caching
const getConsumetId = async (animeTitle: string, provider: 'gogoanime' | 'zoro' | 'animepahe' = 'zoro'): Promise<string | null> => {
    const cacheKey = `consumet-id-${provider}-${animeTitle.toLowerCase()}`;
    const cachedId = sessionStorage.getItem(cacheKey);
    if (cachedId) return cachedId;

    try {
        // Search for the anime on the specified provider
        const searchRes = await fetchWithRetry(`${CONSUMET_API}/anime/${provider}/${encodeURIComponent(animeTitle)}`);
        if (!searchRes.ok) return null;
        const searchData = await searchRes.json();
        
        // Try to find an exact match first
        const exactMatch = searchData.results?.find((item: any) => item.title.toLowerCase() === animeTitle.toLowerCase());
        const bestMatch = exactMatch || searchData.results?.[0];
        
        if (bestMatch?.id) {
            sessionStorage.setItem(cacheKey, bestMatch.id);
            return bestMatch.id;
        }
        return null;
    } catch (error) {
        console.error(`Consumet search with provider '${provider}' failed:`, error);
        return null;
    }
};

/**
 * Fetches a direct streaming URL from the Consumet API for a given anime and episode.
 * This function handles searching for the anime, finding the correct episode, and extracting a playable source URL.
 * It includes caching to improve performance for repeated requests.
 * @param animeTitle The title of the anime to search for.
 * @param episodeNumber The absolute episode number to fetch.
 * @param provider The Consumet provider to use (e.g., 'gogoanime').
 * @returns A promise that resolves to the direct, playable video URL.
 */
export const fetchConsumetStreamUrl = async (
    animeTitle: string,
    episodeNumber: number,
    provider: 'gogoanime' | 'zoro' | 'animepahe' = 'zoro'
): Promise<string> => {
    const consumetApi = 'https://api.consumet.org';
    const animeIdCacheKey = `consumet-id-${provider}-${animeTitle.toLowerCase()}`;
    const episodeListCacheKey = (animeId: string) => `consumet-episodes-${provider}-${animeId}`;

    try {
        // Step 1: Get anime ID from Consumet, use cache if available.
        let animeId = sessionStorage.getItem(animeIdCacheKey);
        if (!animeId) {
            const searchRes = await fetchWithRetry(`${consumetApi}/anime/${provider}/${encodeURIComponent(animeTitle)}`);
            if (!searchRes.ok) throw new Error(`Could not find anime on ${provider}.`);
            const searchData = await searchRes.json();
            const animeInfo = searchData.results?.find((item: any) => 
                item.title.toLowerCase() === animeTitle.toLowerCase()
            ) || searchData.results?.[0];
            if (!animeInfo?.id) throw new Error(`No results for "${animeTitle}" on ${provider}.`);
            animeId = animeInfo.id;
            sessionStorage.setItem(animeIdCacheKey, animeId);
        }

        // Step 2: Get episode list for the anime, use cache if available.
        let episodes: any[] = [];
        const cachedEpisodes = sessionStorage.getItem(episodeListCacheKey(animeId));
        if (cachedEpisodes) {
            episodes = JSON.parse(cachedEpisodes);
        } else {
            const infoRes = await fetchWithRetry(`${consumetApi}/anime/${provider}/info/${animeId}`);
            if (!infoRes.ok) throw new Error('Could not fetch anime episode details.');
            const infoData = await infoRes.json();
            episodes = infoData.episodes || [];
            if (episodes.length > 0) {
                sessionStorage.setItem(episodeListCacheKey(animeId), JSON.stringify(episodes));
            }
        }
        
        const targetEpisode = episodes.find(ep => ep.number === episodeNumber);
        if (!targetEpisode?.id) {
            throw new Error(`Episode ${episodeNumber} not found for this series.`);
        }
        const episodeId = targetEpisode.id;

        // Step 3: Get streaming sources for the episode.
        const streamRes = await fetchWithRetry(`${consumetApi}/anime/${provider}/watch/${episodeId}`);
        if (!streamRes.ok) throw new Error('Could not fetch streaming sources.');
        const streamData = await streamRes.json();

        // Step 4: Find the best quality source URL.
        const source = streamData.sources?.find((s: any) => s.quality === 'default' || s.quality === 'auto') || streamData.sources?.[streamData.sources.length - 1];
        if (!source?.url) {
            throw new Error('No playable video source was found from the provider.');
        }

        return source.url;

    } catch (error) {
        console.error(`[Consumet Stream Fetch Error] Provider: ${provider}, Anime: ${animeTitle}, Ep: ${episodeNumber}`, error);
        // Re-throw the error so it can be caught and displayed in the UI.
        throw error;
    }
};


/**
 * Builds a video source URL. For embed servers, this now simulates fetching a direct
 * playable link (e.g., .m3u8) to be used with Artplayer, replacing the old iframe logic.
 * @param server The selected video server ID.
 * @param mediaType 'tv' or 'movie'.
 * @param tmdbId The TMDB ID.
 * @param season The season number (for TV shows).
 * @param episode The episode number (for TV shows).
 * @returns The full source URL for the video file.
 */
export const buildSourceUrl = (
    server: VideoServer,
    mediaType: 'tv' | 'movie' | null,
    tmdbId: number | null,
    season?: number,
    episode?: number,
    autoplayNext?: boolean
): string | null => {
    if (!mediaType || !tmdbId) return null;

    // Per instructions, simulate fetching a direct URL for embed servers to use with Artplayer.
    // In a real application, this part would involve scraping the source iframe.
    // Here, we return a sample HLS stream for demonstration. This replaces the old iframe logic.
    console.log(`[Embed Simulation] Detected server ${server}, providing direct link for Player.`);
    return 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
};

/**
 * Maps a raw item from the Jikan API to the application's Anime type.
 * @param item The raw item from the Jikan API response.
 * @returns An Anime object or null if the item is invalid.
 */
export const mapJikanToAnime = (item: any): Anime | null => {
    if (!item || !item.mal_id) {
        return null;
    }

    let totalMinutes = 0;
    const hourMatch = item.duration?.match(/(\d+)\s*hr/);
    const minMatch = item.duration?.match(/(\d+)\s*min/);
    if (hourMatch?.[1]) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch?.[1]) totalMinutes += parseInt(minMatch[1], 10);
    
    let avgEpisodeDuration: number | null = null;
    if (item.duration && item.duration.includes('per ep')) {
        const epMinMatch = item.duration.match(/(\d+)\s*min/);
        if (epMinMatch && epMinMatch[1]) {
            avgEpisodeDuration = parseInt(epMinMatch[1], 10);
        }
    }
    
    const ratingString = item.rating || '';
    const hasAdultRating = ratingString.includes('Rx - Hentai');
    const hasExplicitGenre = (item.explicit_genres || []).some((g: any) => ['Hentai', 'Erotica'].includes(g.name));
    
    // An anime is adult if sfw is false, or it has an adult rating, or an explicit genre.
    const isAdult = item.sfw === false || hasAdultRating || hasExplicitGenre;
    
    const themes = (item.themes || []).map((t: any) => t.name);
    const demographics = (item.demographics || []).map((d: any) => d.name);

    let seasons_count: number | null = null;
    const combinedTitle = `${item.title || ''} ${item.title_english || ''}`;

    const seasonMatch = combinedTitle.match(/(?:season|saison|temporada)\s*(\d+)/i) ||
                        combinedTitle.match(/(\d+)(?:st|nd|rd|th)\s*(?:season|saison|temporada)/i);
    
    if (seasonMatch && seasonMatch[1]) {
        seasons_count = parseInt(seasonMatch[1], 10);
    } else if (item.type === 'TV' && item.episodes && item.episodes > 1) {
        // Simple heuristic: If it's a TV series with multiple episodes and no explicit
        // season number in the title, assume it's Season 1. This won't be perfect
        // for sequels without "Season" in the title, but it's a good baseline.
        seasons_count = 1;
    }

    return {
        id: item.mal_id,
        title: item.title_english || item.title || 'Untitled',
        title_english: item.title_english || null,
        title_japanese: item.title_japanese || '',
        thumbnail: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        bannerImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        synopsis: item.synopsis || 'No synopsis available.',
        genres: (item.genres || []).map((g: any) => g.name),
        themes: [...themes, ...demographics],
        releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : null),
        status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming',
        totalEpisodes: item.episodes || null,
        episodes_count: item.episodes || null,
        seasons_count: seasons_count,
        rating: item.score || null,
        type: item.type || null,
        studio: (item.studios || []).length > 0 ? item.studios[0].name : 'Unknown',
        hasSub: true, // Default assumption
        hasDub: !!item.title_english, // Default assumption
        runtime: totalMinutes > 0 ? totalMinutes : null,
        avgEpisodeDuration: avgEpisodeDuration,
        isAdult: isAdult,
        malUrl: item.url,
        officialSite: item.external?.find((e: any) => e.name === 'Official Site')?.url,
        startDate: item.aired?.from,
        endDate: item.aired?.to,
        season: item.season ? item.season.charAt(0).toUpperCase() + item.season.slice(1) : undefined,
        rank: item.rank || undefined,
    };
};

/**
 * Maps a raw item from the Jikan API to the application's Manga type.
 * @param item The raw item from the Jikan API response.
 * @returns An Manga object or null if the item is invalid.
 */
export const mapJikanToManga = (item: any): Manga | null => {
    if (!item || !item.mal_id) {
        return null;
    }
    const hasExplicitGenre = (item.explicit_genres || []).some((g: any) => g.name === 'Hentai' || g.name === 'Erotica');
    const isAdult = item.sfw === false || hasExplicitGenre;
    return {
        id: item.mal_id,
        title: item.title_english || item.title || 'Untitled',
        title_english: item.title_english || null,
        title_japanese: item.title_japanese || '',
        thumbnail: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        synopsis: item.synopsis || 'No synopsis available.',
        genres: (item.genres || []).map((g: any) => g.name),
        score: item.score || null,
        type: item.type || null,
        chapters: item.chapters || null,
        volumes: item.volumes || null,
        status: item.status,
        authors: (item.authors || []).map((a: any) => ({ name: a.name })),
        malUrl: item.url,
        isAdult,
    };
};

/**
 * Maps a raw character item from the Jikan API to the application's Character type.
 * @param item The raw character item from the Jikan API response.
 * @returns A Character object or null if the item is invalid.
 */
export const mapJikanToCharacter = (item: any): Character | null => {
    if (!item || !item.character?.mal_id) {
        return null;
    }

    const voiceActors: VoiceActor[] = (item.voice_actors || []).map((va: any) => ({
        id: va.person.mal_id,
        name: va.person.name,
        image: va.person.images?.jpg?.image_url || '',
        language: va.language,
    })).filter((va: VoiceActor) => va.id && va.name && va.image); // Filter out incomplete VAs

    return {
        id: item.character.mal_id,
        name: item.character.name,
        image: item.character.images?.jpg?.image_url || '',
        role: item.role,
        voiceActors: voiceActors,
    };
};

/**
 * Fetches and processes a user's anime list from MyAnimeList via the Jikan API.
 * @param username The MyAnimeList username.
 * @returns A promise that resolves to an array of Anime objects.
 */
export const fetchMalUserAnimeList = async (username: string): Promise<Anime[]> => {
    let allAnime: Anime[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        // Fetch only 'watching' and 'plan_to_watch' statuses
        const response = await fetchWithRetry(`https://api.jikan.moe/v4/users/${username}/animelist?status=watching&status=plan_to_watch&page=${page}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch MAL list for user "${username}". The user may not exist or their list might be private.`);
        }
        
        const result = await response.json();
        const mappedData = (result.data || [])
            .map((item: any) => mapJikanToAnime(item.anime))
            .filter((anime): anime is Anime => anime !== null);
        
        allAnime = [...allAnime, ...mappedData];
        
        hasMore = result.pagination?.has_next_page ?? false;
        page++;
        if (hasMore) await new Promise(resolve => setTimeout(resolve, 400)); // Respect rate limit
    }

    return allAnime;
};

/**
 * STUB FUNCTION: Updates a user's anime list on MyAnimeList.
 * This functionality is not yet implemented as it requires MAL's official API with OAuth2.
 * @param animeId The MAL ID of the anime.
 * @param username The MAL username (for future use with official API).
 * @param data The data to update (e.g., { status, progress, isFavorite }).
 */
export const updateMalEntry = async (
    animeId: number,
    username: string,
    data: { status?: WatchlistStatus; progress?: number; isFavorite?: boolean }
): Promise<void> => {
    console.warn("MyAnimeList update functionality (updateMalEntry) is a stub and not implemented yet.", { animeId, username, data });
    // This is a stub function. MAL API integration for writing data is complex and requires OAuth2.
    // Jikan API is read-only for user lists.
    return Promise.resolve();
};

/**
 * Fetches the latest promotional videos, which serve as "news" or "updates".
 * @returns A promise that resolves to an array of NewsPromo objects.
 */
export const fetchNewsPromos = async (): Promise<NewsPromo[]> => {
    const response = await fetchWithRetry(`https://api.jikan.moe/v4/watch/promos`);
    if (!response.ok) {
        throw new Error('Failed to fetch latest promos/news.');
    }
    const result = await response.json();
    return result.data || [];
}

// --- AniList Integration ---

const ANILIST_API_URL = 'https://graphql.anilist.co';

type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';

async function fetchAnilist(query: string, variables: object, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`AniList API Error: ${errorBody.errors?.[0]?.message || 'Unknown error'}`);
    }
    return response.json();
}

const anilistQuery = `
query ($malId: Int) {
  Media(idMal: $malId, type: ANIME) {
    id
    title { romaji english native }
    coverImage { extraLarge large }
    bannerImage
    description(asHtml: false)
    genres
    tags { name isMediaSpoiler }
    averageScore
    episodes
    duration
    seasonYear
    studios(isMain: true) { nodes { name } }
    status
    trailer { id site }
    nextAiringEpisode {
      airingAt
      episode
    }
    relations {
      edges {
        relationType
        node {
          idMal
          title { romaji english }
          coverImage { large }
          type
          status
        }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes {
        mediaRecommendation {
          idMal
          title { romaji english }
          coverImage { large }
          type
          status
          averageScore
        }
      }
    }
  }
}
`;

// Helper to map relation/recommendation nodes
const mapAnilistNodeToPartialAnime = (node: any): Partial<Anime> | null => {
    if (!node || !node.idMal) return null;
    let status: Anime['status'] = 'Upcoming';
    switch (node.status) {
        case 'RELEASING': status = 'Ongoing'; break;
        case 'FINISHED': status = 'Completed'; break;
        case 'NOT_YET_RELEASED': status = 'Upcoming'; break;
    }

    return {
        id: node.idMal,
        title: node.title.english || node.title.romaji,
        thumbnail: node.coverImage.large,
        type: node.type,
        status: status,
        rating: node.averageScore ? node.averageScore / 10 : null,
    };
};

export const fetchAniListDetails = async (malId: number) => {
    const cacheKey = `anilist-details-${malId}`;
    try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const response = await fetch(ANILIST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query: anilistQuery, variables: { malId } }),
        });

        if (!response.ok) {
            throw new Error(`AniList API responded with status ${response.status}`);
        }

        const json = await response.json();
        if (json.errors) {
            throw new Error(json.errors.map((e: any) => e.message).join(', '));
        }

        const media = json.data.Media;
        if (!media) {
            return null;
        }

        const result = {
            details: {
                ...media,
                tags: media.tags.filter((t: any) => !t.isMediaSpoiler).map((t: any) => t.name),
                studios: media.studios.nodes.map((s: any) => s.name),
            },
            recommendations: media.recommendations.nodes
                .map((n: any) => mapAnilistNodeToPartialAnime(n.mediaRecommendation))
                .filter((a): a is Partial<Anime> => a !== null),
            relations: media.relations.edges
                .map((edge: any) => ({
                    ...mapAnilistNodeToPartialAnime(edge.node),
                    relationType: edge.relationType.replace(/_/g, ' '),
                }))
                .filter((a): a is Partial<Anime> & { relationType: string } => a !== null),
        };

        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        return result;

    } catch (error) {
        console.error(`Failed to fetch AniList details for MAL ID ${malId}:`, error);
        return null; // Graceful failure
    }
};


const mapAnilistToAnime = (item: any): Anime | null => {
    if (!item?.idMal) return null; // We use MAL ID as the primary key in our app

    let status: Anime['status'] = 'Upcoming';
    switch (item.status) {
        case 'RELEASING': status = 'Ongoing'; break;
        case 'FINISHED': status = 'Completed'; break;
        case 'NOT_YET_RELEASED': status = 'Upcoming'; break;
    }

    return {
        id: item.idMal,
        title: item.title.english || item.title.romaji || 'Untitled',
        title_english: item.title.english,
        title_japanese: item.title.native,
        thumbnail: item.coverImage.extraLarge,
        bannerImage: item.bannerImage || item.coverImage.extraLarge,
        synopsis: item.description?.replace(/<br\s*\/?>/gi, '\n') || 'No synopsis available.',
        genres: item.genres || [],
        releaseYear: item.seasonYear,
        status,
        totalEpisodes: item.episodes,
        episodes_count: item.episodes || null,
        seasons_count: null,
        rating: item.averageScore ? item.averageScore / 10 : null,
        type: item.type,
        studio: item.studios?.nodes?.[0]?.name || 'Unknown',
        hasSub: true,
        hasDub: false, // Cannot reliably determine from AniList
        runtime: null,
        avgEpisodeDuration: item.duration,
        isAdult: item.isAdult,
        malUrl: `https://myanimelist.net/anime/${item.idMal}`,
        anilistUrl: `https://anilist.co/anime/${item.id}`,
    };
};

export const fetchAnilistUserAnimeList = async (username: string): Promise<Anime[]> => {
    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME, status_in: [CURRENT, PLANNING]) {
          lists {
            entries {
              media {
                id
                idMal
                title { romaji english native }
                coverImage { extraLarge }
                bannerImage
                description(asHtml: false)
                genres
                seasonYear
                status
                episodes
                averageScore
                type
                duration
                isAdult
                studios(isMain: true) { nodes { name } }
              }
            }
          }
        }
      }
    `;
    const result = await fetchAnilist(query, { userName: username });
    const entries = result.data?.MediaListCollection?.lists?.flatMap((l: any) => l.entries) || [];
    return entries.map((entry: any) => mapAnilistToAnime(entry.media)).filter(Boolean);
};

export const getAnilistId = async (malId: number): Promise<number | null> => {
    // Basic caching to avoid repeated lookups during a session
    const cacheKey = `mal-to-anilist-${malId}`;
    const cachedId = sessionStorage.getItem(cacheKey);
    if (cachedId) return parseInt(cachedId, 10);
    
    const query = `query ($malId: Int) { Media(idMal: $malId, type: ANIME) { id } }`;
    try {
        const result = await fetchAnilist(query, { malId });
        const anilistId = result.data?.Media?.id;
        if (anilistId) {
            sessionStorage.setItem(cacheKey, anilistId.toString());
        }
        return anilistId || null;
    } catch (error) {
        console.error("Failed to get AniList ID", error);
        return null;
    }
};

const mapToAnilistStatus = (status: WatchlistStatus): MediaListStatus => {
    switch(status) {
        case 'Watching': return 'CURRENT';
        case 'Plan to Watch': return 'PLANNING';
        case 'Completed': return 'COMPLETED';
        case 'Dropped': return 'DROPPED';
        case 'On-Hold': return 'PAUSED';
        default: return 'PLANNING';
    }
};

export const updateAnilistEntry = async (
    malId: number,
    token: string,
    data: { status?: WatchlistStatus, progress?: number }
): Promise<void> => {
    if (!token || (!data.status && data.progress === undefined)) return;

    const anilistId = await getAnilistId(malId);
    if (!anilistId) {
        console.warn(`Could not find AniList ID for MAL ID ${malId} to sync.`);
        return;
    }

    const mutation = `
        mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int) {
            SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress) {
                id
                status
                progress
            }
        }
    `;

    const variables: { mediaId: number; status?: MediaListStatus; progress?: number } = { mediaId: anilistId };
    if (data.status) {
        variables.status = mapToAnilistStatus(data.status);
    }
    if (data.progress !== undefined) {
        variables.progress = data.progress;
    }

    try {
        await fetchAnilist(mutation, variables, token);
        console.log(`Synced data to AniList for anime ${malId}:`, data);
    } catch (error) {
        console.error("Failed to sync data to AniList", error);
    }
};

// Maintained for backward compatibility for now
export const updateAnilistProgress = async (anilistId: number, episode: number, token: string): Promise<void> => {
    const mutation = `
        mutation ($mediaId: Int, $progress: Int) {
            SaveMediaListEntry(mediaId: $mediaId, progress: $progress) {
                id
                progress
            }
        }
    `;
    await fetchAnilist(mutation, { mediaId: anilistId, progress: episode }, token);
};