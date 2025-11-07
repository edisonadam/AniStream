import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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

  // Use a ref to hold the latest watchProgressList. This allows getWatchProgress
  // to be stable and not cause re-renders in consumers like the Player component.
  const watchProgressListRef = useRef(watchProgressList);
  watchProgressListRef.current = watchProgressList;


  useEffect(() => {
    if (user) {
      try {
        const storageKey = `watch-progress-${user.uid}`;
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
    // Read from the ref to get the latest list without depending on the state variable itself.
    return watchProgressListRef.current.find(item => item.animeId === animeId);
  }, []); // Empty dependency array ensures the function reference is stable

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