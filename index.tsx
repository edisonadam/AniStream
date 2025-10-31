import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { WatchProgressProvider } from './contexts/WatchProgressContext';
import { ProfileDataProvider } from './contexts/ProfileDataContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// AppWrapper is used to fetch data that a provider needs.
// This is a common pattern to avoid having a provider depend on a child component.
const AppWrapper = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <WatchlistProvider>
          <WatchProgressProvider>
            <ProfileDataProvider>
              <App />
            </ProfileDataProvider>
          </WatchProgressProvider>
        </WatchlistProvider>
      </AuthProvider>
    </SettingsProvider>
  );
};


root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.transition = 'opacity 0.5s ease';
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500); // Must match transition duration
  }
});
