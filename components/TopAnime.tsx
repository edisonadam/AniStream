import React from 'react';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { ChevronRightIcon, StarIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';

interface TopAnimeProps {
  animeList: Anime[];
  isLoading: boolean;
  onAnimeSelect: (anime: Anime) => void;
  onShowTop100: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const TopAnimeCardSkeleton: React.FC = () => (
    <div className="flex-shrink-0 w-40 animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-[rgb(var(--surface-4))] rounded-full mb-2 opacity-20"></div>
        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-xl -mt-8"></div>
        <div className="h-4 mt-3 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
    </div>
);

const TopAnime: React.FC<TopAnimeProps> = ({ animeList, isLoading, onAnimeSelect, onShowTop100, getEpisodeStatus, onLoginRequest }) => {
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

      <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 horizontal-scroll-fade">
        {animeList.map((anime, index) => {
          return (
            <div key={anime.id} className="relative flex-shrink-0 w-48 group flex flex-col items-center text-center">
                <span 
                    className="text-8xl font-black text-[rgb(var(--surface-3))] transition-colors duration-300 group-hover:text-[rgb(var(--color-primary-accent))] z-0"
                    style={{ lineHeight: '0.8', textShadow: `0 2px 4px rgba(0,0,0,0.5)` }}
                >
                    {index + 1}
                </span>
                <div className="flex-shrink-0 w-40 -mt-10 z-10">
                    <AnimeCard anime={anime} onSelect={onAnimeSelect} episodeStatus={getEpisodeStatus(anime.id)} onLoginRequest={onLoginRequest} />
                </div>
            </div>
          )
        })}
      </div>
    </section>
  );
};

export default TopAnime;
