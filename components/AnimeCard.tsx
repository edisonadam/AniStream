import React from 'react';
import type { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  return (
    <div
      className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 hover:-translate-y-2"
      onClick={() => onSelect(anime)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(anime)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${anime.title}`}
    >
      <div className="absolute inset-0 bg-black transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/40"></div>
      <img
        src={anime.thumbnail}
        alt={anime.title}
        className="w-full h-auto object-cover aspect-[2/3] transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute top-2 left-2">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            anime.tag === 'Dub'
              ? 'bg-purple-600/80 text-white'
              : 'bg-blue-600/80 text-white'
          }`}
        >
          {anime.tag}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <h3 className="text-white font-bold text-sm truncate group-hover:text-purple-300 transition-colors">
          {anime.title}
        </h3>
      </div>
    </div>
  );
};

export default AnimeCard;
