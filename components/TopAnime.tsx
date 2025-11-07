import React from 'react';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { ChevronRightIcon, StarIcon } from './icons/Icons';

interface TopAnimeProps {
  animeList: Anime[];
  isLoading: boolean;
  onAnimeSelect: (anime: Anime) => void;
  onShowTop100: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
}

const TopAnimeCardSkeleton: React.FC = () => (
    <div className="flex-shrink-0 w-40 animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-[rgb(var(--surface-4))] rounded-full mb-2 opacity-20"></div>
        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-xl -mt-8"></div>
        <div className="h-4 mt-3 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
    </div>
);

const TopAnime: React.FC<TopAnimeProps> = ({ animeList, isLoading, onAnimeSelect, onShowTop100, getEpisodeStatus }) => {
  const { settings } = useSettings();
  
  if (isLoading && animeList.length === 0) {
      return (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-8 bg-[rgb(var(--surface-3))] rounded-md w-1/3 mb-6 animate-pulse"></div>
                <div className="flex gap-6 overflow-x-hidden">
                    {Array.from({ length: 7 }).map((_, i) => <TopAnimeCardSkeleton key={i} />)}
                </div>
            </section>
      )
  }
  
  if (animeList.length === 0) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] " style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
          Top 10 Anime
        </h2>
        <button onClick={onShowTop100} className="flex items-center gap-1 px-4 py-2 bg-[rgb(var(--surface-2))/0.7] rounded-lg text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-[rgb(var(--surface-3))] transition-colors">
          View All <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
        {animeList.map((anime, index) => {
          const subDubLabel = anime.hasSub && anime.hasDub ? 'SUB / DUB' : anime.hasSub ? 'SUB' : anime.hasDub ? 'DUB' : null;
          const { isNew, episodeNumber } = getEpisodeStatus(anime.id);
          return (
            <div key={anime.id} className="relative flex-shrink-0 w-40 group flex flex-col items-center text-center">
              <span 
                  className="text-7xl font-black text-[rgb(var(--surface-3))] transition-colors duration-300 group-hover:text-[rgb(var(--color-primary-accent))] z-0"
                  style={{ lineHeight: '0.8', textShadow: `0 2px 4px rgba(0,0,0,0.5)` }}
              >
                  {index + 1}
              </span>
              <div
                onClick={() => onAnimeSelect(anime)}
                className="relative aspect-[2/3] w-full rounded-xl shadow-lg cursor-pointer transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-[rgb(var(--shadow-color))/0.4] z-10 overflow-hidden -mt-8"
              >
                <img loading="lazy" src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1.5">
                    {isNew && <span className="order-first px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">NEW EP</span>}
                    {anime.status === 'Ongoing' && episodeNumber && (anime.totalEpisodes || anime.episodes_count) && (
                        <span
                            className="order-first inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 backdrop-blur-md"
                            title={`Episode ${episodeNumber} of ${anime.totalEpisodes || anime.episodes_count} released`}
                        >
                            Ep {episodeNumber} / {anime.totalEpisodes || anime.episodes_count}
                        </span>
                    )}
                    {anime.type && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/60 text-white backdrop-blur-md">{anime.type.toUpperCase()}</span>
                    )}
                    {subDubLabel && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/60 text-white backdrop-blur-md">
                            {subDubLabel}
                        </span>
                    )}
                </div>
              </div>
              <div className="mt-3 w-full">
                  <h3 
                      onClick={() => onAnimeSelect(anime)}
                      className="font-bold text-sm text-[rgb(var(--text-primary))] truncate cursor-pointer hover:text-[rgb(var(--color-primary-accent))] transition-colors"
                  >
                      {getDisplayTitle(anime, settings)}
                  </h3>
                  {anime.rating && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-xs text-[rgb(var(--color-warning))]">
                          <StarIcon className="w-3 h-3"/>
                          <span>{anime.rating.toFixed(2)}</span>
                      </div>
                  )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  );
};

export default TopAnime;
