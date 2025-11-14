import React from 'react';
import { ChevronLeftIcon, ExclamationTriangleIcon } from './icons/Icons';

interface ErrorsPageProps {
  onGoBack: () => void;
}

const ErrorItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[rgb(var(--surface-3))/0.4] p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-[rgb(var(--color-primary-accent))] mb-3">{title}</h3>
        <div className="space-y-2 text-[rgb(var(--text-secondary))]">{children}</div>
    </div>
);

const ErrorsPage: React.FC<ErrorsPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <div className="text-center mb-8">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-[rgb(var(--color-primary-accent))]" />
            <h1 className="text-4xl font-bold mt-4 text-[rgb(var(--text-primary))]">Common Errors & Solutions</h1>
            <p className="text-lg text-[rgb(var(--text-muted))] mt-2">Having trouble? Here are some common issues and how to fix them.</p>
        </div>
        
        <div className="space-y-8">
          <ErrorItem title="Video Player Not Loading or Shows an Error">
            <p>This is often caused by an issue with the video source. Our player tries multiple servers automatically, but sometimes they all fail.</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Try a different server:</strong> In the player settings (gear icon), manually select a different server.</li>
                <li><strong>Disable Adblockers:</strong> Some adblockers or browser extensions can interfere with video playback. Try disabling them for this site.</li>
                <li><strong>Clear your cache:</strong> Sometimes old data can cause problems. Try a hard refresh (Ctrl+Shift+R) or clearing your browser's cache.</li>
            </ul>
          </ErrorItem>

          <ErrorItem title="Login/Authentication Issues">
            <p>If you're having trouble logging in or signing up, it could be a few things.</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>'Component auth has not been registered yet':</strong> This is a known development bug related to hot-reloading. A simple page refresh usually fixes it.</li>
                <li><strong>'Account exists with different credential':</strong> This means you've tried to sign up with Google/another method, but an account with that email already exists. Please log in with your original method (e.g., email/password) to link your accounts.</li>
                <li><strong>Password Reset:</strong> If you forgot your password, use the 'Forgot Password' link on the login screen.</li>
            </ul>
          </ErrorItem>
          
          <ErrorItem title="Watchlist/History Not Syncing">
             <p>Syncing issues can sometimes occur with external services like MyAnimeList or AniList.</p>
             <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Reconnect Account:</strong> Go to your Profile/Settings page and try disconnecting and reconnecting your MAL/AniList account.</li>
                <li><strong>Check Username:</strong> Ensure your username is spelled correctly in the settings.</li>
                <li><strong>API Issues:</strong> Occasionally, the external APIs themselves may be down or slow. Please try again later.</li>
             </ul>
          </ErrorItem>

           <div className="pt-6 border-t border-white/10 text-center">
             <p className="text-md text-[rgb(var(--text-muted))]">Still having issues? Reach out to us via the <strong>Feedback</strong> link in the sidebar or footer.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorsPage;