import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { countUserComments } from '../utils';
import { LEVEL_DATA, MAX_LEVEL_TOKENS } from '../constants';
import { ChevronLeftIcon, VerifiedIcon } from './icons/Icons';

interface CommentMeterPageProps {
  onGoBack: () => void;
  onLoginClick: () => void;
}

const CommentMeterPage: React.FC<CommentMeterPageProps> = ({ onGoBack, onLoginClick }) => {
    const { user, isLoggedIn } = useAuth();
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        if (user) {
            const count = countUserComments(user.uid);
            setCommentCount(count);
        }
    }, [user]);

    if (!isLoggedIn || !user) {
        return (
            <div className="container mx-auto text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Level Up</h2>
                <p className="text-[rgb(var(--text-muted))] mb-6">Log in to see your comment stats and level up!</p>
                <button onClick={onLoginClick} className="px-6 py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-bold hover:bg-[rgb(var(--color-primary-hover))]">
                    Log In
                </button>
            </div>
        );
    }

    const totalAniTokens = commentCount * 600;
    const currentLevel = Math.floor(totalAniTokens / 60000);
    const currentLevelData = LEVEL_DATA.slice().reverse().find(l => l.level <= currentLevel) || LEVEL_DATA[0];
    const nextLevelData = LEVEL_DATA.find(l => l.level > currentLevel);
    
    const tokensForCurrentLevel = currentLevelData.tokens;
    const tokensForNextLevel = nextLevelData?.tokens || MAX_LEVEL_TOKENS;

    const progressToNextLevel = totalAniTokens - tokensForCurrentLevel;
    const rangeForNextLevel = tokensForNextLevel - tokensForCurrentLevel;
    const percentToNext = rangeForNextLevel > 0 ? (progressToNextLevel / rangeForNextLevel) * 100 : 100;
    const percentToMax = (totalAniTokens / MAX_LEVEL_TOKENS) * 100;

    const badgesEarned = Math.floor(commentCount / 100);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6" />
                <span>Back</span>
            </button>
            
            <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                    <div className="relative flex-shrink-0">
                        <img src={user.avatar} alt={user.username} className="w-24 h-24 rounded-full ring-4 ring-[rgb(var(--color-primary))]/50" />
                        {user.isVerified && <VerifiedIcon className="w-8 h-8 text-blue-400 absolute -bottom-2 -right-2" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-center sm:text-left">{user.username}</h1>
                        <p className="text-sm text-[rgb(var(--text-muted))] text-center sm:text-left">Joined: {new Date(user.joinedDate).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <h2 className="text-xl font-bold text-[rgb(var(--color-primary-accent))]">{currentLevelData.name} - LVL {currentLevel}</h2>
                            {nextLevelData && <span className="text-sm font-semibold text-[rgb(var(--text-muted))]">Next: LVL {nextLevelData.level}</span>}
                        </div>
                        <div className="relative w-full bg-[rgb(var(--surface-3))] rounded-full h-6 border-2 border-black/20 overflow-hidden">
                            <div className="absolute inset-0 bg-repeat bg-center" style={{backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent)`, backgroundSize: '20px 20px'}}></div>
                            <div className="relative h-full bg-gradient-to-r from-[rgb(var(--color-primary-hover))] to-[rgb(var(--color-primary-accent))] rounded-full transition-all duration-500" style={{ width: `${percentToNext}%` }}></div>
                             <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white text-shadow-lg">{totalAniTokens.toLocaleString()} / {tokensForNextLevel.toLocaleString()} AniTK</span>
                            {/* Level Stamps */}
                            {LEVEL_DATA.filter(l => l.level > 0).map(l => (
                                <div key={l.level} className="absolute top-0 h-full w-1 bg-black/50" style={{ left: `${(l.tokens / tokensForNextLevel) * 100}%` }}>
                                    <span className="absolute -top-5 -translate-x-1/2 text-xs font-bold text-[rgb(var(--text-muted))]">{l.level}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-right text-sm text-[rgb(var(--text-muted))] mt-1">{percentToNext.toFixed(1)}% to next level</p>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-[rgb(var(--text-secondary))] mb-1">Overall Progress</h2>
                        <div className="w-full bg-[rgb(var(--surface-3))] rounded-full h-2.5">
                            <div className="bg-[rgb(var(--color-secondary-accent))] h-2.5 rounded-full" style={{ width: `${percentToMax}%` }}></div>
                        </div>
                        <p className="text-right text-sm text-[rgb(var(--text-muted))] mt-1">{percentToMax.toFixed(2)}% to max level</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center pt-4 border-t border-white/10">
                        <div><p className="text-2xl font-bold">{commentCount.toLocaleString()}</p><p className="text-xs text-[rgb(var(--text-muted))]">Total Comments</p></div>
                        <div><p className="text-2xl font-bold">{totalAniTokens.toLocaleString()} AniTK</p><p className="text-xs text-[rgb(var(--text-muted))]">Total AniTokens</p></div>
                        <div><p className="text-2xl font-bold">{badgesEarned}</p><p className="text-xs text-[rgb(var(--text-muted))]">Badges Earned</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentMeterPage;