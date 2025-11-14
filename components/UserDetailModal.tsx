import React from 'react';
import { CloseIcon, VerifiedIcon } from './icons/Icons';
import type { User } from '../types';
import { LEVEL_DATA, MAX_LEVEL_TOKENS } from '../constants';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../hooks/useAuth';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  const { user: currentUser } = useAuth();
  const { blockUser, unblockUser, isUserBlocked } = useProfileData();
  const isBlocked = isUserBlocked(user.uid);

  // Mock data for demonstration as we can't fetch other users' private data
  const commentCount = Math.floor(Math.random() * 500);
  const totalAniTokens = commentCount * 600;
  const currentLevel = Math.floor(totalAniTokens / 60000);
  const currentLevelData = LEVEL_DATA.slice().reverse().find(l => l.level <= currentLevel) || LEVEL_DATA[0];
  const nextLevelData = LEVEL_DATA.find(l => l.level > currentLevel);
  
  const tokensForCurrentLevel = currentLevelData.tokens;
  const tokensForNextLevel = nextLevelData?.tokens || MAX_LEVEL_TOKENS;

  const progressToNextLevel = totalAniTokens - tokensForCurrentLevel;
  const rangeForNextLevel = tokensForNextLevel - tokensForCurrentLevel;
  const percentToNext = rangeForNextLevel > 0 ? (progressToNextLevel / rangeForNextLevel) * 100 : 100;

  const handleBlockToggle = () => {
    if (isBlocked) {
        unblockUser(user.uid);
    } else {
        if (window.confirm(`Are you sure you want to block ${user.username}? You will no longer see their comments, posts, or receive notifications from them.`)) {
            blockUser(user);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
      <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-[90%] max-w-sm m-4 p-6 relative animate-modal-pop-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
        
        <div className="flex flex-col items-center">
            <div className="relative">
                <img loading="lazy" src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full mb-4 ring-4 ring-[rgb(var(--color-primary))]/50" />
                {user.isVerified && <VerifiedIcon className="w-8 h-8 text-blue-400 absolute -bottom-2 -right-2" />}
            </div>
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-sm text-[rgb(var(--text-muted))]">Joined: {new Date(user.joinedDate).toLocaleDateString()}</p>
        </div>

        <div className="mt-6 space-y-4">
            <div>
                <div className="flex justify-between items-end mb-1">
                    <h3 className="font-bold text-[rgb(var(--color-primary-accent))]">{currentLevelData.name} - LVL {currentLevel}</h3>
                    {nextLevelData && <span className="text-xs font-semibold text-[rgb(var(--text-muted))]">Next: LVL {nextLevelData.level}</span>}
                </div>
                <div className="relative w-full bg-[rgb(var(--surface-3))] rounded-full h-4 border-2 border-black/20 overflow-hidden">
                    <div className="relative h-full bg-gradient-to-r from-[rgb(var(--color-primary-hover))] to-[rgb(var(--color-primary-accent))] rounded-full transition-all duration-500" style={{ width: `${percentToNext}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white text-shadow-lg">{totalAniTokens.toLocaleString()} / {tokensForNextLevel.toLocaleString()} AniTK</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center pt-4 border-t border-white/10">
                <div>
                    <p className="text-xl font-bold">{commentCount}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Comments</p>
                </div>
                 <div>
                    <p className="text-xl font-bold">{totalAniTokens.toLocaleString()} AniTK</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Total AniTokens</p>
                </div>
            </div>

            {currentUser && currentUser.uid !== user.uid && (
                <div className="pt-4 border-t border-white/10">
                    <button onClick={handleBlockToggle} className={`w-full py-2 rounded-lg font-semibold transition-colors ${isBlocked ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                        {isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default UserDetailModal;