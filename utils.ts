import type { Anime, Settings, Comment } from './types';
import { db } from './firebase';
import { ref, get } from 'firebase/database';

/**
 * Gets the appropriate display title for an anime based on user settings.
 * @param anime The anime object.
 * @param settings The user's settings object.
 * @returns The title string to display.
 */
export const getDisplayTitle = (anime: Anime, settings: Settings): string => {
  if (!anime) return 'Untitled';
  
  if (settings.displayTitleLanguage === 'japanese' && anime.title_japanese) {
    return anime.title_japanese;
  }
  
  return anime.title_english || anime.title;
};


const franchiseRegex = /:\s.*|\sSeason\s\d+|\sPart\s\d+|\sCour\s\d+|\s\d+(?:st|nd|rd|th)\sSeason|\s(?:II|III|IV|V|VI|VII|VIII|IX|X)$|\s\d+$/i;

/**
 * Strips season, part, and other sequel identifiers from an anime title to get a base franchise name.
 * @param title The full anime title.
 * @returns The base franchise title.
 */
export const getFranchiseTitle = (title: string): string => {
  if (!title) return '';
  return title.replace(franchiseRegex, '').trim();
};

/**
 * Filters a list of anime to only include one entry per franchise.
 * It prioritizes keeping the entry that appears first in the original list.
 * @param animeList The list of anime to filter.
 * @returns A new array with duplicate franchises removed.
 */
export const deduplicateFranchises = (animeList: Anime[]): Anime[] => {
  const franchiseMap = new Map<string, Anime>();
  animeList.forEach(anime => {
    const franchiseTitle = getFranchiseTitle(anime.title);
    if (!franchiseMap.has(franchiseTitle)) {
      franchiseMap.set(franchiseTitle, anime);
    }
  });
  return Array.from(franchiseMap.values());
};

/**
 * Scans Firebase for all comment lists and aggregates them.
 * WARNING: This is very inefficient and should not be used in a production environment.
 * It fetches the entire '/comments' tree. A better solution involves denormalizing comment counts.
 * @returns An array of all Comment objects found.
 */
export const getAllComments = async (): Promise<Comment[]> => {
  const allComments: Comment[] = [];
  try {
    const commentsRef = ref(db, 'comments');
    const snapshot = await get(commentsRef);
    if (snapshot.exists()) {
        const allAnimeComments = snapshot.val();
        for (const animeId in allAnimeComments) {
            const commentsForAnime = allAnimeComments[animeId];
            for (const commentId in commentsForAnime) {
                allComments.push({
                    id: commentId,
                    ...commentsForAnime[commentId]
                });
            }
        }
    }
    return allComments;
  } catch (error) {
    console.error("Failed to get all comments from Firebase", error);
    return [];
  }
};


/**
 * Counts all comments made by a specific user. This is an async operation.
 * @param userId The UID of the user.
 * @returns The total number of comments.
 */
export const countUserComments = async (userId: string): Promise<number> => {
    const allComments = await getAllComments();
    return allComments.filter(comment => comment.user.uid === userId).length;
}


/**
 * Formats a timestamp into a relative time string (e.g., "5 minutes ago").
 * @param timestamp The timestamp number (milliseconds).
 * @returns A relative time string.
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return "Just now";
};

/**
 * Converts a partial anime object into a full Anime object with default values.
 * @param partial The partial anime object, must have id, title, and thumbnail.
 * @returns A full Anime object.
 */
export const mapPartialToFullAnime = (partial: Partial<Anime> & { id: number; title: string; thumbnail: string }): Anime => {
    return {
        title_english: partial.title_english || partial.title,
        title_japanese: partial.title_japanese || '',
        bannerImage: partial.bannerImage || partial.thumbnail,
        synopsis: partial.synopsis || '',
        genres: partial.genres || [],
        releaseYear: partial.releaseYear || null,
        status: partial.status || 'Completed',
        totalEpisodes: partial.totalEpisodes || null,
        episodes_count: partial.episodes_count || null,
        seasons_count: partial.seasons_count || null,
        rating: partial.rating || null,
        type: partial.type || null,
        studio: partial.studio || '',
        hasSub: partial.hasSub ?? true,
        hasDub: partial.hasDub ?? false,
        runtime: partial.runtime || null,
        avgEpisodeDuration: partial.avgEpisodeDuration || null,
        isAdult: partial.isAdult ?? false,
        ...partial,
    };
};

// FIX: Add formatDuration function to be used globally.
export const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};
