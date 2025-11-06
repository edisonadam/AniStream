import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { WatchProgressProvider } from './contexts/WatchProgressContext';
import { ProfileDataProvider } from './contexts/ProfileDataContext';
import { ShortcutsProvider } from './contexts/ShortcutsContext';
import { FloatingPlayerProvider } from './contexts/FloatingPlayerContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// AppWrapper is used to fetch data that a provider needs.
// This is a common pattern to avoid having a provider depend on a child component.
const AppWrapper = () => {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <WatchlistProvider>
            <FavoritesProvider>
              <WatchProgressProvider>
                <ProfileDataProvider>
                  <ShortcutsProvider>
                    <FloatingPlayerProvider>
                      <App />
                    </FloatingPlayerProvider>
                  </ShortcutsProvider>
                </ProfileDataProvider>
              </WatchProgressProvider>
            </FavoritesProvider>
          </WatchlistProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
};


root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);