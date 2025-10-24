import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Anime } from '../types';
import { useAuth } from '../hooks/useAuth';

interface WatchLaterContextType {
  watchLaterList: Anime[];
  addToWatchLater: (anime: Anime) => void;
  removeFromWatchLater: (animeId: number) => void;
  isInWatchLater: (animeId: number) => boolean;
}

export const WatchLaterContext = createContext<WatchLaterContextType | undefined>(undefined);

interface WatchLaterProviderProps {
  children: ReactNode;
}

export const WatchLaterProvider: React.FC<WatchLaterProviderProps> = ({ children }) => {
  const [watchLaterList, setWatchLaterList] = useState<Anime[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedList = localStorage.getItem(`watch-later-${user.username}`);
        if (storedList) {
          setWatchLaterList(JSON.parse(storedList));
        } else {
          setWatchLaterList([]);
        }
      } catch (error) {
        console.error("Failed to parse watch later list from localStorage", error);
        setWatchLaterList([]);
      }
    } else {
      setWatchLaterList([]);
    }
  }, [user]);

  const persistList = (list: Anime[]) => {
    if (user) {
      localStorage.setItem(`watch-later-${user.username}`, JSON.stringify(list));
    }
  };

  const addToWatchLater = (anime: Anime) => {
    setWatchLaterList(prevList => {
      if (prevList.some(item => item.id === anime.id)) {
        return prevList;
      }
      const newList = [...prevList, anime];
      persistList(newList);
      return newList;
    });
  };

  const removeFromWatchLater = (animeId: number) => {
    setWatchLaterList(prevList => {
      const newList = prevList.filter(item => item.id !== animeId);
      persistList(newList);
      return newList;
    });
  };

  const isInWatchLater = useCallback((animeId: number) => {
    return watchLaterList.some(item => item.id === animeId);
  }, [watchLaterList]);

  return (
    <WatchLaterContext.Provider value={{ watchLaterList, addToWatchLater, removeFromWatchLater, isInWatchLater }}>
      {children}
    </WatchLaterContext.Provider>
  );
};
