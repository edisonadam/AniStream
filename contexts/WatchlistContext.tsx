import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Anime, WatchlistStatus } from '../types';
import { useAuth } from '../hooks/useAuth';

interface WatchlistContextType {
  watchlist: Anime[];
  watchlistStatuses: Record<number, WatchlistStatus>;
  addToWatchlist: (anime: Anime, status?: WatchlistStatus) => void;
  removeFromWatchlist: (animeId: number) => void;
  updateWatchlistStatus: (animeId: number, status: WatchlistStatus) => void;
  isInWatchlist: (animeId: number) => boolean;
  getWatchlistStatus: (animeId: number) => WatchlistStatus | null;
  overwriteWatchlist: (animeList: Anime[]) => void;
}

export const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider: React.FC<WatchlistProviderProps> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<Anime[]>([]);
  const [watchlistStatuses, setWatchlistStatuses] = useState<Record<number, WatchlistStatus>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedList = localStorage.getItem(`watchlist-${user.uid}`);
        const storedStatuses = localStorage.getItem(`watchlist-statuses-${user.uid}`);
        if (storedList) setWatchlist(JSON.parse(storedList)); else setWatchlist([]);
        if (storedStatuses) setWatchlistStatuses(JSON.parse(storedStatuses)); else setWatchlistStatuses({});
      } catch (error) {
        console.error("Failed to parse watchlist from localStorage", error);
        setWatchlist([]);
        setWatchlistStatuses({});
      }
    } else {
      setWatchlist([]);
      setWatchlistStatuses({});
    }
  }, [user]);

  const persistList = (list: Anime[]) => {
    if (user) localStorage.setItem(`watchlist-${user.uid}`, JSON.stringify(list));
  };
  
  const persistStatuses = (statuses: Record<number, WatchlistStatus>) => {
      if (user) localStorage.setItem(`watchlist-statuses-${user.uid}`, JSON.stringify(statuses));
  };

  const addToWatchlist = (anime: Anime, status: WatchlistStatus = 'Plan to Watch') => {
    setWatchlist(prevList => {
      if (prevList.some(item => item.id === anime.id)) {
        // If it's already in the list, just update the status
        updateWatchlistStatus(anime.id, status);
        return prevList;
      }
      const newList = [...prevList, anime];
      persistList(newList);
      updateWatchlistStatus(anime.id, status);
      return newList;
    });
  };

  const removeFromWatchlist = (animeId: number) => {
    setWatchlist(prevList => {
      const newList = prevList.filter(item => item.id !== animeId);
      persistList(newList);
      return newList;
    });
    setWatchlistStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses };
        delete newStatuses[animeId];
        persistStatuses(newStatuses);
        return newStatuses;
    });
  };
  
  const updateWatchlistStatus = (animeId: number, status: WatchlistStatus) => {
      setWatchlistStatuses(prevStatuses => {
          const newStatuses = { ...prevStatuses, [animeId]: status };
          persistStatuses(newStatuses);
          return newStatuses;
      });
  };

  const isInWatchlist = useCallback((animeId: number) => {
    return watchlist.some(item => item.id === animeId);
  }, [watchlist]);
  
  const getWatchlistStatus = useCallback((animeId: number) => {
      return watchlistStatuses[animeId] || null;
  }, [watchlistStatuses]);

  const overwriteWatchlist = (animeList: Anime[]) => {
    setWatchlist(animeList);
    persistList(animeList);
    // When overwriting, default all to "Plan to Watch"
    const newStatuses: Record<number, WatchlistStatus> = {};
    animeList.forEach(anime => {
        newStatuses[anime.id] = 'Plan to Watch';
    });
    setWatchlistStatuses(newStatuses);
    persistStatuses(newStatuses);
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, watchlistStatuses, addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlistStatus, updateWatchlistStatus, overwriteWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};