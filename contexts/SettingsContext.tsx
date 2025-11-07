import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Settings, Theme, ColorPreset } from '../types';

const defaultSettings: Settings = {
  theme: 'dark',
  colorPreset: 'abyssal-blue',
  videoServer: 'vidembed',
  blurEpisodeThumbnails: true,
  restrictAdultContent: true,
  displayTitleLanguage: 'english',
  malUsername: '',
  autoSyncMal: false,
  anilistUsername: '',
  anilistToken: '',
  autoSyncAniList: false,
  showWatchHistoryOnHome: true,
  showComments: true,
  defaultLanguage: 'sub',
  loadMoreMode: 'manual',
  hideFillerEpisodes: false,
  rememberVolume: true,
  rememberPlaybackSpeed: false,
  showSeekThumbnails: false,
  playerFocusMode: 'overlay',
  forceDesktopMode: false,
  emailNotifications: true,
  inAppToastAlerts: true,
  malSyncAlerts: true,
  autoMarkAsRead: false,
  // New & updated settings
  homepageTrailer: true,
  autoPlay: true,
  autoSkip: false,
  startMuted: false,
  videoLoadStrategy: 'idle',
  showNewEpisodeBadges: true,
  lightsOffMode: false,
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
        const legacyKeys = ['primaryAccentColor', 'forceDesktopMode', 'cardLayout', 'cardSize', 'characterNameLanguage', 'syncThreshold', 'borderRadius', 'vidsrcDomain', 'episodeViewStyle', 'hideSpoilers', 'forceMaxQuality', 'autoplayNext', 'autoSkipIntro', 'autoSkipOutro'];
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

    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      if (settings.forceDesktopMode) {
        viewport.setAttribute('content', 'width=1280');
      } else {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    }
    
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
    setSettings(defaultSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, restoreDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
};