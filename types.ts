import type { ColorPreset as OriginalColorPreset } from './types';

export interface Anime {
  id: number;
  title: string;
  title_english: string | null;
  title_japanese: string;
  thumbnail: string;
  bannerImage: string;
  synopsis: string;
  genres: string[];
  themes?: string[];
  releaseYear: number | null;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  totalEpisodes: number | null;
  seasons_count: number | null;
  episodes_count: number | null;
  rating: number | null;
  type: 'TV' | 'Movie' | 'OVA' | 'Special' | 'ONA' | null;
  studio: string;
  hasSub: boolean;
  hasDub: boolean;
  runtime: number | null; // Total minutes for a movie
  avgEpisodeDuration: number | null; // Average minutes per episode for a series
  isAdult: boolean;
  officialSite?: string;
  malUrl?: string;
  anilistUrl?: string;
  startDate?: string;
  endDate?: string | null;
  season?: string;
  nextAiringEpisode?: {
    at: number; // timestamp
    episode: number;
  }
  rank?: number;
}

export interface Manga {
  id: number;
  title: string;
  title_english: string | null;
  title_japanese: string;
  thumbnail: string;
  synopsis: string;
  genres: string[];
  score: number | null;
  type: string | null;
  chapters: number | null;
  volumes: number | null;
  status: string;
  authors: { name: string }[];
  malUrl?: string;
  isAdult: boolean;
}

export interface Filter {
  query: string;
  genres: string[];
  types: string[];
  statuses: string[];
  years: string[];
  languages: string[];
  studios: string[];
  tags: string[];
  sort: 'popularity' | 'release_date' | 'alphabetical';
  letter?: string;
}

export type VideoServer = 'kiwi' | 'jet' | 'telli' | 'hop' | 'izy' | 'bee' | 'bun_kuz' | 'embed-api' | 'vidsrc' | 'vidsrc-pk' | 'vidbinge' | 'animepahe' | 'vidembed' | 'bun' | 'kuz' | 'vidk' | 'plyr' | 'mappletv' | 'vidlink' | 'primewire' | 'embedsu' | 'multiembed' | 'autoembed' | '2embed' | 'movieapi';

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
  air_date?: string;
  qualities?: {
    [key in '1080p' | '720p' | '480p']?: {
      url: string;
      size: number;
    }
  };
  filler?: boolean;
}

export interface User {
  uid: string;
  username: string;
  avatar: string;
  email: string | null;
  joinedDate: number; // timestamp
  isVerified: boolean;
}

export interface Comment {
  id: string;
  animeId: number;
  episodeIdentifier?: string; // e.g., "s1e1"
  user: User;
  text: string;
  timestamp: number;
  parentId?: string;
  replyingTo?: string;
  likes: number;
  animeTitle: string; // For recent comments section
  animeThumbnail: string; // For recent comments section
  animeBanner: string; // For recent comments section
}

export type Theme = 'light' | 'dark';
export type ColorPreset = 'abyssal-blue' | 'violet-fusion' | 'cyber-cyan' | 'sunset-orange';
export type EpisodeViewStyle = 'compact' | 'grid' | 'horizontal';
export type DefaultLanguage = 'sub' | 'dub' | 'ssub';
export type Page = 'home' | 'player' | 'profile' | 'club-detail' | 'magazines' | 'trending' | 'schedule' | 'history' | 'news' | 'manga' | 'beginners' | 'search' | 'community' | 'comment-meter' | 'currency' | 'about' | 'rules' | 'donation' | 'watch-together' | 'og-image-generator' | 'top-100' | 'notifications';
export type ToastType = 'success' | 'warning' | 'error' | 'info' | 'favorite' | 'unfavorite';

export type WatchlistStatus = 'Watching' | 'Completed' | 'On-Hold' | 'Dropped' | 'Plan to Watch';

export type NotificationType = 'reply' | 'share' | 'friend_request' | 'watchlist' | 'favorites' | 'mal_sync' | 'system' | 'general';

export interface Settings {
  theme: Theme;
  colorPreset: ColorPreset;
  videoServer: VideoServer;
  blurEpisodeThumbnails: boolean;
  restrictAdultContent: boolean;
  displayTitleLanguage: 'english' | 'japanese';
  malUsername: string;
  autoSyncMal: boolean;
  anilistUsername: string;
  anilistToken: string;
  autoSyncAniList: boolean;
  showWatchHistoryOnHome: boolean;
  showComments: boolean;
  defaultLanguage: DefaultLanguage;
  loadMoreMode: 'auto' | 'manual';
  hideFillerEpisodes: boolean;
  rememberVolume: boolean;
  rememberPlaybackSpeed: boolean;
  showSeekThumbnails: boolean;
  playerFocusMode: 'overlay' | 'fullscreen';
  forceDesktopMode: boolean;
  emailNotifications: boolean;
  inAppToastAlerts: boolean;
  malSyncAlerts: boolean;
  autoMarkAsRead: boolean;
  // New & updated settings
  homepageTrailer: boolean;
  autoPlay: boolean;
  autoSkip: boolean;
  startMuted: boolean;
  videoLoadStrategy: 'idle' | 'visible' | 'eager';
}

export interface WatchProgressInfo {
  animeId: number;
  currentSeason: number;
  currentEpisode: number;
  progress: number;
  timestamp: number;
}

export interface Rating {
  animeId: number;
  rating: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  timestamp: number;
  read: boolean;
  relatedUser?: User;
  animeId?: number;
  commentId?: string;
  animeTitle?: string; // For context in notifications list
}

export interface VoiceActor {
  id: number;
  name: string;
  image: string;
  language: string;
}

export interface Character {
  id: number;
  name: string;
  name_kanji?: string;
  image: string;
  role: string;
  about?: string;
  voiceActors: VoiceActor[];
}

// Club related types
export interface Club {
    mal_id: number;
    name: string;
    url: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
    members: number;
    category: string;
    created: string;
    access: string;
    // Client-side additions
    description?: string;
    creator?: string;
    isUserCreated?: boolean;
}

export interface ClubPicture {
    jpg: {
        image_url: string;
    };
}

export interface ClubMember {
    url: string;
    username: string;
    image_url: string;
}

export interface ClubStaff {
    url: string;
    username: string;
}

export interface MalUrl {
    mal_id: number;
    type: 'anime' | 'manga' | 'character';
    name: string;
    url: string;
    images?: {
        jpg: {
            image_url: string;
        }
    }
}

export interface ClubRelations {
    anime: MalUrl[];
    manga: MalUrl[];
    characters: MalUrl[];
}

export interface Magazine {
    mal_id: number;
    name: string;
    url: string;
    count: number;
}

export interface NewsPromo {
    title: string;
    entry: {
        mal_id: number;
        url: string;
        images: { jpg: { image_url: string } };
        title: string;
    };
}

// Community Page Types
export interface CommunityUser {
  uid: string;
  username: string;
  avatar: string;
}

export interface CommunityPost {
  id: string;
  user: CommunityUser;
  text: string;
  timestamp: number;
}

// Watch Together Types
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  user: { uid: string; username: string; avatar: string; };
  text: string;
  timestamp: number;
}

export interface Room {
  hostId: string;
  animeId: number;
  currentSeason: number;
  currentEpisode: number;
  playerState: PlayerState;
  participants: Record<string, { username: string; avatar: string }>;
  chat: Record<string, ChatMessage>;
}

// Keyboard Shortcuts
export type ShortcutAction = 
  'togglePlay' | 'seekBackward' | 'seekForward' | 'volumeUp' | 'volumeDown' | 
  'fullscreen' | 'mute' | 'skip' | 'toggleDarkMode' | 'nextEpisode' | 
  'previousEpisode' | 'escape' | 'showShortcuts' | 'focusPlayer';

export type Shortcuts = Record<ShortcutAction, string[]>;