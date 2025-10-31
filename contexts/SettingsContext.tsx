import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Settings, Theme, ColorPreset } from '../types';

const defaultSettings: Settings = {
  theme: 'dark',
  colorPreset: 'violet-fusion',
  autoplayNext: true,
  autoSkipIntro: false,
  autoSkipOutro: false,
  videoServer: 'kiwi',
  vidsrcDomain: 'vsrc.su',
  forceDesktopMode: false,
  episodeViewStyle: 'auto',
  blurEpisodeThumbnails: true,
  restrictAdultContent: true,
  displayTitleLanguage: 'english',
  malUsername: '',
  // New settings defaults from master prompt
  autoSyncAniList: false,
  syncThreshold: 80,
  hideSpoilers: false,
  borderRadius: 50, // 50%
  showWatchHistoryOnHome: true,
  cardLayout: 'classic',
  cardSize: 'medium',
  characterNameLanguage: 'romaji',
  showComments: true,
  defaultLanguage: 'sub',
  forceMaxQuality: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  restoreDefaults: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('anistream-settings');
      if (storedSettings) {
        // Merge stored settings with defaults to ensure new settings are applied
        const parsed = JSON.parse(storedSettings);
        // Delete legacy setting if it exists
        if (parsed.primaryAccentColor) {
          delete parsed.primaryAccentColor;
        }
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
  }, []);

  useEffect(() => {
    // Apply theme, color preset, and custom styles to the root element
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-color-preset', settings.colorPreset);
    
    // Apply dynamic styles for border radius
    root.style.setProperty('--border-radius-multiplier', (settings.borderRadius / 50).toString());

    // Persist settings to localStorage
    try {
      localStorage.setItem('anistream-settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings to localStorage", e);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const restoreDefaults = useCallback(() => {
    if (window.confirm("Are you sure you want to restore all settings to their default values?")) {
        setSettings(defaultSettings);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, restoreDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
};