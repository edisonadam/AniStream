import React from 'react';
import type { Manga } from '../types';
import { StarIcon } from './icons/Icons';

interface MangaCardProps {
  manga: Manga;
}

const MangaCard: React.FC<MangaCardProps> = ({ manga }) => {
  return (
    <a href={manga.malUrl} target="_blank" rel="noopener noreferrer" className="manga-card-touch-target group relative overflow-hidden rounded-[2rem] shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.5] hover:-translate-y-2">
      <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))]">
        <img loading="lazy" src={manga.thumbnail} alt={manga.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      {manga.score && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-yellow-400 backdrop-blur-md">
            <StarIcon className="w-3 h-3" />
            <span>{manga.score.toFixed(2)}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-bold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{manga.title}</h3>
        <p className="text-xs text-[rgb(var(--text-muted))]">{manga.type}</p>
      </div>
    </a>
  );
};

export default MangaCard;