import React, { useMemo } from 'react';
import type { Anime, WatchProgressInfo } from '../types';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import AnimeCard from './AnimeCard';

interface ContinueWatchingProps {
    onShowHistory: () => void;
    onSelectAnime: (anime: Anime) => void;
    allAnime: Anime[];
    getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
    onLoginRequest: (reason: string) => void;
}

interface ContinueWatchingCardProps {
    anime: Anime;
    progressInfo: WatchProgressInfo;
    onSelect: () => void;
    episodeStatus: { isNew: boolean; episodeNumber: number | null };
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ anime, progressInfo, onSelect, episodeStatus }) => {
    const { settings } = useSettings();
    const displayTitle = getDisplayTitle(anime, settings);
    const { isNew, episodeNumber } = episodeStatus;

    return (
        <div onClick={onSelect} className="continue-watching-card-touch-target group relative flex-shrink-0 w-40 sm:w-48 cursor-pointer transform transition-transform duration-300 hover:-translate-y-1">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg">
                <img loading="lazy" src={anime.thumbnail} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
             <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
                {isNew && <span className="order-first px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">NEW EP</span>}
                {anime.status === 'Ongoing' && episodeNumber && (anime.totalEpisodes || anime.episodes_count) && (
                    <span
                        className="order-first inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400 backdrop-blur-sm"
                        title={`Episode ${episodeNumber} of ${anime.totalEpisodes || anime.episodes_count} released`}
                    >
                        Ep {episodeNumber} / {anime.totalEpisodes || anime.episodes_count}
                    </span>
                )}
                {anime.releaseYear && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">{anime.releaseYear}</span>}
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

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ onShowHistory, onSelectAnime, allAnime, getEpisodeStatus, onLoginRequest }) => {
    const { isLoggedIn } = useAuth();
    const { watchProgressList } = useWatchProgress();

    const watchableItems = useMemo(() => {
        if (!isLoggedIn || watchProgressList.length === 0) return [];

        const animeMap = new Map<number, Anime>();
        allAnime.forEach(anime => {
            if(anime) animeMap.set(anime.id, anime);
        });

        return watchProgressList
            .filter(p => p.progress > 0 && p.progress < 100)
            .map(progressInfo => {
                const anime = animeMap.get(progressInfo.animeId);
                // Only return if we found the full anime details with a thumbnail
                return anime ? { anime, progressInfo } : null;
            })
            .filter((item): item is { anime: Anime; progressInfo: WatchProgressInfo } => item !== null && !!item.anime.thumbnail);
    }, [isLoggedIn, watchProgressList, allAnime]);


    if (watchableItems.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    View History
                </h2>
                <button onClick={onShowHistory} className="px-4 py-2 bg-[rgb(var(--surface-2))/0.7] rounded-lg text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-[rgb(var(--surface-3))] transition-colors">
                    View All History
                </button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {watchableItems.map(({ anime, progressInfo }) => (
                    <div key={anime.id} className="flex-shrink-0 w-48">
                        <AnimeCard
                            anime={anime}
                            onSelect={() => onSelectAnime(anime)}
                            episodeStatus={getEpisodeStatus(anime.id)}
                            onLoginRequest={onLoginRequest}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ContinueWatching;
