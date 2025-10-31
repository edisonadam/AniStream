import type { Anime, Settings, Comment } from './types';

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
 * Scans localStorage for all comment lists, aggregates them, and returns the most recent ones.
 * This is a client-side solution for the "Recent Comments" feature.
 * @param limit The maximum number of recent comments to return.
 * @returns An array of the most recent Comment objects.
 */
export const getRecentComments = (limit: number = 15): Comment[] => {
  const allComments: Comment[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('comments_')) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          const comments: Comment[] = JSON.parse(storedValue);
          allComments.push(...comments);
        }
      }
    }
    
    // Sort all comments by timestamp descending to find the most recent
    allComments.sort((a, b) => b.timestamp - a.timestamp);

    return allComments.slice(0, limit);
  } catch (error) {
    console.error("Failed to get recent comments from localStorage", error);
    return [];
  }
};

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
