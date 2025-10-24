import { useContext } from 'react';
import { ContinueWatchingContext } from '../contexts/ContinueWatchingContext';

export const useContinueWatching = () => {
  const context = useContext(ContinueWatchingContext);
  if (context === undefined) {
    throw new Error('useContinueWatching must be used within a ContinueWatchingProvider');
  }
  return context;
};
