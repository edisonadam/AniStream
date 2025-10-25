// FIX: Removed self-import of 'Anime' type which was causing a conflict with the local declaration.

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

// FIX: Added missing ContinueWatchingInfo interface.
export interface ContinueWatchingInfo {
  animeId: number;
  currentSeason: number;
  currentEpisode: number;
  progress: number;
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
