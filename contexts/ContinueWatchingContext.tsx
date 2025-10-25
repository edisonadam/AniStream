import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ContinueWatchingInfo, Anime } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ContinueWatchingContextType {
  continueWatchingList: ContinueWatchingInfo[];
  updateProgress: (
    animeId: number, 
    currentSeason: number, 
    currentEpisode: number, 
    totalEpisodesInShow: number | null, 
    seasonEpisodeCounts: number[]
  ) => void;
}

export const ContinueWatchingContext = createContext<ContinueWatchingContextType | undefined>(undefined);

interface ContinueWatchingProviderProps {
  children: ReactNode;
  initialAnimeList: Anime[];
}

export const ContinueWatchingProvider: React.FC<ContinueWatchingProviderProps> = ({ children, initialAnimeList }) => {
  const [continueWatchingList, setContinueWatchingList] = useState<ContinueWatchingInfo[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storageKey = `continue-watching-${user.username}`;
        let storedList = localStorage.getItem(storageKey);
        
        if (!storedList && initialAnimeList.length > 2) {
            // Create mock data for new users
            const mockData: ContinueWatchingInfo[] = [
                { animeId: initialAnimeList[1].id, currentSeason: 1, currentEpisode: 5, progress: Math.round((5 / (initialAnimeList[1].totalEpisodes || 24)) * 100) },
                { animeId: initialAnimeList[2].id, currentSeason: 1, currentEpisode: 2, progress: Math.round((2 / (initialAnimeList[2].totalEpisodes || 12)) * 100) },
            ];
            storedList = JSON.stringify(mockData);
            localStorage.setItem(storageKey, storedList);
        }
        
        if (storedList) {
          setContinueWatchingList(JSON.parse(storedList));
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
  }, [user, initialAnimeList]);

  const updateProgress = useCallback((
    animeId: number, 
    currentSeason: number, 
    currentEpisode: number, 
    totalEpisodesInShow: number | null,
    seasonEpisodeCounts: number[]
  ) => {
    if (!user) return;
    
    setContinueWatchingList(prevList => {
      const newList = [...prevList];
      const existingIndex = newList.findIndex(item => item.animeId === animeId);
      
      const episodesInPreviousSeasons = seasonEpisodeCounts
        .slice(0, currentSeason - 1)
        .reduce((sum, count) => sum + count, 0);
      const overallEpisodeNumber = episodesInPreviousSeasons + currentEpisode;
      
      const progress = totalEpisodesInShow ? Math.min(100, Math.round((overallEpisodeNumber / totalEpisodesInShow) * 100)) : 0;

      const newItem = { animeId, currentSeason, currentEpisode, progress };

      if (existingIndex !== -1) {
        newList.splice(existingIndex, 1);
      }
      
      newList.unshift(newItem);

      // Keep the list from getting too long
      const limitedList = newList.slice(0, 10);
      localStorage.setItem(`continue-watching-${user.username}`, JSON.stringify(limitedList));
      return limitedList;
    });
  }, [user]);
  
  return (
    <ContinueWatchingContext.Provider value={{ continueWatchingList, updateProgress }}>
      {children}
    </ContinueWatchingContext.Provider>
  );
};