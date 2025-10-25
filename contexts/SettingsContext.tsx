import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Settings, Theme, ColorPreset } from '../types';

const defaultSettings: Settings = {
  theme: 'dark',
  colorPreset: 'neon-purple',
  autoplay: true,
  videoServer: 'vidsrc',
  vidsrcDomain: 'vsrc.su',
  subtitleLanguage: 'en',
  preferDub: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
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
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
  }, []);

  useEffect(() => {
    // Apply theme and color preset to the root element
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-color-preset', settings.colorPreset);
    
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};