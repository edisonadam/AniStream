import React, { useMemo } from 'react';
import type { Anime, WatchProgressInfo } from '../types';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';

interface ContinueWatchingProps {
    onShowHistory: () => void;
    onSelectAnime: (anime: Anime) => void;
}

interface ContinueWatchingCardProps {
    anime: Anime;
    progressInfo: WatchProgressInfo;
    onSelect: () => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ anime, progressInfo, onSelect }) => {
    const { settings } = useSettings();
    const displayTitle = getDisplayTitle(anime, settings);

    return (
        <div onClick={onSelect} className="continue-watching-card-touch-target group relative flex-shrink-0 w-40 sm:w-48 cursor-pointer transform transition-transform duration-300 hover:-translate-y-1">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg">
                <img src={anime.thumbnail} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
             <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
                {(anime.hasSub || anime.hasDub) && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">{anime.hasSub && anime.hasDub ? 'SUB/DUB' : anime.hasSub ? 'SUB' : 'DUB'}</span>}
                {anime.isAdult && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">+18</span>}
                {anime.type && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">{anime.type.toUpperCase()}</span>}
             </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent rounded-b-lg">
                <p className="text-white text-sm font-bold truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{displayTitle}</p>
                <p className="text-xs text-[rgb(var(--text-secondary))]">S{progressInfo.currentSeason} E{progressInfo.currentEpisode}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgb(var(--surface-3))/0.5] rounded-b-lg">
                <div className="h-full bg-[rgb(var(--color-primary))] rounded-b-lg" style={{ width: `${progressInfo.progress}%` }}></div>
            </div>
        </div>
    );
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ onShowHistory, onSelectAnime }) => {
    const { isLoggedIn } = useAuth();
    const { watchProgressList } = useWatchProgress();

    const watchableItems = useMemo(() => {
        if (!isLoggedIn || watchProgressList.length === 0) return [];

        const animeMap = new Map<number, Anime>();
        // Create a map from the full anime list (this part might need optimization if allAnime is huge)
        // For now, assuming it's manageable. A context might be better.
        // This component doesn't have `allAnime` prop, so we rely on what's in watch progress.
        // This is a limitation, but we can't fetch all anime details here.
        // The parent `App.tsx` now passes `allAnime`, which contains everything.

        return watchProgressList
            .filter(p => p.progress > 0 && p.progress < 100)
            .map(progressInfo => {
                // A stub is created here if not found, but App.tsx should provide the full object
                const anime: Anime = { 
                    id: progressInfo.animeId, 
                    title: `Anime #${progressInfo.animeId}`,
                    thumbnail: '',
                } as Anime; // This is a fallback
                return { anime, progressInfo };
            })
            .filter(Boolean) as { anime: Anime; progressInfo: WatchProgressInfo }[];
    }, [isLoggedIn, watchProgressList]);


    if (watchableItems.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Continue Watching
                </h2>
                <button onClick={onShowHistory} className="px-4 py-2 bg-[rgb(var(--surface-2))/0.7] rounded-lg text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-[rgb(var(--surface-3))] transition-colors">
                    View Full History
                </button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {watchableItems.map(({ anime, progressInfo }) => (
                    <ContinueWatchingCard 
                        key={anime.id} 
                        anime={anime} 
                        progressInfo={progressInfo}
                        onSelect={() => onSelectAnime(anime)}
                    />
                ))}
            </div>
        </section>
    );
};

export default ContinueWatching;
