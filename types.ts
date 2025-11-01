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
  releaseYear: number | null;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  totalEpisodes: number | null;
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
  sort: 'popularity' | 'release_date' | 'alphabetical';
}

export type VideoServer = 'kiwi' | 'jet' | 'telli' | 'hop' | 'izy' | 'bee' | 'bun_kuz' | 'embed-api' | 'vidsrc' | 'vidsrc-pk' | 'vidbinge' | 'animepahe' | 'videembed' | 'bun' | 'kuz' | 'vidk' | 'plyr';

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
  animeBanner: string;
}

export type Theme = 'light' | 'dark';
export type ColorPreset = 'abyssal-blue' | 'violet-fusion' | 'cyber-cyan' | 'sunset-orange';
export type EpisodeViewStyle = 'auto' | 'default' | 'compact' | 'grid';
export type DefaultLanguage = 'sub' | 'dub' | 'ssub';
// FIX: Added 'clubs' to the Page type to resolve the type error in App.tsx.
export type Page = 'home' | 'player' | 'profile' | 'clubs' | 'club-detail' | 'magazines' | 'trending' | 'schedule' | 'history' | 'news' | 'manga' | 'beginners' | 'search' | 'community' | 'comment-meter';


export interface Settings {
  theme: Theme;
  colorPreset: ColorPreset;
  autoplayNext: boolean;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  videoServer: VideoServer;
  blurEpisodeThumbnails: boolean;
  restrictAdultContent: boolean;
  displayTitleLanguage: 'english' | 'japanese';
  malUsername: string;
  anilistUsername: string;
  anilistToken: string;
  autoSyncAniList: boolean;
  hideSpoilers: boolean;
  showWatchHistoryOnHome: boolean;
  showComments: boolean;
  defaultLanguage: DefaultLanguage;
  forceMaxQuality: boolean;
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
  type: 'reply' | 'share' | 'friend_request';
  text: string;
  relatedUser: User;
  animeId: number;
  commentId?: string;
  timestamp: number;
  read: boolean;
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