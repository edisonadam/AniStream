import React from 'react';
import AnimeCard from './AnimeCard';
import type { Anime } from '../types';
import AnimeCardSkeleton from './AnimeCardSkeleton';

interface UpcomingAnimeSectionProps {
  animeList: Anime[];
  isLoading: boolean;
  onAnimeSelect: (anime: Anime) => void;
  onLoginRequest: (reason: string) => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
}

const UpcomingAnimeSection: React.FC<UpcomingAnimeSectionProps> = ({ animeList, isLoading, onAnimeSelect, onLoginRequest, getEpisodeStatus }) => {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        Top Upcoming Anime
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <AnimeCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {animeList.slice(0, 6).map((anime) => (
            <AnimeCard 
              key={anime.id} 
              anime={anime} 
              onSelect={onAnimeSelect} 
              episodeStatus={getEpisodeStatus(anime.id)} 
              onLoginRequest={onLoginRequest} 
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default UpcomingAnimeSection;
