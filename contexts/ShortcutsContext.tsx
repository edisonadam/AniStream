import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Shortcuts, ShortcutAction } from '../types';
import { defaultShortcuts } from '../constants';

const SHORTCUTS_STORAGE_KEY = 'user_shortcuts';

interface ShortcutsContextType {
  shortcuts: Shortcuts;
  saveShortcuts: (newShortcuts: Shortcuts) => void;
  resetShortcuts: () => void;
}

export const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export const ShortcutsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<Shortcuts>(() => {
    try {
      const storedShortcuts = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (storedShortcuts) {
        return { ...defaultShortcuts, ...JSON.parse(storedShortcuts) };
      }
    } catch (error) {
      console.error('Failed to load shortcuts from localStorage:', error);
    }
    return defaultShortcuts;
  });

  const saveShortcuts = useCallback((newShortcuts: Shortcuts) => {
    try {
      setShortcuts(newShortcuts);
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newShortcuts));
    } catch (error) {
      console.error('Failed to save shortcuts to localStorage:', error);
    }
  }, []);

  const resetShortcuts = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all shortcuts to their default values?")) {
        saveShortcuts(defaultShortcuts);
    }
  }, [saveShortcuts]);

  const value = {
    shortcuts,
    saveShortcuts,
    resetShortcuts,
  };

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
    </ShortcutsContext.Provider>
  );
};