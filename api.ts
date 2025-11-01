import type { Anime, Character, VoiceActor, VideoServer, NewsPromo, Manga } from './types';

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
    autoplayNext?: boolean
): string | null => {
    if (!mediaType || !tmdbId) return null;

    const params = new URLSearchParams();
    if (autoplayNext) {
        params.set('autoplay', '1');
        if (mediaType === 'tv') {
            params.set('autonext', '1');
        }
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';

    switch (server) {
        // Vidsrc main family
        case 'vidsrc':
        case 'hop':
        case 'izy':
        case 'bee':
        case 'bun':
        case 'kuz': {
            const domain = 'vsrc.su'; // Using a reliable default
            if (mediaType === 'movie') {
                return `https://${domain}/embed/movie/${tmdbId}${queryString}`;
            }
            if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
                return `https://${domain}/embed/tv/${tmdbId}/${season}-${episode}${queryString}`;
            }
            return null;
        }

        // Vidsrc PK family
        case 'jet':
        case 'telli': {
            if (mediaType === 'movie') {
                return `https://embed.vidsrc.pk/movie/${tmdbId}${queryString}`;
            }
            if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
                return `https://embed.vidsrc.pk/tv/${tmdbId}/${season}-${episode}${queryString}`;
            }
            return null;
        }
        
        // Vidk and Plyr family (using a common 2embed pattern)
        case 'vidk':
        case 'plyr': {
            const domain = server === 'vidk' ? 'vidsrc.to' : 'multiembed.mov';
            if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
                return `https://${domain}/embed/tv?tmdb=${tmdbId}&s=${season}&e=${episode}${queryString.replace('?','&')}`;
            }
            if (mediaType === 'movie') {
                return `https://${domain}/embed/movie?tmdb=${tmdbId}${queryString.replace('?','&')}`;
            }
            return null;
        }

        // Generic embed-api family (default/fallback)
        case 'kiwi':
        case 'videembed':
        case 'vidbinge':
        case 'animepahe':
        default: {
            const url = new URL('https://player.embed-api.stream/');
            url.searchParams.set('id', tmdbId.toString());
            if (mediaType === 'tv') {
                if (season === undefined || episode === undefined) return null;
                url.searchParams.set('s', season.toString());
                url.searchParams.set('e', episode.toString());
            }
            if (autoplayNext) {
                url.searchParams.set('autoplay', '1');
            }
            return url.toString();
        }
    }
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

    return {
        id: item.mal_id,
        title: item.title_english || item.title || 'Untitled',
        title_english: item.title_english || null,
        title_japanese: item.title_japanese || '',
        thumbnail: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        bannerImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        synopsis: item.synopsis || 'No synopsis available.',
        genres: (item.genres || []).map((g: any) => g.name),
        releaseYear: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : null),
        status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming',
        totalEpisodes: item.episodes || null,
        rating: item.score || null,
        type: item.type || null,
        studio: (item.studios || []).length > 0 ? item.studios[0].name : 'Unknown',
        hasSub: true, // Default assumption
        hasDub: !!item.title_english, // Default assumption
        runtime: totalMinutes > 0 ? totalMinutes : null,
        avgEpisodeDuration: avgEpisodeDuration,
        isAdult: isAdult,
        malUrl: item.url,
        startDate: item.aired?.from,
        endDate: item.aired?.to,
        season: item.season ? item.season.charAt(0).toUpperCase() + item.season.slice(1) : undefined,
        nextAiringEpisode: item.airing && item.broadcast?.string ? {
            at: new Date(item.aired.to).getTime(),
            episode: (item.episodes || 0) + 1,
        } : undefined,
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
        const response = await fetch(`https://api.jikan.moe/v4/users/${username}/animelist?status=watching&status=plan_to_watch&page=${page}`);
        if (response.status === 429) { // Handle rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }
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
 * Fetches the latest promotional videos, which serve as "news" or "updates".
 * @returns A promise that resolves to an array of NewsPromo objects.
 */
export const fetchNewsPromos = async (): Promise<NewsPromo[]> => {
    const response = await fetch(`https://api.jikan.moe/v4/watch/promos`);
    if (!response.ok) {
        throw new Error('Failed to fetch latest promos/news.');
    }
    const result = await response.json();
    return result.data || [];
}

// --- AniList Integration ---

const ANILIST_API_URL = 'https://graphql.anilist.co';

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