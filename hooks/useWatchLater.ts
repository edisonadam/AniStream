import { useContext } from 'react';
import { WatchlistContext } from '../contexts/WatchLaterContext';

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
