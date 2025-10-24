import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WatchLaterProvider } from './contexts/WatchLaterContext';
import { ContinueWatchingProvider } from './contexts/ContinueWatchingContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// AppWrapper is used to fetch data that a provider needs.
// This is a common pattern to avoid having a provider depend on a child component.
const AppWrapper = () => {
  return (
    <AuthProvider>
      <WatchLaterProvider>
        <App />
      </WatchLaterProvider>
    </AuthProvider>
  );
};


root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
