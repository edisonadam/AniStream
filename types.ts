// FIX: Removed self-import which caused a conflict with local type declarations.
export interface Anime {
  id: number; // mal_id
  title: string;
  thumbnail: string;
  bannerImage: string;
  synopsis: string;
  genres: string[];
  releaseYear: number | null;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  totalEpisodes: number | null;
  rating: number | null;
  type: string | null;
  studio: string;
  tmdbId?: number; // Will be fetched later
  hasSub: boolean;
  hasDub: boolean;
  runtime: number | null;
  avgEpisodeDuration: number | null;
  isAdult: boolean;
}

export interface Season {
    season_number: number;
    episode_count: number;
    name: string;
    poster_path: string | null;
}

export interface Episode {
    episode_number: number;
    name: string;
    still_path: string | null;
    runtime: number | null;
}

export interface User {
  username: string;
  avatar: string; // URL to avatar image
}

export interface Comment {
  id: string;
  animeId: number;
  user: User;
  text: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ContinueWatchingInfo {
  animeId: number;
  currentSeason: number;
  currentEpisode: number;
  progress: number;
  timestamp: number;
}

export type Filter = {
  query?: string;
  genres?: string[];
  types?: string[];
  status?: 'Ongoing' | 'Completed' | 'Upcoming' | '';
  year?: string;
  sort?: 'popularity' | 'alphabetical' | 'release_date';
  language?: 'Sub' | 'Dub' | 'Raw' | '';
};

export type Theme = 'light' | 'dark';
export type ColorPreset = 'neon-purple' | 'indigo-flare' | 'cyber-blue' | 'sunset-orange';
export type VideoServer = 'embed-api' | 'vidsrc' | 'vidsrc-pk';
export type EpisodeViewStyle = 'default' | 'compact' | 'grid';

export interface Settings {
    theme: Theme;
    colorPreset: ColorPreset;
    autoplay: boolean;
    videoServer: VideoServer;
    vidsrcDomain: string;
    forceDesktopMode: boolean;
    episodeViewStyle: EpisodeViewStyle;
    blurEpisodeThumbnails: boolean;
    adsDisabled: boolean;
}

export interface ViewingHistoryItem {
    animeId: number;
    timestamp: number;
}

export interface Rating {
    animeId: number;
    rating: number; // 1-10
}