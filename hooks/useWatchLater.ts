import { useContext } from 'react';
import { WatchLaterContext } from '../contexts/WatchLaterContext';

export const useWatchLater = () => {
  const context = useContext(WatchLaterContext);
  if (context === undefined) {
    throw new Error('useWatchLater must be used within a WatchLaterProvider');
  }
  return context;
};
