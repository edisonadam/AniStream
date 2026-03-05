import React, { useState, useLayoutEffect, useRef, useCallback, useEffect } from 'react';
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
import { useProfileData } from '../hooks/useProfileData';
import { motion, AnimatePresence } from 'motion/react';

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
  const { addToQueue, isInQueue } = useQueue();
  const { getRating } = useProfileData();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inWatchlist = isInWatchlist(anime.id);
  const inQueue = isInQueue(anime.id);
  const currentStatus = getWatchlistStatus(anime.id);
  const userRating = getRating(anime.id);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const [isHovering, setIsHovering] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null | undefined>(undefined);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  
  // Device capability check
  const [canHover, setCanHover] = useState(true);

  const displayTitle = getDisplayTitle(anime, settings);
  const { isNew, episodeNumber } = episodeStatus;

  useEffect(() => {
      // Check if device supports hover (Desktop vs Mobile)
      const mediaQuery = window.matchMedia('(hover: hover)');
      setCanHover(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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

  // Standard interactions
  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Always navigate on click. 
      // On mobile, the lack of hover means this fires immediately on tap.
      onSelect(anime);
  };

  const handleMouseEnter = () => {
      // Only enable trailer preview on devices that support hover (Mouse)
      if (canHover) {
          hoverTimeoutRef.current = window.setTimeout(() => {
              setIsHovering(true);
              fetchTrailer();
          }, 500);
      }
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
    
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(checkOverflow, 100);
    };

    checkOverflow(); 
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

    if (settings.autoSyncAniList && settings.anilistToken) {
        let progress: number | undefined = undefined;
        if (status === 'Completed') {
            progress = anime.totalEpisodes || undefined;
        } else if (status === 'Watching') {
            const watchProgress = getWatchProgress(anime);
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
  
  let badgeText = '';
  if (episodeNumber) {
      badgeText = `${episodeNumber} / ${totalEpisodes || '?'}`;
  } else if (totalEpisodes) {
      badgeText = `${totalEpisodes} Eps`;
  }
  const showBadge = badgeText !== '';

  const ratingColorClass = userRating 
    ? userRating >= 8 ? 'text-green-400 bg-green-400/10' : userRating >= 5 ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'
    : 'text-yellow-400'; // Default for global rating

  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`anime-card-touch-target group relative rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--color-primary),0.5)] overflow-hidden border border-white/5 hover:border-[rgb(var(--color-primary))]/50`}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${displayTitle}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-[2/3] w-full relative bg-black overflow-hidden">
        <img loading="lazy" src={anime.thumbnail} alt={displayTitle} className="w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110" />
        <AnimatePresence>
            {isHovering && trailerKey && !isLoadingTrailer && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 pointer-events-none"
                >
                    <iframe
                        className="w-full h-full pointer-events-none scale-110"
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${trailerKey}`}
                        title={`${displayTitle} trailer`}
                        frameBorder="0"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        tabIndex={-1}
                    ></iframe>
                    <div className="absolute inset-0 bg-black/20" />
                </motion.div>
            )}
        </AnimatePresence>
        {isHovering && isLoadingTrailer && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 pointer-events-none">
                <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))]/50 border-t-[rgb(var(--color-primary))] rounded-full animate-spin"></div>
            </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-300 z-10 pointer-events-none rounded-xl"></div>

      {/* Top-Left Badge Container */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
          {isNew && <span className="order-first px-2 py-1 text-[10px] font-black rounded-lg text-white bg-red-600 shadow-lg shadow-red-600/40 animate-pulse">NEW EP</span>}
          {anime.type && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10">{anime.type.toUpperCase()}</span>
          )}
          {subDubLabel && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10">
                  {subDubLabel}
              </span>
          )}
      </div>

      {/* Top-Right Badge Container */}
      <div className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
          {anime.status === 'Ongoing' && <div title="Ongoing" className="w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-black shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>}
          {anime.status === 'Completed' && <div title="Completed" className="w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-black shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>}
          
          {/* Rating Badge (User's if available, else MAL average) */}
          {(userRating || (anime.rating && anime.rating > 0)) && (
              <div className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-lg bg-black/60 backdrop-blur-md border border-white/10 ${ratingColorClass}`}>
                  <StarIcon className="w-3 h-3" fill="currentColor" />
                  <span>{userRating ? userRating : anime.rating?.toFixed(1)}</span>
              </div>
          )}
      </div>
      
      {/* Bottom-Right Badge Container (Episode Info) */}
      <div className="absolute bottom-14 right-2.5 z-20 flex flex-row-reverse items-center gap-1.5 pointer-events-none">
          {anime.type === 'Movie' && anime.runtime ? (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10">{formatDuration(anime.runtime)}</span>
          ) : anime.avgEpisodeDuration ? (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10">~{anime.avgEpisodeDuration}m</span>
          ) : null}
          {showBadge && (
            <div
                className="inline-flex items-center rounded-lg bg-cyan-500/20 px-2 py-0.5 text-[10px] font-black text-cyan-400 backdrop-blur-md border border-cyan-500/30"
            >
                {badgeText}
            </div>
          )}
      </div>

        <div className={`watchlist-menu absolute top-2.5 right-2.5 z-30 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onMouseLeave={() => setIsMenuOpen(false)} onClick={e => e.stopPropagation()}>
            <button onClick={handleMenuToggle} title="More options" className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[rgb(var(--color-primary))] transition-all border border-white/10 shadow-lg">
                <DotsVerticalIcon className="w-4 h-4" />
            </button>
            <AnimatePresence>
                {isLoggedIn && isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute top-full right-0 mt-2 bg-[rgb(var(--surface-2))] rounded-2xl shadow-2xl p-1.5 z-40 w-52 border border-white/10 backdrop-blur-xl"
                    >
                        <button onClick={handleAddToQueue} disabled={inQueue} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {inQueue ? <CheckIcon className="w-4 h-4 text-green-400"/> : <ViewListIcon className="w-4 h-4"/>}
                            <span>{inQueue ? 'In Queue' : 'Add to Queue'}</span>
                        </button>
                        <div className="h-px bg-white/10 my-1.5 mx-2"></div>
                        {WATCHLIST_STATUSES.map(status => (
                            <button key={status} onClick={(e) => handleWatchlistClick(e, status)} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-xl transition-colors">
                               <div className="w-4 h-4 flex items-center justify-center">
                                    {currentStatus === status && <CheckIcon className="w-4 h-4 text-[rgb(var(--color-primary-accent))]"/>}
                               </div>
                               <span>{status}</span>
                            </button>
                        ))}
                        {inWatchlist && (
                            <>
                                <div className="h-px bg-white/10 my-1.5 mx-2"></div>
                                <button onClick={handleRemoveFromWatchlist} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-left text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                                    <PlusIcon className="w-4 h-4 rotate-45"/>
                                    <span>Remove</span>
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none z-20">
        <div className="w-full overflow-hidden">
            <h3 ref={titleRef} className={`text-white font-bold text-sm truncate transition-colors duration-300 ${!isOverflowing ? 'group-hover:text-[rgb(var(--color-primary-accent))]' : 'group-hover:hidden'}`}>
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
        {currentStatus && <p className="text-[10px] font-black text-[rgb(var(--color-primary-accent))] uppercase tracking-wider mt-0.5">{currentStatus}</p>}
      </div>
    </motion.div>
  );
};

export default React.memo(AnimeCard);