import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Anime } from '../types';
import { useAuth } from '../hooks/useAuth';

interface WatchlistContextType {
  watchlist: Anime[];
  addToWatchlist: (anime: Anime) => void;
  removeFromWatchlist: (animeId: number) => void;
  isInWatchlist: (animeId: number) => boolean;
  overwriteWatchlist: (animeList: Anime[]) => void;
}

export const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<Anime[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedList = localStorage.getItem(`watchlist-${user.username}`);
        if (storedList) {
          setWatchlist(JSON.parse(storedList));
        } else {
          setWatchlist([]);
        }
      } catch (error) {
        console.error("Failed to parse watchlist from localStorage", error);
        setWatchlist([]);
      }
    } else {
      setWatchlist([]);
    }
  }, [user]);

  const persistList = (list: Anime[]) => {
    if (user) {
      localStorage.setItem(`watchlist-${user.username}`, JSON.stringify(list));
    }
  };

  const addToWatchlist = (anime: Anime) => {
    setWatchlist(prevList => {
      if (prevList.some(item => item.id === anime.id)) {
        return prevList;
      }
      const newList = [...prevList, anime];
      persistList(newList);
      return newList;
    });
  };

  const removeFromWatchlist = (animeId: number) => {
    setWatchlist(prevList => {
      const newList = prevList.filter(item => item.id !== animeId);
      persistList(newList);
      return newList;
    });
  };

  const isInWatchlist = useCallback((animeId: number) => {
    return watchlist.some(item => item.id === animeId);
  }, [watchlist]);

  const overwriteWatchlist = (animeList: Anime[]) => {
    setWatchlist(animeList);
    persistList(animeList);
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, overwriteWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};