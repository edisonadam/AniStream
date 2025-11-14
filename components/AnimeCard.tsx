

import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import type { Anime, WatchlistStatus } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, CheckIcon, DotsVerticalIcon, StarIcon, ViewListIcon } from './icons/Icons';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle, formatDuration } from '../utils';
import { WATCHLIST_STATUSES } from '../constants';
import { updateAnilistEntry, fetchWithRetry } from '../api';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useToast } from '../hooks/useToast';
import { useQueue } from '../hooks/useQueue';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  episodeStatus: { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect, episodeStatus, onLoginRequest }) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, updateWatchlistStatus, getWatchlistStatus } = useWatchlist();
  const { isLoggedIn } = useAuth();
  const { settings } = useSettings();
  const { getWatchProgress } = useWatchProgress();
  const { addToast } = useToast();
  const { addToQueue, isInQueue } = useQueue();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inWatchlist = isInWatchlist(anime.id);
  const inQueue = isInQueue(anime.id);
  const currentStatus = getWatchlistStatus(anime.id);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const [isHovering, setIsHovering] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null | undefined>(undefined);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  const displayTitle = getDisplayTitle(anime, settings);
  const { isNew, episodeNumber } = episodeStatus;

  const fetchTrailer = useCallback(async () => {
    if (trailerKey !== undefined) return;
    setIsLoadingTrailer(true);
    try {
        const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/videos`);
        if (res.ok) {
            const data = await res.json();
            const trailer = data.data?.promo?.[0]?.trailer?.youtube_id;
            setTrailerKey(trailer || null);
        } else {
            setTrailerKey(null);
        }
    } catch (e) {
        console.error("Failed to fetch trailer for card:", e);
        setTrailerKey(null);
    } finally {
        setIsLoadingTrailer(false);
    }
  }, [anime.id, trailerKey]);

  const handleMouseEnter = () => {
      hoverTimeoutRef.current = window.setTimeout(() => {
          setIsHovering(true);
          fetchTrailer();
      }, 500);
  };

  const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovering(false);
      setIsLoadingTrailer(false);
  };


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
      updateWatchlistStatus(anime.id, status, displayTitle);
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
            const watchProgress = getWatchProgress(anime);
            // Rough estimation of episodes watched from percentage
            const currentEpisode = watchProgress ? Math.floor((watchProgress.progress / 100) * (anime.totalEpisodes || 1)) : 0;
            progress = currentEpisode > 0 ? currentEpisode : 1;
        }
        updateAnilistEntry(anime.id, settings.anilistToken, { status, progress });
    }
  };
  
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(anime);
    setIsMenuOpen(false);
  };

  const handleRemoveFromWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWatchlist(anime.id, displayTitle);
    setIsMenuOpen(false);
  };
  
  const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        onLoginRequest('You need to be logged in to manage your lists.');
        return;
      }
      setIsMenuOpen(prev => !prev);
  }
 
  const subDubLabel = anime.hasSub && anime.hasDub ? 'SUB / DUB' : anime.hasSub ? 'SUB' : anime.hasDub ? 'DUB' : null;
  
  const totalEpisodes = anime.totalEpisodes || anime.episodes_count;
  const releasedEpisodes = episodeNumber;
  const shouldShowReleasedBadge = (anime.status === 'Ongoing' || anime.status === 'Upcoming');

  return (
    <div className="anime-card-touch-target group relative isolate overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.4] hover:scale-105"
      onClick={() => onSelect(anime)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(anime)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${displayTitle}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
    >
      <div className="aspect-[2/3] w-full relative bg-black">
        <img loading="lazy" src={anime.thumbnail} alt={displayTitle} className="w-full h-full object-cover" />
        {isHovering && trailerKey && !isLoadingTrailer && (
            <div className="absolute inset-0 animate-cinematic-fade-in">
                 <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}`}
                    title={`${displayTitle} trailer`}
                    frameBorder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        )}
        {isHovering && isLoadingTrailer && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-100 transition-opacity duration-300"></div>

      {/* Top-Left Badge Container */}
      <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1.5">
          {isNew && <span className="order-first px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">NEW EP</span>}
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
          {anime.status === 'Ongoing' && <div title="Ongoing" className="w-3 h-3 bg-blue-500 rounded-full ring-2 ring-black"></div>}
          {anime.status === 'Completed' && <div title="Completed" className="w-3 h-3 bg-green-500 rounded-full ring-2 ring-black"></div>}
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
      
      {/* Bottom-Right Badge Container (Episode Info) */}
      <div className="absolute bottom-14 right-2 z-20 flex flex-row-reverse items-center gap-1.5">
          {anime.type === 'Movie' && anime.runtime ? (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-sm">{formatDuration(anime.runtime)}</span>
          ) : anime.avgEpisodeDuration ? (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-sm">~{anime.avgEpisodeDuration}m</span>
          ) : null}
          {shouldShowReleasedBadge && (totalEpisodes || releasedEpisodes) ? (
            <div
                className="inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-400 backdrop-blur-sm"
                title={`${releasedEpisodes || 0} of ${totalEpisodes || '?'} episodes released`}
            >
                {releasedEpisodes || 0} / {totalEpisodes || '?'} Episodes Released
            </div>
          ) : null}
      </div>


      
        <div className="watchlist-menu absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onMouseLeave={() => setIsMenuOpen(false)}>
            <button onClick={handleMenuToggle} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-[rgb(var(--color-primary))/0.8] transition-colors">
                <DotsVerticalIcon />
            </button>
            {isLoggedIn && isMenuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-[rgb(var(--surface-2))] rounded-lg shadow-lg p-1 z-10 w-48">
                    <button onClick={handleAddToQueue} disabled={inQueue} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        {inQueue ? <CheckIcon className="w-4 h-4 text-green-400"/> : <ViewListIcon className="w-4 h-4"/>}
                        <span>{inQueue ? 'In Queue' : 'Add to Queue'}</span>
                    </button>
                    <div className="h-px bg-white/10 my-1"></div>
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