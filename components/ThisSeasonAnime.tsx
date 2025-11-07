import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { fetchWithRetry, mapJikanToAnime } from '../api';
import { useSettings } from '../hooks/useSettings';
import { ChevronRightIcon, StarIcon } from './icons/Icons';
import { getDisplayTitle } from '../utils';

interface ThisSeasonAnimeProps {
  onAnimeSelect: (anime: Anime) => void;
  onShowSchedule: () => void;
  isNew: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
}

const ThisSeasonCardSkeleton: React.FC = () => (
    <div className="flex-shrink-0 w-40 animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 bg-[rgb(var(--surface-4))] rounded-full mb-2 opacity-20"></div>
        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-xl -mt-8"></div>
        <div className="h-4 mt-3 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
    </div>
);

const getCurrentSeasonInfo = (): { year: number; season: string } => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let season: string;
    if (month >= 0 && month <= 2) season = 'winter';
    else if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else season = 'fall';
    return { year, season };
};

const ThisSeasonAnime: React.FC<ThisSeasonAnimeProps> = ({ onAnimeSelect, onShowSchedule, isNew }) => {
  const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchSeasonal = async () => {
      setIsLoading(true);
      try {
        const { year, season } = getCurrentSeasonInfo();
        const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
        const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime?season=${season}&year=${year}&order_by=score&sort=desc&limit=15${sfwQuery}`);

        if (!res.ok) throw new Error("Failed to fetch this season's anime");
        const data = await res.json();
        let mapped = data.data.map(mapJikanToAnime).filter(Boolean);
        if (settings.restrictAdultContent) {
            mapped = mapped.filter((a: Anime) => !a.isAdult);
        }
        setSeasonalAnime(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeasonal();
  }, [settings.restrictAdultContent]);

  if (isLoading && seasonalAnime.length === 0) {
      return (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-8 bg-[rgb(var(--surface-3))] rounded-md w-1/3 mb-6 animate-pulse"></div>
                <div className="flex gap-6 overflow-x-hidden">
                    {Array.from({ length: 7 }).map((_, i) => <ThisSeasonCardSkeleton key={i} />)}
                </div>
            </section>
      )
  }
  
  if (seasonalAnime.length === 0) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] " style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
          Best This Season
        </h2>
        <button onClick={onShowSchedule} className="flex items-center gap-1 px-4 py-2 bg-[rgb(var(--surface-2))/0.7] rounded-lg text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-[rgb(var(--surface-3))] transition-colors">
          View Schedule <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
        {seasonalAnime.slice(0, 10).map((anime, index) => {
          const subDubLabel = anime.hasSub && anime.hasDub ? 'SUB / DUB' : anime.hasSub ? 'SUB' : anime.hasDub ? 'DUB' : null;
          const hasNewEpisode = isNew(anime.id).isNew;
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
                      {hasNewEpisode && <span className="order-first px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">NEW EP</span>}
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

export default ThisSeasonAnime;