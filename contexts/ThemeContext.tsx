import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'dark-neon' | 'dark-light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark-neon');

  useEffect(() => {
    const storedTheme = localStorage.getItem('anistream-theme') as Theme | null;
    if (storedTheme && ['dark-neon', 'dark-light'].includes(storedTheme)) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark-light') {
      root.classList.add('theme-dark-light');
    } else {
      root.classList.remove('theme-dark-light');
    }
    localStorage.setItem('anistream-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'dark-neon' ? 'dark-light' : 'dark-neon'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
