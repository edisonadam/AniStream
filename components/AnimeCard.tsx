import React, { useState } from 'react';
import type { Anime, WatchlistStatus } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, CheckIcon, DotsVerticalIcon, StarIcon } from './icons/Icons';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { WATCHLIST_STATUSES } from '../constants';
import { updateAnilistEntry } from '../api';
import { useWatchProgress } from '../hooks/useWatchProgress';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) {
    return '';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, updateWatchlistStatus, getWatchlistStatus } = useWatchlist();
  const { isLoggedIn } = useAuth();
  const { settings } = useSettings();
  const { getWatchProgress } = useWatchProgress();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inWatchlist = isInWatchlist(anime.id);
  const currentStatus = getWatchlistStatus(anime.id);

  const handleWatchlistClick = (e: React.MouseEvent, status: WatchlistStatus) => {
    e.stopPropagation();
    if(inWatchlist) {
      updateWatchlistStatus(anime.id, status);
    } else {
      addToWatchlist(anime, status);
    }
    setIsMenuOpen(false);

    // Sync with AniList
    if (settings.autoSyncAniList && settings.anilistToken) {
        let progress: number | undefined = undefined;
        if (status === 'Completed') {
            progress = anime.totalEpisodes || undefined;
        } else if (status === 'Watching') {
            const watchProgress = getWatchProgress(anime.id);
            // Rough estimation of episodes watched from percentage
            const currentEpisode = watchProgress ? Math.floor((watchProgress.progress / 100) * (anime.totalEpisodes || 1)) : 0;
            progress = currentEpisode > 0 ? currentEpisode : 1;
        }
        updateAnilistEntry(anime.id, settings.anilistToken, { status, progress });
    }
  };
  
  const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(prev => !prev);
  }
  
  const displayTitle = getDisplayTitle(anime, settings);

  return (
    <div className="anime-card-touch-target group relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.4] hover:scale-105"
      onClick={() => onSelect(anime)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(anime)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${displayTitle}`}
    >
      <div className="aspect-[2/3] w-full">
        <img loading="lazy" src={anime.thumbnail} alt={displayTitle} className="w-full h-full object-cover" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-100 transition-opacity duration-300"></div>

      <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
        {anime.releaseYear && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">{anime.releaseYear}</span>}
        {anime.rating && anime.rating > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-yellow-400 backdrop-blur-md">
                <StarIcon className="w-3 h-3" />
                <span>{anime.rating.toFixed(1)}</span>
            </div>
        )}
        {anime.type && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">{anime.type.toUpperCase()}</span>}
        {(anime.hasSub || anime.hasDub) && (
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white backdrop-blur-md ${
                anime.hasSub && anime.hasDub
                    ? 'bg-gradient-to-r from-[rgb(var(--color-primary))/0.8] to-[rgb(var(--color-tertiary-accent))/0.8]'
                    : anime.hasSub
                    ? 'bg-[rgb(var(--color-primary))/0.6]'
                    : 'bg-[rgb(var(--color-tertiary-accent))/0.6]'
            }`}>
                {anime.hasSub && anime.hasDub ? 'SUB/DUB' : anime.hasSub ? 'SUB' : 'DUB'}
            </span>
        )}
      </div>
      
      {anime.type === 'Movie' && anime.runtime ? (
        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-black/70 text-white backdrop-blur-sm z-10">{formatDuration(anime.runtime)}</span>
      ) : anime.avgEpisodeDuration ? (
        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-black/70 text-white backdrop-blur-sm z-10">~{anime.avgEpisodeDuration}m</span>
      ) : null}


      {isLoggedIn && (
        <div className="watchlist-menu absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onMouseLeave={() => setIsMenuOpen(false)}>
            <button onClick={handleMenuToggle} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-[rgb(var(--color-primary))/0.8] transition-colors">
                <DotsVerticalIcon />
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-[rgb(var(--surface-2))] rounded-lg shadow-lg p-1 z-10 w-44">
                    {WATCHLIST_STATUSES.map(status => (
                        <button key={status} onClick={(e) => handleWatchlistClick(e, status)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md">
                           {currentStatus === status ? <CheckIcon className="w-4 h-4 text-[rgb(var(--color-primary-accent))]"/> : <span className="w-4 h-4"></span>}
                           <span>{status}</span>
                        </button>
                    ))}
                    {inWatchlist && (
                        <>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(anime.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/20 rounded-md">
                                <PlusIcon className="w-4 h-4 rotate-45"/>
                                <span>Remove</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-bold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">
          {displayTitle}
        </h3>
        {currentStatus && <p className="text-xs font-semibold text-[rgb(var(--color-primary-accent))]">{currentStatus}</p>}
      </div>
    </div>
  );
};

export default React.memo(AnimeCard);
