import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Settings, Theme, ColorPreset } from '../types';

const defaultSettings: Settings = {
  theme: 'dark',
  colorPreset: 'abyssal-blue',
  autoplayNext: true,
  autoSkipIntro: false,
  autoSkipOutro: false,
  videoServer: 'kiwi',
  blurEpisodeThumbnails: true,
  restrictAdultContent: true,
  displayTitleLanguage: 'english',
  malUsername: '',
  anilistUsername: '',
  anilistToken: '',
  autoSyncAniList: false,
  hideSpoilers: false,
  showWatchHistoryOnHome: true,
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
        const parsed = JSON.parse(storedSettings);
        
        // Clean up legacy settings
        const legacyKeys = ['primaryAccentColor', 'forceDesktopMode', 'cardLayout', 'cardSize', 'characterNameLanguage', 'syncThreshold', 'borderRadius', 'vidsrcDomain', 'episodeViewStyle'];
        legacyKeys.forEach(key => delete parsed[key]);
        
        // Merge stored settings with defaults to ensure new settings are applied
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-color-preset', settings.colorPreset);
    
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