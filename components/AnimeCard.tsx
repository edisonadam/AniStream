import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Anime, WatchlistStatus } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, CheckIcon, DotsVerticalIcon, StarIcon } from './icons/Icons';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { WATCHLIST_STATUSES } from '../constants';
import { updateAnilistEntry } from '../api';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useToast } from '../hooks/useToast';

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
  const { addToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inWatchlist = isInWatchlist(anime.id);
  const currentStatus = getWatchlistStatus(anime.id);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const displayTitle = getDisplayTitle(anime, settings);

  useLayoutEffect(() => {
    const checkOverflow = () => {
        const element = titleRef.current;
        if (element) {
            const hasOverflow = element.scrollWidth > element.clientWidth;
            if (isOverflowing !== hasOverflow) {
                setIsOverflowing(hasOverflow);
            }
        }
    };
    
    // Debounce resize check slightly for performance
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(checkOverflow, 100);
    };

    checkOverflow(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => {
        clearTimeout(resizeTimeout);
        window.removeEventListener('resize', handleResize);
    };
  }, [displayTitle, isOverflowing]);

  const handleWatchlistClick = (e: React.MouseEvent, status: WatchlistStatus) => {
    e.stopPropagation();
    if(inWatchlist) {
      updateWatchlistStatus(anime.id, status);
      addToast(`Updated status to '${status}'`, 'success');
    } else {
      addToWatchlist(anime, status);
      addToast(`Added to watchlist as '${status}'`, 'success');
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

  const handleRemoveFromWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWatchlist(anime.id);
    addToast('Removed from watchlist', 'info');
    setIsMenuOpen(false);
  };
  
  const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(prev => !prev);
  }
 
  const subDubLabel = anime.hasSub && anime.hasDub ? 'SUB / DUB' : anime.hasSub ? 'SUB' : anime.hasDub ? 'DUB' : null;
  
  const hasBadgeInfo = anime.seasons_count != null || anime.episodes_count != null;
  const badgeTextParts: string[] = [];
  if (anime.seasons_count != null) badgeTextParts.push(`Season ${anime.seasons_count}`);
  if (anime.episodes_count != null) badgeTextParts.push(`${anime.episodes_count} Ep`);
  const badgeText = badgeTextParts.join(' • ');
  const tooltipText = `Seasons: ${anime.seasons_count ?? 'Unknown'} — Episodes: ${anime.episodes_count ?? 'Unknown'}`;

  return (
    <div className="anime-card-touch-target group relative isolate overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.4] hover:scale-105"
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

      {/* Top-Left Badge Container */}
      <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1.5">
          {anime.type && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-md">{anime.type.toUpperCase()}</span>
          )}
          {subDubLabel && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-md">
                  {subDubLabel}
              </span>
          )}
      </div>

      {/* Top-Right Badge Container */}
      <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1.5">
          {anime.rating && anime.rating > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-yellow-400 backdrop-blur-md">
                  <StarIcon className="w-3 h-3" />
                  <span>{anime.rating.toFixed(1)}</span>
              </div>
          )}
          {anime.releaseYear && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-md">{anime.releaseYear}</span>
          )}
      </div>
      
      {/* Movie Duration Badge (bottom-left) */}
      {anime.type === 'Movie' && anime.runtime ? (
        <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-sm z-10">{formatDuration(anime.runtime)}</span>
      ) : null}
      
      {/* Bottom-Right Badge Container (Episode Info) */}
      <div className="absolute bottom-14 right-2 z-20 flex items-center gap-1.5">
          {anime.avgEpisodeDuration && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-sm">~{anime.avgEpisodeDuration}m</span>
          )}
          {hasBadgeInfo && (
              <div
                className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm"
                title={tooltipText}
                tabIndex={0}
                role="status"
                aria-label={tooltipText}
              >
                {badgeText}
              </div>
          )}
      </div>


      {isLoggedIn && (
        <div className="watchlist-menu absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onMouseLeave={() => setIsMenuOpen(false)}>
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
                            <button onClick={handleRemoveFromWatchlist} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/20 rounded-md">
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
        <div className="w-full overflow-hidden">
            <h3 ref={titleRef} className={`text-white font-bold text-sm truncate transition-colors ${!isOverflowing ? 'group-hover:text-[rgb(var(--color-primary-accent))]' : 'group-hover:hidden'}`}>
                {displayTitle}
            </h3>
            {isOverflowing && (
                <div className="hidden group-hover:block whitespace-nowrap">
                    <div className="inline-block animate-[marquee_5s_linear_infinite] will-change-transform">
                        <span className="font-bold text-sm text-[rgb(var(--color-primary-accent))] pr-8">{displayTitle}</span>
                        <span className="font-bold text-sm text-[rgb(var(--color-primary-accent))] pr-8" aria-hidden="true">{displayTitle}</span>
                    </div>
                </div>
            )}
        </div>
        {currentStatus && <p className="text-xs font-semibold text-[rgb(var(--color-primary-accent))]">{currentStatus}</p>}
      </div>
    </div>
  );
};

export default React.memo(AnimeCard);