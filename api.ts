
import type { Anime, Character, VoiceActor, NewsPromo, Manga, WatchlistStatus } from './types';

const CONSUMET_API_URL = 'https://consumet-api-sigma-eight.vercel.app';

// Simple rate limiter queue
const requestQueue: { url: string, options?: RequestInit, resolve: (value: Response) => void, reject: (reason?: any) => void }[] = [];
let isRequesting = false;
const RATE_LIMIT_DELAY = 350; // 3 requests per second = ~333ms. Using 350ms to be safe.

// Global state for rate limiting tracking
export let isGlobalRateLimited = false;
const rateLimitListeners: ((isLimited: boolean) => void)[] = [];

export const subscribeToRateLimit = (callback: (isLimited: boolean) => void) => {
    rateLimitListeners.push(callback);
    return () => {
        const index = rateLimitListeners.indexOf(callback);
        if (index > -1) rateLimitListeners.splice(index, 1);
    };
};

const setRateLimited = (limited: boolean) => {
    if (isGlobalRateLimited !== limited) {
        isGlobalRateLimited = limited;
        rateLimitListeners.forEach(cb => cb(limited));
    }
};

const processQueue = async () => {
    if (isRequesting || requestQueue.length === 0) return;
    isRequesting = true;

    const { url, options, resolve, reject } = requestQueue.shift()!;

    try {
        const response = await fetch(url, options);
        resolve(response);
    } catch (error) {
        reject(error);
    } finally {
        setTimeout(() => {
            isRequesting = false;
            processQueue();
        }, RATE_LIMIT_DELAY);
    }
};

const fetchWithRateLimit = (url: string, options?: RequestInit): Promise<Response> => {
    return new Promise((resolve, reject) => {
        requestQueue.push({ url, options, resolve, reject });
        processQueue();
    });
};

/**
 * A wrapper for the fetch API that includes automatic retries on rate limiting (429) or network errors.
 * @param url The URL to fetch.
 * @param retries The number of times to retry on failure.
 * @param delay The base delay in milliseconds between retries.
 * @param options Optional fetch options (RequestInit).
 * @returns A promise that resolves to the Response object.
 */
export const fetchWithRetry = async (url: string, retries = 3, delay = 1000, options?: RequestInit): Promise<Response> => {
    // Only use rate limiter for Jikan API
    const isJikan = url.includes('api.jikan.moe');
    
    for (let i = 0; i <= retries; i++) {
        try {
            const response = isJikan ? await fetchWithRateLimit(url, options) : await fetch(url, options);
            
            // If we get a 429 (Too Many Requests) or 5xx (Server Error)
            if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
                if (response.status === 429) setRateLimited(true);
                
                if (i < retries) {
                    const retryAfterHeader = response.headers.get('Retry-After');
                    // Default to a longer backoff for 429s/5xxs (e.g., 2s, 4s, 8s)
                    const waitTime = retryAfterHeader 
                        ? parseInt(retryAfterHeader, 10) * 1000 
                        : delay * Math.pow(2, i + 1); 
                    
                    console.warn(`Rate limit or server error (${response.status}) hit for ${url}. Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
            } else if (response.ok) {
                setRateLimited(false);
            }
            
            // If the response is anything else (ok or another error), return it immediately.
            return response;
        } catch (error) {
            // This catches network errors (e.g., offline).
            if (i < retries) {
                const waitTime = delay * Math.pow(2, i + 1); // Exponential backoff
                console.warn(`Network error for ${url}. Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            // If this was the last retry, throw the error.
            throw error;
        }
    }
    throw new Error(`Fetch failed for ${url} after multiple retries.`);
};

export const fetchTopCharacters = async (page = 1): Promise<Character[]> => {
    const response = await fetchWithRetry(`https://api.jikan.moe/v4/top/characters?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch top characters');
    const data = await response.json();
    return data.data.map((item: any) => ({
        id: item.mal_id,
        name: item.name,
        image: item.images?.jpg?.image_url || '',
        role: item.about, // Using 'about' as a description/role placeholder
        voiceActors: []
    }));
};

export const fetchTopPeople = async (page = 1): Promise<any[]> => {
    const response = await fetchWithRetry(`https://api.jikan.moe/v4/top/people?page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch top people');
    const data = await response.json();
    return data.data.map((item: any) => ({
        id: item.mal_id,
        name: item.name,
        image: item.images?.jpg?.image_url || '',
        about: item.about,
        favorites: item.favorites
    }));
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
    
    const score = item.score ? parseFloat(item.score as any) : null;

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
        rating: score && !isNaN(score) ? score : null,
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
        popularity: item.popularity || undefined,
        source: item.source || undefined,
        members: item.members || undefined,
    };
};

// FIX: Added missing function to map Consumet trending API response to the Anime type.
export const mapConsumetTrendingToAnime = (item: any): Anime | null => {
    if (!item || !item.malId) {
        return null;
    }

    // Consumet trending data is minimal. We'll fill in what we can and use defaults.
    return {
        id: item.malId,
        title: item.title,
        title_english: item.title, // Assumption
        title_japanese: '', // Not provided
        thumbnail: item.image,
        bannerImage: item.image, // Use same for banner
        synopsis: 'Synopsis not available from this source.',
        genres: item.genres || [],
        releaseYear: null, // Not provided
        status: 'Ongoing', // Assumption for trending
        totalEpisodes: null, // Not provided
        episodes_count: null,
        seasons_count: null,
        rating: null, // Not provided
        type: null, // Not provided
        studio: 'Unknown',
        hasSub: true, // Assumption
        hasDub: false, // Assumption
        runtime: null,
        avgEpisodeDuration: null,
        isAdult: false, // Consumet doesn't provide this, but we'll assume not adult unless filtered later
        malUrl: `https://myanimelist.net/anime/${item.malId}`,
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

export const fetchTopUpcomingAnime = async (page = 1): Promise<Anime[]> => {
    const response = await fetchWithRetry(`https://api.jikan.moe/v4/top/anime?filter=upcoming&page=${page}`);
    if (!response.ok) throw new Error('Failed to fetch top upcoming anime');
    const data = await response.json();
    return (data.data || [])
        .map((item: any) => mapJikanToAnime(item))
        .filter((anime): anime is Anime => anime !== null);
};

// --- AniList Integration ---

const ANILIST_API_URL = 'https://graphql.anilist.co';

type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';

async function fetchAnilist(query: string, variables: object, token?: string) {
    const headers: HeadersInit = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    
    // Use fetchWithRetry for AniList as well
    const response = await fetchWithRetry(ANILIST_API_URL, 3, 1000, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
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

        const response = await fetchWithRetry(ANILIST_API_URL, 3, 1000, {
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


export const mapAnilistToAnime = (item: any): Anime | null => {
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
    data: { status?: WatchlistStatus; progress?: number; isFavorite?: boolean }
): Promise<void> => {
    if (!token || (!data.status && data.progress === undefined && data.isFavorite === undefined)) return;

    const anilistId = await getAnilistId(malId);
    if (!anilistId) {
        console.warn(`Could not find AniList ID for MAL ID ${malId} to sync.`);
        return;
    }

    const mutation = `
        mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $isFavourite: Boolean) {
            SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress, isFavourite: $isFavourite) {
                id
                status
                progress
                isFavourite
            }
        }
    `;

    const variables: { mediaId: number; status?: MediaListStatus; progress?: number; isFavourite?: boolean } = { mediaId: anilistId };
    if (data.status) {
        variables.status = mapToAnilistStatus(data.status);
    }
    if (data.progress !== undefined) {
        variables.progress = data.progress;
    }
    if (data.isFavorite !== undefined) {
        variables.isFavourite = data.isFavorite;
    }

    try {
        await fetchAnilist(mutation, variables, token);
        console.log(`Synced data to AniList for anime ${malId}:`, data);
    } catch (error) {
        console.error("Failed to sync data to AniList", error);
    }
};

export const fetchAniListAiringSchedule = async (): Promise<(Anime & { nextAiringEpisode: { episode: number, airingAt: number } })[]> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let season;
    // Seasons: WINTER (Dec-Feb), SPRING (Mar-May), SUMMER (Jun-Aug), FALL (Sep-Nov)
    if (month >= 2 && month <= 4) season = 'SPRING';
    else if (month >= 5 && month <= 7) season = 'SUMMER';
    else if (month >= 8 && month <= 10) season = 'FALL';
    else season = 'WINTER';

    const query = `
      query ($season: MediaSeason, $year: Int) {
        Page(page: 1, perPage: 40) {
          media(season: $season, seasonYear: $year, type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
            idMal
            title { romaji english native }
            coverImage { extraLarge }
            bannerImage
            genres
            seasonYear
            status
            episodes
            averageScore
            type
            duration
            isAdult
            studios(isMain: true) { nodes { name } }
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }
      }
    `;

    const result = await fetchAnilist(query, { season, year });
    const media = result.data?.Page?.media || [];
    
    return media.map((item: any) => {
        const anime = mapAnilistToAnime(item);
        if (!anime || !item.nextAiringEpisode) return null;
        return {
            ...anime,
            nextAiringEpisode: {
                episode: item.nextAiringEpisode.episode,
                airingAt: item.nextAiringEpisode.airingAt * 1000 // convert to ms
            }
        };
    }).filter(Boolean);
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

// FIX: Added missing function to fetch streaming URLs from the Consumet API.
export const fetchConsumetStreamUrl = async (
    title: string,
    episodeNumber: number,
    provider: 'gogoanime' | 'zoro' | 'animepahe'
): Promise<string | null> => {
    try {
        // Clean title: remove parenthetical info like (TV) or (2024) to improve search hits
        const cleanTitle = title.replace(/\s*\([^)]*\)/g, '').trim();
        const searchRes = await fetchWithRetry(`${CONSUMET_API_URL}/anime/${provider}/${encodeURIComponent(cleanTitle)}`);
        
        if (!searchRes.ok) throw new Error('Anime not found on provider');
        const searchData = await searchRes.json();
        
        // Find the best match. Prefer exact title matches (case-insensitive).
        const animeResult = searchData.results?.find((r: any) => r.title.toLowerCase() === title.toLowerCase()) || searchData.results?.[0];
        
        if (!animeResult?.id) throw new Error('Could not determine anime ID from provider');
        const animeId = animeResult.id;

        // 2. Fetch episode list for the anime.
        const episodesRes = await fetchWithRetry(`${CONSUMET_API_URL}/anime/${provider}/info/${animeId}`);
        if (!episodesRes.ok) throw new Error('Could not fetch episode list');
        const episodesData = await episodesRes.json();
        
        const episode = episodesData.episodes?.find((ep: any) => ep.number === episodeNumber);
        const episodeId = episode?.id;
        if (!episodeId) throw new Error(`Episode ${episodeNumber} not found for ${title}`);

        // 3. Fetch the streaming URL for the episode.
        const streamRes = await fetchWithRetry(`${CONSUMET_API_URL}/anime/${provider}/watch/${episodeId}`);
        if (!streamRes.ok) throw new Error('Could not fetch streaming URL');
        const streamData = await streamRes.json();

        // Find the highest quality source, or the default one.
        const source = streamData.sources?.find((s: any) => s.quality === 'default' || s.quality === '1080p') || streamData.sources?.[streamData.sources.length - 1];
        
        return source?.url || null;

    } catch (error) {
        console.error(`[fetchConsumetStreamUrl] Failed for ${title} Ep ${episodeNumber} on ${provider}:`, error);
        return null;
    }
};
