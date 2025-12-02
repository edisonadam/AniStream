
import React from 'react';
import { ChevronLeftIcon, VerifiedIcon, LevelUpIcon } from './icons/Icons';
import { LEVEL_DATA } from '../constants';

interface LeaderboardsPageProps {
  onGoBack: () => void;
}

const LeaderboardsPage: React.FC<LeaderboardsPageProps> = ({ onGoBack }) => {
  // Mock data since we can't query all users in this demo
  const mockUsers = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      username: `User_${Math.floor(Math.random() * 10000)}`,
      avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${i}`,
      aniTokens: Math.floor(Math.random() * 500000) + 10000,
      isVerified: i < 3,
  })).sort((a, b) => b.aniTokens - a.aniTokens);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[rgb(var(--color-primary-accent))] mb-2">Community Leaderboards</h1>
        <p className="text-lg text-[rgb(var(--text-muted))]">Top contributors and token holders</p>
      </div>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><LevelUpIcon className="w-6 h-6 text-yellow-400"/> Top AniToken Holders</h2>
              <span className="text-xs text-[rgb(var(--text-muted))]">Updated daily</span>
          </div>
          <div>
              {mockUsers.map((user, index) => {
                  const level = Math.floor(user.aniTokens / 60000);
                  const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-[rgb(var(--text-muted))]';
                  
                  return (
                      <div key={user.id} className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-[rgb(var(--surface-3))] transition-colors">
                          <span className={`text-2xl font-bold w-8 text-center ${rankColor}`}>{index + 1}</span>
                          <div className="relative">
                              <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full" />
                              {user.isVerified && <VerifiedIcon className="w-4 h-4 text-blue-400 absolute -bottom-1 -right-1" />}
                          </div>
                          <div className="flex-1">
                              <p className="font-bold text-[rgb(var(--text-primary))]">{user.username}</p>
                              <p className="text-xs text-[rgb(var(--text-muted))]">Level {level}</p>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-[rgb(var(--color-primary-accent))]">{user.aniTokens.toLocaleString()}</p>
                              <p className="text-xs text-[rgb(var(--text-muted))]">AniTK</p>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;
