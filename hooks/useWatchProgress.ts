import { useContext } from 'react';
import { WatchProgressContext } from '../contexts/WatchProgressContext';
import type { Anime } from '../types';

// The hook's return type is updated to reflect the new context value.
// Specifically, getWatchProgress and updateProgress now expect a full Anime object.
export const useWatchProgress = (): {
  watchProgressList: import('../types').WatchProgressInfo[];
  updateProgress: (anime: Anime, currentSeason: number, currentEpisode: number, progress: number) => void;
  getWatchProgress: (anime: Anime) => import('../types').WatchProgressInfo | undefined;
  clearProgress: () => void;
} => {
  const context = useContext(WatchProgressContext);
  if (context === undefined) {
    throw new Error('useWatchProgress must be used within a WatchProgressProvider');
  }
  return context;
};