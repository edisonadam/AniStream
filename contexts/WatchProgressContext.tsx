import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { WatchProgressInfo, Anime } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getCanonicalId } from '../utils';

interface WatchProgressContextType {
  watchProgressList: WatchProgressInfo[];
  updateProgress: (
    anime: Anime, 
    currentSeason: number, 
    currentEpisode: number,
    progress: number
  ) => void;
  getWatchProgress: (anime: Anime) => WatchProgressInfo | undefined;
  clearProgress: () => void;
}

export const WatchProgressContext = createContext<WatchProgressContextType | undefined>(undefined);

interface WatchProgressProviderProps {
  children: ReactNode;
}

export const WatchProgressProvider: React.FC<WatchProgressProviderProps> = ({ children }) => {
  const [watchProgressList, setWatchProgressList] = useState<WatchProgressInfo[]>([]);
  const { user } = useAuth();

  const watchProgressListRef = useRef(watchProgressList);
  watchProgressListRef.current = watchProgressList;


  useEffect(() => {
    if (user) {
      try {
        const storageKey = `watch-progress-${user.uid}`;
        const storedList = localStorage.getItem(storageKey);
        
        if (storedList) {
          const parsedList = JSON.parse(storedList);
          parsedList.sort((a: WatchProgressInfo, b: WatchProgressInfo) => b.timestamp - a.timestamp);
          setWatchProgressList(parsedList);
        } else {
          setWatchProgressList([]);
        }
      } catch (error) {
        console.error("Failed to process watch progress list from localStorage", error);
        setWatchProgressList([]);
      }
    } else {
      setWatchProgressList([]);
    }
  }, [user]);
  
  const getWatchProgress = useCallback((anime: Anime) => {
    const canonicalId = getCanonicalId(anime);
    return watchProgressListRef.current.find(item => item.canonicalId === canonicalId);
  }, []);

  const updateProgress = useCallback((
    anime: Anime, 
    currentSeason: number, 
    currentEpisode: number,
    progress: number
  ) => {
    if (!user) return;
    
    const canonicalId = getCanonicalId(anime);

    setWatchProgressList(prevList => {
      const existingIndex = prevList.findIndex(item => item.canonicalId === canonicalId);
      let updatedList;

      const newItem: WatchProgressInfo = { 
          canonicalId,
          animeId: anime.id, 
          currentSeason, 
          currentEpisode, 
          progress: Math.min(100, progress), 
          timestamp: Date.now() 
      };

      if (existingIndex > -1) {
        // Update existing item and move to front
        updatedList = [newItem, ...prevList.slice(0, existingIndex), ...prevList.slice(existingIndex + 1)];
      } else {
        // Add new item to the front
        updatedList = [newItem, ...prevList];
      }
      
      const limitedList = updatedList.slice(0, 50); // Keep history to 50 items
      localStorage.setItem(`watch-progress-${user.uid}`, JSON.stringify(limitedList));
      return limitedList;
    });
  }, [user]);

  const clearProgress = useCallback(() => {
    if (user) {
      setWatchProgressList([]);
      localStorage.removeItem(`watch-progress-${user.uid}`);
    }
  }, [user]);
  
  return (
    <WatchProgressContext.Provider value={{ watchProgressList, updateProgress, getWatchProgress, clearProgress }}>
      {children}
    </WatchProgressContext.Provider>
  );
};