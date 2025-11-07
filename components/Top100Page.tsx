import React from 'react';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { ChevronLeftIcon, StarIcon } from './icons/Icons';

interface Top100PageProps {
  topAnimeList: Anime[];
  isLoading: boolean;
  onSelectAnime: (anime: Anime) => void;
  onGoBack: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
}

const Top100Page: React.FC<Top100PageProps> = ({ topAnimeList, isLoading, onSelectAnime, onGoBack, getEpisodeStatus }) => {
    const { settings } = useSettings();

    const ListItemSkeleton: React.FC = () => (
        <div className="flex items-center gap-4 bg-[rgb(var(--surface-2))] p-3 rounded-xl animate-pulse">
            <div className="w-10 text-2xl font-bold text-center bg-[rgb(var(--surface-3))] h-10 rounded-md"></div>
            <div className="w-16 h-24 bg-[rgb(var(--surface-3))] rounded-md"></div>
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
                <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-1/2"></div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Top 100 Anime
            </h1>

            {isLoading ? (
                 <div className="space-y-3">{Array.from({ length: 15 }).map((_, i) => <ListItemSkeleton key={`skel-${i}`} />)}</div>
            ) : (
                <div className="space-y-3">
                    {topAnimeList.map((anime, index) => {
                        const { episodeNumber } = getEpisodeStatus(anime.id);
                        return (
                            <div 
                                key={anime.id}
                                onClick={() => onSelectAnime(anime)}
                                className="group relative flex items-center gap-4 bg-[rgb(var(--surface-2))/0.5] p-2 pr-4 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors cursor-pointer"
                            >
                                <span className="w-12 text-center text-2xl font-bold text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{index + 1}</span>
                                <img src={anime.thumbnail} alt="" className="w-14 h-20 object-cover rounded-md flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{getDisplayTitle(anime, settings)}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-[rgb(var(--text-muted))] capitalize">
                                            {anime.type} &bull; {anime.status}
                                        </p>
                                        {anime.status === 'Ongoing' && episodeNumber && (anime.totalEpisodes || anime.episodes_count) && (
                                            <span
                                                className="inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400"
                                                title={`Episode ${episodeNumber} of ${anime.totalEpisodes || anime.episodes_count} released`}
                                            >
                                                Ep {episodeNumber} / {anime.totalEpisodes || anime.episodes_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {anime.rating && (
                                    <div className="flex items-center gap-1.5 text-lg font-bold text-[rgb(var(--color-warning))]">
                                        <StarIcon className="w-5 h-5"/>
                                        <span>{anime.rating.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Top100Page;
