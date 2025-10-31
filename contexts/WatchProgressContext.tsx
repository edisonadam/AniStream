import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { WatchProgressInfo } from '../types';
import { useAuth } from '../hooks/useAuth';

interface WatchProgressContextType {
  watchProgressList: WatchProgressInfo[];
  updateProgress: (
    animeId: number, 
    currentSeason: number, 
    currentEpisode: number,
    progress: number
  ) => void;
  getWatchProgress: (animeId: number) => WatchProgressInfo | undefined;
  clearProgress: () => void;
}

export const WatchProgressContext = createContext<WatchProgressContextType | undefined>(undefined);

interface WatchProgressProviderProps {
  children: ReactNode;
}

export const WatchProgressProvider: React.FC<WatchProgressProviderProps> = ({ children }) => {
  const [watchProgressList, setWatchProgressList] = useState<WatchProgressInfo[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storageKey = `watch-progress-${user.username}`;
        const storedList = localStorage.getItem(storageKey);
        
        if (storedList) {
          const parsedList = JSON.parse(storedList);
          // Sort by timestamp descending to show the most recent first
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
  
  const getWatchProgress = useCallback((animeId: number) => {
    return watchProgressList.find(item => item.animeId === animeId);
  }, [watchProgressList]);

  const updateProgress = useCallback((
    animeId: number, 
    currentSeason: number, 
    currentEpisode: number,
    progress: number
  ) => {
    if (!user) return;
    
    setWatchProgressList(prevList => {
      const newList = prevList.filter(item => item.animeId !== animeId);
      const newItem: WatchProgressInfo = { 
          animeId, 
          currentSeason, 
          currentEpisode, 
          progress: Math.min(100, progress), 
          timestamp: Date.now() 
      };
      
      const updatedList = [newItem, ...newList];
      
      const limitedList = updatedList.slice(0, 50); // Keep history to 50 items
      localStorage.setItem(`watch-progress-${user.username}`, JSON.stringify(limitedList));
      return limitedList;
    });
  }, [user]);

  const clearProgress = useCallback(() => {
    if (user) {
      setWatchProgressList([]);
      localStorage.removeItem(`watch-progress-${user.username}`);
    }
  }, [user]);
  
  return (
    <WatchProgressContext.Provider value={{ watchProgressList, updateProgress, getWatchProgress, clearProgress }}>
      {children}
    </WatchProgressContext.Provider>
  );
};