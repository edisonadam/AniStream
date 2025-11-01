import React from 'react';
import { ChevronLeftIcon } from './icons/Icons';

interface CurrencyPageProps {
  onGoBack: () => void;
}

const CurrencyPage: React.FC<CurrencyPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <h1 className="text-4xl font-bold text-center mb-2 text-[rgb(var(--color-primary-accent))]">💎 AniTokens</h1>
        <p className="text-center text-lg text-[rgb(var(--text-muted))] mb-8">Your Community Currency</p>

        <div className="space-y-6 text-[rgb(var(--text-secondary))]">
          <div>
            <h2 className="text-2xl font-bold mb-3 text-[rgb(var(--text-primary))]">What are AniTokens?</h2>
            <p>AniTokens (AniTK) are the official currency of the ANISTREAM community. You earn them by being an active and positive member of the community. Think of them as a measure of your contribution and engagement!</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-[rgb(var(--text-primary))]">How to Earn AniTokens</h2>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Post a Comment:</strong> Earn <span className="font-bold text-yellow-400">600 AniTK</span> for every comment you post on an anime episode.</li>
              <li><strong>Community Events:</strong> Participate in special events and contests to win large sums of AniTK.</li>
              <li><strong>Coming Soon:</strong> Daily login bonuses, watching anime, rating shows, and more!</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-[rgb(var(--text-primary))]">How to Spend AniTokens</h2>
             <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Create a Club:</strong> It costs <span className="font-bold text-yellow-400">50,000 AniTK</span> to found your own community club. A small price for building a new home for fans!</li>
              <li><strong>Coming Soon:</strong> Purchase custom profile badges, unique comment flairs, special theme colors, and enter exclusive giveaways.</li>
            </ul>
          </div>
          
           <div className="pt-6 border-t border-white/10 text-center">
             <p className="text-sm text-[rgb(var(--text-muted))]">The AniTokens system is still in beta. Values and features are subject to change. Happy commenting!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyPage;
