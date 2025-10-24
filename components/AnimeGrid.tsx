import React from 'react';
import { ANIME_DATA } from '../constants';
import AnimeCard from './AnimeCard';
import type { Anime } from '../types';

interface AnimeGridProps {
  onAnimeSelect: (anime: Anime) => void;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ onAnimeSelect }) => {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold mb-8 text-white" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>
        Browse Titles
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {ANIME_DATA.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} onSelect={onAnimeSelect} />
        ))}
      </div>
    </section>
  );
};

export default AnimeGrid;
