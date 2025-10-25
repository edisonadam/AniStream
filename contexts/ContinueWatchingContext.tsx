
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ContinueWatchingInfo, Anime } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ContinueWatchingContextType {
  continueWatchingList: ContinueWatchingInfo[];
  updateProgress: (
    animeId: number, 
    currentSeason: number, 
    currentEpisode: number,
    progress: number
  ) => void;
  getContinueWatchingInfo: (animeId: number) => ContinueWatchingInfo | undefined;
}

export const ContinueWatchingContext = createContext<ContinueWatchingContextType | undefined>(undefined);

interface ContinueWatchingProviderProps {
  children: ReactNode;
}

export const ContinueWatchingProvider: React.FC<ContinueWatchingProviderProps> = ({ children }) => {
  const [continueWatchingList, setContinueWatchingList] = useState<ContinueWatchingInfo[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storageKey = `continue-watching-${user.username}`;
        const storedList = localStorage.getItem(storageKey);
        
        if (storedList) {
          const parsedList = JSON.parse(storedList);
          // Sort by timestamp descending to show the most recent first
          parsedList.sort((a: ContinueWatchingInfo, b: ContinueWatchingInfo) => b.timestamp - a.timestamp);
          setContinueWatchingList(parsedList);
        } else {
          setContinueWatchingList([]);
        }
      } catch (error) {
        console.error("Failed to process continue watching list from localStorage", error);
        setContinueWatchingList([]);
      }
    } else {
      setContinueWatchingList([]);
    }
  }, [user]);
  
  const getContinueWatchingInfo = useCallback((animeId: number) => {
    return continueWatchingList.find(item => item.animeId === animeId);
  }, [continueWatchingList]);

  const updateProgress = useCallback((
    animeId: number, 
    currentSeason: number, 
    currentEpisode: number,
    progress: number
  ) => {
    if (!user) return;
    
    setContinueWatchingList(prevList => {
      const newList = prevList.filter(item => item.animeId !== animeId);
      const newItem: ContinueWatchingInfo = { 
          animeId, 
          currentSeason, 
          currentEpisode, 
          progress: Math.min(100, progress), 
          timestamp: Date.now() 
      };
      
      const updatedList = [newItem, ...newList];
      
      const limitedList = updatedList.slice(0, 20);
      localStorage.setItem(`continue-watching-${user.username}`, JSON.stringify(limitedList));
      return limitedList;
    });
  }, [user]);
  
  return (
    <ContinueWatchingContext.Provider value={{ continueWatchingList, updateProgress, getContinueWatchingInfo }}>
      {children}
    </ContinueWatchingContext.Provider>
  );
};
