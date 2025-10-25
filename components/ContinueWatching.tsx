
import React from 'react';
import type { Anime, ContinueWatchingInfo } from '../types';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useAuth } from '../hooks/useAuth';

interface ContinueWatchingProps {
    allAnime: Anime[];
    onShowWatchlist: () => void;
    onSelectAnime: (anime: Anime) => void;
}

interface ContinueWatchingCardProps {
    anime: Anime;
    progressInfo: ContinueWatchingInfo;
    onSelect: () => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ anime, progressInfo, onSelect }) => {
    return (
        <div onClick={onSelect} className="group relative flex-shrink-0 w-40 sm:w-48 cursor-pointer transform transition-transform duration-300 hover:-translate-y-1">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg">
                <img src={anime.thumbnail} alt={anime.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
             {anime.type && <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-[rgb(var(--color-secondary-accent))/0.8] text-white backdrop-blur-sm">{anime.type.toUpperCase()}</span>}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent rounded-b-lg">
                <p className="text-white text-sm font-bold truncate">{anime.title}</p>
                <p className="text-xs text-[rgb(var(--text-secondary))]">S{progressInfo.currentSeason} E{progressInfo.currentEpisode}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgb(var(--surface-3))/0.5] rounded-b-lg">
                <div className="h-full bg-[rgb(var(--color-primary))] rounded-b-lg" style={{ width: `${progressInfo.progress}%` }}></div>
            </div>
        </div>
    );
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ allAnime, onShowWatchlist, onSelectAnime }) => {
    const { isLoggedIn } = useAuth();
    const { continueWatchingList } = useContinueWatching();

    if (!isLoggedIn || continueWatchingList.length === 0) {
        return null;
    }

    const watchableItems = continueWatchingList
        .map(progressInfo => {
            const anime = allAnime.find(a => a.id === progressInfo.animeId);
            return anime ? { anime, progressInfo } : null;
        })
        .filter(Boolean) as { anime: Anime; progressInfo: ContinueWatchingInfo }[];

    if (watchableItems.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Continue Watching
                </h2>
                <button onClick={onShowWatchlist} className="px-4 py-2 bg-[rgb(var(--surface-2))/0.7] rounded-lg text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-[rgb(var(--surface-3))] transition-colors">
                    View Full Watchlist
                </button>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
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