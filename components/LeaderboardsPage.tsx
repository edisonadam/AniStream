import React from 'react';
import { ChevronLeftIcon } from './icons/Icons';

interface LeaderboardsPageProps {
  onGoBack: () => void;
}

const LeaderboardsPage: React.FC<LeaderboardsPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-[rgb(var(--color-primary-accent))]">Leaderboards</h1>
        <p className="text-lg text-[rgb(var(--text-muted))] mt-4">Coming Soon!</p>
      </div>
    </div>
  );
};

export default LeaderboardsPage;