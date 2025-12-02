
import React, { useMemo, useState } from 'react';
import type { Anime, WatchProgressInfo } from '../types';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { ChevronLeftIcon, SearchIcon } from './icons/Icons';

interface HistoryPageProps {
  onGoBack: () => void;
  // FIX: Renamed prop to onSelectAnime for consistency.
  onSelectAnime: (anime: Anime) => void;
  allAnime: Anime[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onGoBack, onSelectAnime, allAnime }) => {
    const { watchProgressList, clearProgress } = useWatchProgress();
    const { settings } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    
    const historyWithDetails = useMemo(() => {
        const animeMap = new Map(allAnime.map(a => [a.id, a]));
        const list = watchProgressList
            .map(progressInfo => {
                const anime = animeMap.get(progressInfo.animeId);
                return anime ? { anime, progressInfo } : null;
            })
            .filter((item): item is { anime: Anime; progressInfo: WatchProgressInfo } => item !== null);
        
        if (!searchQuery.trim()) return list;
        
        const lowerQuery = searchQuery.toLowerCase();
        return list.filter(item => {
            const title = getDisplayTitle(item.anime, settings).toLowerCase();
            return title.includes(lowerQuery);
        });
    }, [watchProgressList, allAnime, searchQuery, settings]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    View History
                </h1>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-grow sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon className="w-4 h-4"/></div>
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder="Filter history..." 
                            className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))]"
                        />
                    </div>
                    {historyWithDetails.length > 0 && (
                         <button 
                            onClick={() => {
                                if (window.confirm("Are you sure you want to clear your entire viewing history? This cannot be undone.")) {
                                    clearProgress();
                                }
                            }}
                            className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-xl font-semibold hover:bg-[rgb(var(--color-danger))]/40 whitespace-nowrap text-sm"
                        >
                            Clear History
                        </button>
                    )}
                </div>
            </div>

            {historyWithDetails.length > 0 ? (
                 <div className="space-y-4">
                    {historyWithDetails.map(({ anime, progressInfo }) => (
                        <div 
                            key={anime.id}
                            onClick={() => onSelectAnime(anime)}
                            className="group flex items-center gap-4 bg-[rgb(var(--surface-2))/0.5] p-3 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors cursor-pointer"
                        >
                            <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{getDisplayTitle(anime, settings)}</h3>
                                <p className="text-sm text-[rgb(var(--text-muted))]">
                                    Last Watched: S{progressInfo.currentSeason} E{progressInfo.currentEpisode}
                                </p>
                                <div className="mt-2">
                                     <div className="w-full bg-[rgb(var(--surface-3))] rounded-full h-2">
                                        <div className="bg-[rgb(var(--color-primary))] h-2 rounded-full" style={{width: `${progressInfo.progress}%`}}></div>
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
                    <p className="font-semibold text-[rgb(var(--text-primary))] text-lg">{searchQuery ? 'No history matches your search.' : 'Your history is empty.'}</p>
                    {!searchQuery && <p className="text-[rgb(var(--text-muted))]">Anime you watch will appear here.</p>}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
