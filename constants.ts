import type { ColorPreset, VideoServer, DefaultLanguage, Anime, WatchlistStatus, Shortcuts } from './types';

export const GENRES_MAP: Record<string, number> = {
    'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8, 'Fantasy': 10, 'Horror': 14,
    'Mecha': 18, 'Music': 19, 'Mystery': 7, 'Psychological': 40, 'Romance': 22, 'Sci-Fi': 24,
    'Slice of Life': 36, 'Sports': 30, 'Supernatural': 37, 'Thriller': 41, 'Shounen': 27, 'Shoujo': 25,
    'Isekai': 62
};
export const GENRES = Object.keys(GENRES_MAP);

export const ANIME_TYPES = ['TV', 'Movie', 'OVA', 'Special', 'ONA'];
export const ANIME_STATUSES = ['Ongoing', 'Completed', 'Upcoming'];
export const WATCHLIST_STATUSES: WatchlistStatus[] = ['Watching', 'Completed', 'On-Hold', 'Dropped', 'Plan to Watch'];
export const MANGA_TYPES = ['manga', 'novel', 'lightnovel', 'oneshot', 'doujin', 'manhwa', 'manhua'];
export const MANGA_STATUSES = ['publishing', 'complete', 'hiatus', 'discontinued', 'upcoming'];
export const YEAR_OPTIONS = ['2020s', '2010s', '2000s', '1990s'];
export const LANGUAGE_OPTIONS = ['Sub', 'Dub', 'Raw'];
export const STUDIO_OPTIONS = [
    'A-1 Pictures',
    'Bones',
    'CloverWorks',
    'CoMix Wave Films',
    'David Production',
    'Doga Kobo',
    'Gainax',
    'J.C.Staff',
    'Kyoto Animation',
    'Lerche',
    'Madhouse',
    'MAPPA',
    'P.A. Works',
    'Pierrot',
    'Production I.G',
    'Shaft',
    'Studio Deen',
    'Studio Ghibli',
    'Sunrise',
    'TMS Entertainment',
    'Toei Animation',
    'Trigger',
    'Ufotable',
    'Wit Studio'
];
export const TAG_OPTIONS = [
    'Adult Cast', 'Anthropomorphic', 'Avant Garde', 'Award Winning', 'CGDCT', 
    'Childcare', 'Combat Sports', 'Crossdressing', 'Delinquents', 'Detective', 
    'Educational', 'Gag Humor', 'Gore', 'Harem', 'High Stakes Game', 
    'Historical', 'Idols (Female)', 'Idols (Male)', 'Iyashikei', 'Josei', 
    'Kids', 'Love Polygon', 'Magical Sex Shift', 'Mahou Shoujo', 'Martial Arts', 
    'Medical', 'Military', 'Mythology', 'Organized Crime', 'Otaku Culture', 
    'Parody', 'Performing Arts', 'Pets', 'Racing', 'Reincarnation', 
    'Reverse Harem', 'Romantic Subtext', 'Samurai', 'School', 'Seinen', 
    'Showbiz', 'Strategy Game', 'Super Power', 'Survival', 'Team Sports', 
    'Time Travel', 'Vampire', 'Video Game', 'Visual Arts', 'Workplace'
];

export const DEFAULT_SEARCH_SUGGESTIONS = ["Solo Leveling", "Jujutsu Kaisen", "Chainsaw Man"];

export const POPULAR_TITLES = ['Void Scrambler', 'Galactic Drifters', 'Chronicles of Valoria'];
export const RECENTLY_ADDED = ['Neon Genesis Evangelion', 'Astra Lost in Space'];

export const BEGINNER_ANIME_LIST: Anime[] = [
    {
        id: 1535,
        title: "Death Note",
        title_english: "Death Note",
        title_japanese: "デスノート",
        thumbnail: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
        synopsis: "A shinigami, as a deity of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note. One day, Ryuk, bored by the shinigami lifestyle and interested in seeing how a human would use a Death Note, drops one into the human realm...",
        genres: ["Supernatural", "Suspense", "Psychological", "Shounen"],
        releaseYear: 2006,
        status: "Completed",
        totalEpisodes: 37,
        episodes_count: 37,
        seasons_count: 1,
        rating: 8.62,
        type: "TV",
        studio: "Madhouse",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 23, isAdult: false
    },
    {
        id: 5114,
        title: "Fullmetal Alchemist: Brotherhood",
        title_english: "Fullmetal Alchemist: Brotherhood",
        title_japanese: "鋼の錬金術師 FULLMETAL ALCHEMIST",
        thumbnail: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
        synopsis: "'In order for something to be obtained, something of equal value must be lost.' Alchemy is bound by this Law of Equivalent Exchange—something the young brothers Edward and Alphonse Elric only realize after attempting human transmutation: the one forbidden act of alchemy...",
        genres: ["Action", "Adventure", "Drama", "Fantasy", "Shounen"],
        releaseYear: 2009,
        status: "Completed",
        totalEpisodes: 64,
        episodes_count: 64,
        seasons_count: 1,
        rating: 9.1,
        type: "TV",
        studio: "Bones",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 24, isAdult: false
    },
    {
        id: 38000,
        title: "Kimetsu no Yaiba",
        title_english: "Demon Slayer: Kimetsu no Yaiba",
        title_japanese: "鬼滅の刃",
        thumbnail: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
        synopsis: "Ever since the death of his father, the burden of supporting the family has fallen upon Tanjirou Kamado's shoulders. Though living impoverished on a remote mountain, the Kamado family are able to enjoy a relatively peaceful and happy life. One day, Tanjirou decides to go down to the local village to make a little money selling charcoal. On his way back, night falls, forcing Tanjirou to take shelter in the house of a strange man, who warns him of flesh-eating demons that lurk in the woods at night.",
        genres: ["Action", "Fantasy", "Shounen"],
        releaseYear: 2019,
        status: "Completed",
        totalEpisodes: 26,
        episodes_count: 26,
        seasons_count: 1,
        rating: 8.55,
        type: "TV",
        studio: "ufotable",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 24, isAdult: false
    },
    {
        id: 31964,
        title: "Boku no Hero Academia",
        title_english: "My Hero Academia",
        title_japanese: "僕のヒーローアカデミア",
        thumbnail: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",
        synopsis: "The appearance of 'quirks,' newly discovered super powers, has been steadily increasing over the years, with 80 percent of humanity possessing various abilities from manipulation of elements to shapeshifting. This leaves the remainder of the world completely powerless, and Izuku Midoriya is one such individual...",
        genres: ["Action", "Shounen"],
        releaseYear: 2016,
        status: "Completed",
        totalEpisodes: 13,
        episodes_count: 13,
        seasons_count: 1,
        rating: 7.95,
        type: "TV",
        studio: "Bones",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 24, isAdult: false
    },
    {
        id: 11061,
        title: "Hunter x Hunter (2011)",
        title_english: "Hunter x Hunter",
        title_japanese: "HUNTER×HUNTER（ハンター×ハンター）",
        thumbnail: "https://cdn.myanimelist.net/images/anime/1337/99013.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/1337/99013.jpg",
        synopsis: "Hunters are specialized in a wide variety of fields, ranging from treasure hunting to cooking. They have access to otherwise unavailable funds and information that allow them to pursue their dreams and interests. However, being a Hunter is a special privilege, only attained by taking a deadly exam with an extremely low success rate...",
        genres: ["Action", "Adventure", "Fantasy", "Shounen"],
        releaseYear: 2011,
        status: "Completed",
        totalEpisodes: 148,
        episodes_count: 148,
        seasons_count: 1,
        rating: 9.04,
        type: "TV",
        studio: "Madhouse",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 23, isAdult: false
    },
    {
        id: 16498,
        title: "Shingeki no Kyojin",
        title_english: "Attack on Titan",
        title_japanese: "進撃の巨人",
        thumbnail: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
        synopsis: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not born out of hunger but what appears to be out of pleasure...",
        genres: ["Action", "Drama", "Suspense", "Shounen"],
        releaseYear: 2013,
        status: "Completed",
        totalEpisodes: 25,
        episodes_count: 25,
        seasons_count: 1,
        rating: 8.54,
        type: "TV",
        studio: "Wit Studio",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 24, isAdult: false
    },
    {
        id: 30276,
        title: "One Punch Man",
        title_english: "One-Punch Man",
        title_japanese: "ワンパンマン",
        thumbnail: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
        synopsis: "The seemingly ordinary and unimpressive Saitama has a rather unique hobby: being a hero. In order to pursue his childhood dream, he trained relentlessly for three years—and lost all of his hair in the process. Now, Saitama is incredibly powerful, so much so that no enemy is able to defeat him in battle...",
        genres: ["Action", "Comedy", "Supernatural"],
        releaseYear: 2015,
        status: "Completed",
        totalEpisodes: 12,
        episodes_count: 12,
        seasons_count: 1,
        rating: 8.51,
        type: "TV",
        studio: "Madhouse",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 24, isAdult: false
    },
    {
        id: 40748,
        title: "Jujutsu Kaisen",
        title_english: "Jujutsu Kaisen",
        title_japanese: "呪術廻戦",
        thumbnail: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
        bannerImage: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
        synopsis: "Idly indulging in baseless paranormal activities with the Occult Club, high schooler Yuuji Itadori spends his days at either the clubroom or the hospital, where he visits his bedridden grandfather. However, this leisurely lifestyle soon takes a turn for the strange when he unknowingly encounters a cursed item...",
        genres: ["Action", "Fantasy", "Shounen"],
        releaseYear: 2020,
        status: "Completed",
        totalEpisodes: 24,
        episodes_count: 24,
        seasons_count: 1,
        rating: 8.68,
        type: "TV",
        studio: "MAPPA",
        hasSub: true, hasDub: true, runtime: null, avgEpisodeDuration: 24, isAdult: false
    }
];

export const COLOR_PRESETS: { id: ColorPreset, name: string }[] = [
    { id: 'abyssal-blue', name: 'Abyssal Blue' },
    { id: 'violet-fusion', name: 'Violet Fusion' },
    { id: 'cyber-cyan', name: 'Cyber Cyan' },
    { id: 'sunset-orange', name: 'Sunset Orange' },
    { id: 'rainbow-shift', name: 'Rainbow Shift' },
];

export interface ServerOption {
  id: VideoServer;
  name: string;
  type: DefaultLanguage;
  subServers?: ServerOption[];
}

export const VIDEO_SERVERS: ServerOption[] = [
    // Sub Servers
    {
        id: 'vidembed', name: 'VidEmbed', type: 'sub', subServers: [
            { id: 'mappletv', name: 'MappleTV', type: 'sub' },
            { id: 'vidlink', name: 'VidLink', type: 'sub' },
            { id: 'primewire', name: 'Primewire', type: 'sub' },
            { id: 'embedsu', name: 'EmbedSU', type: 'sub' },
            { id: 'multiembed', name: 'MultiEmbed', type: 'sub' },
            { id: 'vidbinge', name: 'VidBinge', type: 'sub' },
            { id: 'vidsrc', name: 'VidSrc', type: 'sub' },
            { id: 'autoembed', name: 'AutoEmbed', type: 'sub' },
            { id: '2embed', name: '2Embed', type: 'sub' },
            { id: 'movieapi', name: 'MovieAPI', type: 'sub' },
        ]
    },
    { id: 'gogoanime', name: 'GogoAnime', type: 'sub' },
    { id: 'zoro', name: 'Zoro', type: 'sub' },
    { id: 'animepahe', name: 'AnimePahe', type: 'sub' },
    
    // Dub Servers
    { id: 'hop', name: 'Hop', type: 'dub' },
    { id: 'izy', name: 'Izy', type: 'dub' },
    { id: 'bee', name: 'Bee', type: 'dub' },
    { id: 'bun', name: 'Bun', type: 'dub' },
    { id: 'kuz', name: 'Kuz', type: 'dub' },

    // S-Sub servers (same as dub per request)
    { id: 'hop', name: 'Hop (S)', type: 'ssub' },
    { id: 'izy', name: 'Izy (S)', type: 'ssub' },
    { id: 'bee', name: 'Bee (S)', type: 'ssub' },
    { id: 'bun', name: 'Bun (S)', type: 'ssub' },
    { id: 'kuz', name: 'Kuz (S)', type: 'ssub' },
];

export const VIDSRC_DOMAINS: string[] = [
    'vsrc.su',
    'vidsrc-embed.ru',
    'vidsrc-embed.su',
    'vidsrcme.ru',
    'vidsrcme.su',
    'vidsrc-me.ru',
    'vidsrc-me.su',
];

// Mock filler list for Naruto (MAL ID: 20) for demonstration
export const NARUTO_FILLER_EPISODES: number[] = [
    26, 97, 99, 101, 102, 103, 104, 105, 106, 136, 137, 138, 139,
    140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151,
    152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163,
    164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175,
    176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187,
    188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211,
    212, 213, 214, 215, 216, 217, 218, 219
];

export const LEVEL_DATA = [
    { level: 0, name: 'Newbie', tokens: 0 },
    { level: 1, name: 'Talker', tokens: 60000 },
    { level: 5, name: 'Chatterbox', tokens: 300000 },
    { level: 10, name: 'Socialite', tokens: 600000 },
    { level: 20, name: 'Community Pillar', tokens: 1200000 },
    { level: 30, name: 'Forum Veteran', tokens: 1800000 },
    { level: 40, name: 'Discussion Master', tokens: 2400000 },
    { level: 50, name: 'Anime Legend', tokens: 3000000 },
];
export const MAX_LEVEL_TOKENS = 3000000;

export const defaultShortcuts: Shortcuts = {
  'togglePlay': ['Space', 'K'],
  'seekBackward': ['ArrowLeft', 'J'],
  'seekForward': ['ArrowRight', 'L'],
  'volumeUp': ['ArrowUp'],
  'volumeDown': ['ArrowDown'],
  'fullscreen': ['F'],
  'mute': ['M'],
  'skip': ['S'],
  'toggleDarkMode': ['D'],
  'nextEpisode': ['N'],
  'previousEpisode': ['P'],
  'escape': ['Escape'],
  'showShortcuts': ['/', '?'],
  'focusPlayer': ['Shift+Enter']
};

export const VIP_USERS = ['Admin', 'Edison'];