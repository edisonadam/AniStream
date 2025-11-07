import React from 'react';
import { ChevronLeftIcon, BookmarkIcon, HeartIcon, BellIcon, CalendarIcon, RefreshCwIcon, PlayIcon, StarIcon, UsersIcon } from './icons/Icons';

interface HowToUsePageProps {
  onGoBack: () => void;
}

const FeatureItem: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-[rgb(var(--surface-3))/0.4] p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-[rgb(var(--color-primary-accent))] mb-3 flex items-center gap-3">{icon}{title}</h3>
        <div className="space-y-2 text-[rgb(var(--text-secondary))]">{children}</div>
    </div>
);

const HowToUsePage: React.FC<HowToUsePageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <h1 className="text-4xl font-bold text-center mb-6 text-[rgb(var(--color-primary-accent))]">How to Use ANISTREAM</h1>
        <p className="text-center text-lg text-[rgb(var(--text-muted))] mb-8">A quick guide to getting the most out of your anime experience.</p>

        <div className="space-y-8">
            <FeatureItem title="The Player & Interface" icon={<PlayIcon className="w-6 h-6"/>}>
                <p>Our player is packed with features! Use the gear icon to change servers and quality. You can also enable Picture-in-Picture (PiP), enter Focus Mode for an immersive overlay, or go fullscreen.</p>
                <p>Use the sidepanel (hamburger icon) to filter anime by genre, type, year, and more. Your selections are applied instantly to the main grid.</p>
            </FeatureItem>
            
            <FeatureItem title="Managing Your Lists" icon={<BookmarkIcon className="w-6 h-6"/>}>
                <p>
                    <strong>Watchlist:</strong> Use this for shows you are actively watching or plan to watch. You can set statuses like 'Watching', 'Completed', 'On-Hold', etc.
                </p>
                <p>
                    <strong><HeartIcon className="w-5 h-5 inline-block text-red-400"/> Favorites:</strong> This is a special list for your absolute favorite anime. Adding an anime here helps us recommend better content to you in the future.
                </p>
                 <p>You can add to either list by hovering over an anime card and using the menu, or from the buttons on the player page.</p>
            </FeatureItem>

            <FeatureItem title="Notifications" icon={<BellIcon className="w-6 h-6"/>}>
                <p>Enable browser notifications in your Profile/Settings page to get alerts when someone replies to your comment or a friend shares an anime with you. You'll see unread notifications on the bell icon in the header.</p>
            </FeatureItem>
            
            <FeatureItem title="Discovering New Anime" icon={<StarIcon className="w-6 h-6"/>}>
                <p>
                    <strong>Trending & Top 100:</strong> Find what's popular right now on the homepage or dive into the all-time best shows on the Top 100 page.
                </p>
                 <p>
                    <strong><CalendarIcon className="w-5 h-5 inline-block"/> Schedule:</strong> Check the Schedule page to see what's airing this season, or browse archives from previous years.
                </p>
                 <p>
                    <strong><UsersIcon className="w-5 h-5 inline-block"/> Community:</strong> See what the community is watching and talking about in the Community Hub to find hidden gems.
                </p>
            </FeatureItem>
            
             <FeatureItem title="Sync with MAL & AniList" icon={<RefreshCwIcon className="w-6 h-6"/>}>
                <p>
                    Connect your MyAnimeList or AniList accounts in your Profile/Settings page. Just enter your username (and token for AniList) to get started.
                </p>
                 <p>
                    You can import your existing lists to quickly populate your ANISTREAM watchlist. Enable 'Auto Sync' to automatically update your progress on MAL/AniList as you watch episodes here.
                </p>
            </FeatureItem>

        </div>
      </div>
    </div>
  );
};

export default HowToUsePage;