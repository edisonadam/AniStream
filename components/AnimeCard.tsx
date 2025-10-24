import React, { useState } from 'react';
import type { Anime } from '../types';
import { useWatchLater } from '../hooks/useWatchLater';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, CheckIcon, DotsVerticalIcon } from './icons/Icons';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  const { addToWatchLater, removeFromWatchLater, isInWatchLater } = useWatchLater();
  const { isLoggedIn } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inWatchLater = isInWatchLater(anime.id);

  const handleWatchLaterClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if(inWatchLater) {
      removeFromWatchLater(anime.id);
    } else {
      addToWatchLater(anime);
    }
    setIsMenuOpen(false);
  };
  
  const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(prev => !prev);
  }

  return (
    <div className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/40"
      onClick={() => onSelect(anime)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(anime)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${anime.title}`}
    >
      <div className="aspect-[2/3] w-full">
        <img src={anime.thumbnail} alt={anime.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
        {anime.type && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-teal-600/80 text-white backdrop-blur-sm">{anime.type.toUpperCase()}</span>}
        {anime.hasSub && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-600/80 text-white backdrop-blur-sm">SUB</span>}
        {anime.hasDub && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-600/80 text-white backdrop-blur-sm">DUB</span>}
      </div>

      {isLoggedIn && (
        <div className="absolute top-2 right-2">
            <button onClick={handleMenuToggle} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-purple-600/80 transition-colors">
                <DotsVerticalIcon />
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-slate-800 rounded-md shadow-lg p-1 z-10 w-40">
                    <button onClick={handleWatchLaterClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-200 hover:bg-slate-700 rounded-md">
                        {inWatchLater ? <CheckIcon/> : <PlusIcon/>}
                        <span>{inWatchLater ? 'In Watch Later' : 'Watch Later'}</span>
                    </button>
                </div>
            )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-bold text-sm truncate group-hover:text-purple-300 transition-colors">
          {anime.title}
        </h3>
      </div>
    </div>
  );
};

export default AnimeCard;