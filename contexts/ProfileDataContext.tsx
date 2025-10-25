import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ViewingHistoryItem, Rating, Anime } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ProfileDataContextType {
  history: ViewingHistoryItem[];
  ratings: Rating[];
  logToHistory: (anime: Anime) => void;
  rateAnime: (animeId: number, rating: number) => void;
  getRating: (animeId: number) => number | null;
  clearHistory: () => void;
}

export const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);

interface ProfileDataProviderProps {
  children: ReactNode;
}

export const ProfileDataProvider: React.FC<ProfileDataProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<ViewingHistoryItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedHistory = localStorage.getItem(`history-${user.username}`);
        const storedRatings = localStorage.getItem(`ratings-${user.username}`);
        setHistory(storedHistory ? JSON.parse(storedHistory) : []);
        setRatings(storedRatings ? JSON.parse(storedRatings) : []);
      } catch (e) {
        console.error("Failed to load profile data", e);
        setHistory([]);
        setRatings([]);
      }
    } else {
      // Clear data on logout
      setHistory([]);
      setRatings([]);
    }
  }, [user]);

  const persistHistory = useCallback((list: ViewingHistoryItem[]) => {
    if (user) localStorage.setItem(`history-${user.username}`, JSON.stringify(list));
  }, [user]);

  const persistRatings = useCallback((list: Rating[]) => {
    if (user) localStorage.setItem(`ratings-${user.username}`, JSON.stringify(list));
  }, [user]);
  
  const logToHistory = useCallback((anime: Anime) => {
    if (!user) return;
    setHistory(prev => {
      const newList = prev.filter(item => item.animeId !== anime.id);
      const newItem: ViewingHistoryItem = { animeId: anime.id, timestamp: Date.now() };
      const updatedList = [newItem, ...newList].slice(0, 50); // Keep history to 50 items
      persistHistory(updatedList);
      return updatedList;
    });
  }, [user, persistHistory]);
  
  const clearHistory = useCallback(() => {
      if (!user) return;
      setHistory([]);
      localStorage.removeItem(`history-${user.username}`);
  }, [user]);

  const rateAnime = useCallback((animeId: number, rating: number) => {
    if (!user) return;
    setRatings(prev => {
      const newList = prev.filter(item => item.animeId !== animeId);
      const newItem: Rating = { animeId, rating };
      const updatedList = [newItem, ...newList];
      persistRatings(updatedList);
      return updatedList;
    });
  }, [user, persistRatings]);

  const getRating = useCallback((animeId: number) => {
    const found = ratings.find(r => r.animeId === animeId);
    return found ? found.rating : null;
  }, [ratings]);

  return (
    <ProfileDataContext.Provider value={{ history, ratings, logToHistory, rateAnime, getRating, clearHistory }}>
      {children}
    </ProfileDataContext.Provider>
  );
};