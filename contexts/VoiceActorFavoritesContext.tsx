import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { FavoriteVoiceActor } from '../types';

interface VoiceActorFavoritesContextType {
  favorites: FavoriteVoiceActor[];
  addFavorite: (actor: FavoriteVoiceActor) => void;
  removeFavorite: (actorId: number, actorName: string) => void;
  isFavorite: (actorId: number) => boolean;
}

export const VoiceActorFavoritesContext = createContext<VoiceActorFavoritesContextType | undefined>(undefined);

export const VoiceActorFavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteVoiceActor[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`va-favorites-${user.uid}`);
        if (stored) setFavorites(JSON.parse(stored));
        else setFavorites([]);
      } catch (e) {
        console.error("Failed to load VA favorites", e);
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, [user]);

  const persist = useCallback((favs: FavoriteVoiceActor[]) => {
    if (user) localStorage.setItem(`va-favorites-${user.uid}`, JSON.stringify(favs));
  }, [user]);

  const addFavorite = useCallback((actor: FavoriteVoiceActor) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === actor.id)) return prev;
      const newFavs = [...prev, actor];
      persist(newFavs);
      addToast(`Favorited ${actor.name}`, 'favorite');
      return newFavs;
    });
  }, [persist, addToast]);

  const removeFavorite = useCallback((actorId: number, actorName: string) => {
    setFavorites(prev => {
      const newFavs = prev.filter(f => f.id !== actorId);
      persist(newFavs);
      addToast(`Unfavorited ${actorName}`, 'unfavorite');
      return newFavs;
    });
  }, [persist, addToast]);

  const isFavorite = useCallback((actorId: number) => favorites.some(f => f.id === actorId), [favorites]);

  const value = { favorites, addFavorite, removeFavorite, isFavorite };

  return (
    <VoiceActorFavoritesContext.Provider value={value}>
      {children}
    </VoiceActorFavoritesContext.Provider>
  );
};
