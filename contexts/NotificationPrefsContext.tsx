import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { NotificationPrefs } from '../types';
import { useAuth } from '../hooks/useAuth';

export type NotificationPrefsMap = Record<number, Partial<NotificationPrefs>>;

interface NotificationPrefsContextType {
  prefs: NotificationPrefsMap;
  updatePref: (animeId: number, newPrefs: Partial<NotificationPrefs>) => void;
  getPrefsForAnime: (animeId: number) => NotificationPrefs;
}

export const NotificationPrefsContext = createContext<NotificationPrefsContextType | undefined>(undefined);

export const NotificationPrefsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<NotificationPrefsMap>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedPrefs = localStorage.getItem(`notification-prefs-${user.uid}`);
        if (storedPrefs) {
          setPrefs(JSON.parse(storedPrefs));
        }
      } catch (e) {
        console.error("Failed to load notification preferences", e);
      }
    } else {
      setPrefs({});
    }
  }, [user]);

  const persistPrefs = useCallback((newPrefs: NotificationPrefsMap) => {
    if (user) {
      localStorage.setItem(`notification-prefs-${user.uid}`, JSON.stringify(newPrefs));
    }
  }, [user]);

  const updatePref = useCallback((animeId: number, newPrefs: Partial<NotificationPrefs>) => {
    setPrefs(prev => {
      const updatedPrefs = {
        ...prev,
        [animeId]: {
          ...(prev[animeId] || {}),
          ...newPrefs,
        },
      };
      persistPrefs(updatedPrefs);
      return updatedPrefs;
    });
  }, [persistPrefs]);

  const getPrefsForAnime = useCallback((animeId: number): NotificationPrefs => {
    const defaultPrefs: NotificationPrefs = { newEpisode: false, newDub: false };
    return {
      ...defaultPrefs,
      ...(prefs[animeId] || {}),
    };
  }, [prefs]);

  return (
    <NotificationPrefsContext.Provider value={{ prefs, updatePref, getPrefsForAnime }}>
      {children}
    </NotificationPrefsContext.Provider>
  );
};