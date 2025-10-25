import type { ColorPreset, VideoServer } from './types';

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

export const DEFAULT_SEARCH_SUGGESTIONS = ["Solo Leveling", "Jujutsu Kaisen", "Chainsaw Man"];

export const POPULAR_TITLES = ['Void Scrambler', 'Galactic Drifters', 'Chronicles of Valoria'];
export const RECENTLY_ADDED = ['Neon Genesis Evangelion', 'Astra Lost in Space'];

export const COLOR_PRESETS: { id: ColorPreset, name: string }[] = [
    { id: 'neon-purple', name: 'Neon Purple' },
    { id: 'indigo-flare', name: 'Indigo Flare' },
    { id: 'cyber-blue', name: 'Cyber Blue' },
    { id: 'sunset-orange', name: 'Sunset Orange' },
];

export const VIDEO_SERVERS: { id: VideoServer, name: string }[] = [
    { id: 'embed-api', name: 'Server 1' },
    { id: 'vidsrc', name: 'Vidsrc' },
    { id: 'vidsrc-pk', name: 'VidSrc PK' },
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

export const SUBTITLE_LANGUAGES: { code: string, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
];