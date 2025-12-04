

import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { fetchWithRetry, mapJikanToAnime } from '../api';
import { useSettings } from '../hooks/useSettings';
import { ChevronRightIcon, StarIcon } from './icons/Icons';
import { getDisplayTitle } from '../utils';
import AnimeCard from './AnimeCard';

interface ThisSeasonAnimeProps {
  onAnimeSelect: (anime: Anime) => void;
  onShowSchedule: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
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

const ThisSeasonAnime: React.FC<ThisSeasonAnimeProps> = ({ onAnimeSelect, onShowSchedule, getEpisodeStatus, onLoginRequest }) => {
  const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchSeasonal = async () => {
      setIsLoading(true);
      try {
        const { year, season } = getCurrentSeasonInfo();
        const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
        const res = await fetchWithRetry(`https://api.jikan.moe/v4/seasons/${year}/${season}?order_by=score&sort=desc&limit=15${sfwQuery}`);

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

  if (isLoading) {
      return (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-8 bg-[rgb(var(--surface-3))] rounded-md w-1/3 mb-6 animate-pulse"></div>
                <div className="flex gap-6 overflow-x-hidden">
                    {Array.from({ length: 7 }).map((_, i) => <ThisSeasonCardSkeleton key={i} />)}
                </div>
            </section>
      )
  }
  
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

      <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 horizontal-scroll-fade">
        {seasonalAnime.slice(0, 10).map((anime, index) => {
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

export default ThisSeasonAnime;