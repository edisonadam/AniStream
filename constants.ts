import type { ColorPreset, VideoServer, DefaultLanguage } from './types';

export const GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
    'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Shounen', 'Shoujo',
    'Isekai'
];

export const ANIME_TYPES = ['TV', 'Movie', 'OVA', 'Special', 'ONA'];
export const ANIME_STATUSES = ['Ongoing', 'Completed', 'Upcoming'];
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

export const DEFAULT_SEARCH_SUGGESTIONS = ["Solo Leveling", "Jujutsu Kaisen", "Chainsaw Man"];

export const POPULAR_TITLES = ['Void Scrambler', 'Galactic Drifters', 'Chronicles of Valoria'];
export const RECENTLY_ADDED = ['Neon Genesis Evangelion', 'Astra Lost in Space'];

export const BEGINNER_ANIME_IDS = [
    1535,  // Death Note
    38000, // Demon Slayer: Kimetsu no Yaiba
    5114,  // Fullmetal Alchemist: Brotherhood
    16498, // Attack on Titan
    31964, // My Hero Academia
    1,     // Cowboy Bebop
    50265, // SPY x FAMILY
    20583, // Haikyu!!
    40748, // Jujutsu Kaisen
    32182, // Mob Psycho 100
    20,    // Naruto
    30276, // One-Punch Man
    11061, // Hunter x Hunter (2011)
    31043, // Erased
    38680, // Fruits Basket (2019)
    37521, // Vinland Saga
    38691, // Dr. Stone
    23273, // Your Lie in April
    2001,  // Gurren Lagann
    42897, // Horimiya
    52991, // Frieren: Beyond Journey's End
];


export const COLOR_PRESETS: { id: ColorPreset, name: string }[] = [
    { id: 'violet-fusion', name: 'Violet Fusion' },
    { id: 'cyber-cyan', name: 'Cyber Cyan' },
    { id: 'sunset-orange', name: 'Sunset Orange' },
];

export const VIDEO_SERVERS: { id: VideoServer, name: string, type: DefaultLanguage }[] = [
    // Sub Servers
    { id: 'videembed', name: 'VidEmbed', type: 'sub' },
    { id: 'kiwi', name: 'Kiwi', type: 'sub' },
    { id: 'jet', name: 'Jet', type: 'sub' },
    { id: 'telli', name: 'Telli', type: 'sub' },
    { id: 'vidk', name: 'VidK', type: 'sub' },
    { id: 'plyr', name: 'Plyr', type: 'sub' },
    
    // Dub Servers
    { id: 'vidsrc', name: 'VidSrc', type: 'dub' },
    { id: 'hop', name: 'Hop', type: 'dub' },
    { id: 'izy', name: 'Izy', type: 'dub' },
    { id: 'bee', name: 'Bee', type: 'dub' },
    { id: 'bun', name: 'Bun', type: 'dub' },
    { id: 'kuz', name: 'Kuz', type: 'dub' },

    // S-Sub servers (same as dub per request)
    { id: 'vidsrc', name: 'VidSrc', type: 'ssub' },
    { id: 'hop', name: 'Hop', type: 'ssub' },
    { id: 'izy', name: 'Izy', type: 'ssub' },
    { id: 'bee', name: 'Bee', type: 'ssub' },
    { id: 'bun', name: 'Bun', type: 'ssub' },
    { id: 'kuz', name: 'Kuz', type: 'ssub' },
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