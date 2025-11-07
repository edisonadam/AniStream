import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface FavoritesContextType {
  favorites: number[];
  addFavorite: (animeId: number, animeTitle: string) => void;
  removeFavorite: (animeId: number, animeTitle: string) => void;
  isFavorite: (animeId: number) => boolean;
  overwriteFavorites: (animeIds: number[]) => void;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      try {
        const storedFavorites = localStorage.getItem(`favorites-${user.uid}`);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        } else {
          setFavorites([]);
        }
      } catch (e) {
        console.error("Failed to load favorites from localStorage", e);
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, [user]);

  const persistFavorites = useCallback((favs: number[]) => {
    if (user) {
      localStorage.setItem(`favorites-${user.uid}`, JSON.stringify(favs));
    }
  }, [user]);

  const addFavorite = useCallback((animeId: number, animeTitle: string) => {
    setFavorites(prev => {
      if (prev.includes(animeId)) return prev;
      const newFavs = [...prev, animeId];
      persistFavorites(newFavs);
      addToast(`Added "${animeTitle}" to Favorites`, 'favorite');
      return newFavs;
    });
  }, [persistFavorites, addToast]);

  const removeFavorite = useCallback((animeId: number, animeTitle: string) => {
    setFavorites(prev => {
      const newFavs = prev.filter(id => id !== animeId);
      persistFavorites(newFavs);
      addToast(`Removed "${animeTitle}" from Favorites`, 'unfavorite');
      return newFavs;
    });
  }, [persistFavorites, addToast]);

  const isFavorite = useCallback((animeId: number) => {
    return favorites.includes(animeId);
  }, [favorites]);

  const overwriteFavorites = useCallback((animeIds: number[]) => {
    setFavorites(animeIds);
    persistFavorites(animeIds);
  }, [persistFavorites]);

  const value = { favorites, addFavorite, removeFavorite, isFavorite, overwriteFavorites };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};