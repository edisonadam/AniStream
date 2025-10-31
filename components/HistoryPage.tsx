import React, { useMemo } from 'react';
import type { Anime, WatchProgressInfo } from '../types';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';

interface HistoryPageProps {
  onAnimeSelect: (anime: Anime) => void;
  allAnime: Anime[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onAnimeSelect, allAnime }) => {
    const { watchProgressList, clearProgress } = useWatchProgress();
    const { settings } = useSettings();
    
    const historyWithDetails = useMemo(() => {
        const animeMap = new Map(allAnime.map(a => [a.id, a]));
        return watchProgressList
            .map(progressInfo => {
                const anime = animeMap.get(progressInfo.animeId);
                return anime ? { anime, progressInfo } : null;
            })
            .filter((item): item is { anime: Anime; progressInfo: WatchProgressInfo } => item !== null);
    }, [watchProgressList, allAnime]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Viewing History
                </h1>
                {historyWithDetails.length > 0 && (
                     <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear your entire viewing history? This cannot be undone.")) {
                                clearProgress();
                            }
                        }}
                        className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-xl font-semibold hover:bg-[rgb(var(--color-danger))]/40"
                    >
                        Clear History
                    </button>
                )}
            </div>

            {historyWithDetails.length > 0 ? (
                 <div className="space-y-4">
                    {historyWithDetails.map(({ anime, progressInfo }) => (
                        <div 
                            key={anime.id}
                            onClick={() => onAnimeSelect(anime)}
                            className="group flex items-center gap-4 bg-[rgb(var(--surface-2))/0.5] p-3 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors cursor-pointer"
                        >
                            <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{getDisplayTitle(anime, settings)}</h3>
                                <p className="text-sm text-[rgb(var(--text-muted))]">
                                    Last Watched: S{progressInfo.currentSeason} E{progressInfo.currentEpisode}
                                </p>
                                <div className="mt-2">
                                     <div className="w-full bg-[rgb(var(--surface-3))] rounded-full h-1.5">
                                        <div className="bg-[rgb(var(--color-primary))] h-1.5 rounded-full" style={{width: `${progressInfo.progress}%`}}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-sm text-right text-[rgb(var(--text-muted))]">
                                <p>{new Date(progressInfo.timestamp).toLocaleDateString()}</p>
                                <p>{new Date(progressInfo.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[rgb(var(--surface-2))/0.5] rounded-2xl">
                    <p className="text-2xl mb-2">🤔</p>
                    <p className="font-semibold text-[rgb(var(--text-primary))] text-lg">Your history is empty.</p>
                    <p className="text-[rgb(var(--text-muted))]">Anime you watch will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;