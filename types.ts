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
  parentId?: string; // ID of the parent comment
  replyingTo?: string; // Username of the user being replied to
}

export interface Notification {
  id: string;
  text: string;
  timestamp: number;
  read: boolean;
  type: 'reply' | 'friend_request' | 'system' | 'share';
  relatedUser?: User; // The user who triggered the notification (e.g., who replied)
  animeId?: number; // The anime related to the notification
  commentId?: string; // To scroll to a specific comment
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
  studio?: string;
};

export type Theme = 'light' | 'dark';
export type ColorPreset = 'neon-purple' | 'indigo-flare' | 'cyber-cyan' | 'sunset-orange';
export type VideoServer = 'embed-api' | 'vidsrc' | 'vidsrc-pk';
export type EpisodeViewStyle = 'default' | 'compact' | 'grid';

export interface Settings {
    theme: Theme;
    colorPreset: ColorPreset;
    autoplayNext: boolean;
    autoSkipIntro: boolean;
    autoSkipOutro: boolean;
    videoServer: VideoServer;
    vidsrcDomain: string;
    forceDesktopMode: boolean;
    episodeViewStyle: EpisodeViewStyle;
    blurEpisodeThumbnails: boolean;
    restrictAdultContent: boolean;
}

export interface ViewingHistoryItem {
    animeId: number;
    timestamp: number;
}

export interface Rating {
    animeId: number;
    rating: number; // 1-10
}