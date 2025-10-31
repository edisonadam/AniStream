import { useContext } from 'react';
import { WatchProgressContext } from '../contexts/WatchProgressContext';

export const useWatchProgress = () => {
  const context = useContext(WatchProgressContext);
  if (context === undefined) {
    throw new Error('useWatchProgress must be used within a WatchProgressProvider');
  }
  return context;
};