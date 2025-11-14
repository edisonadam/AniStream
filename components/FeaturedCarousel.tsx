import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Anime } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PlusIcon, StarIcon, CheckIcon, InfoIcon } from './icons/Icons';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle, formatDuration } from '../utils';
import { updateAnilistEntry, fetchWithRetry } from '../api';
import { loadYouTubeAPI } from '../youtubeApi';

declare global {
  interface Window {
    YT: any;
  }
}

interface FeaturedCarouselProps {
  animeList: Anime[];
  onAnimeSelect: (anime: Anime) => void;
  onDetailsSelect: (anime: Anime) => void;
  isLoading: boolean;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const YouTubeBackgroundPlayer: React.FC<{ videoId: string; onError: () => void }> = ({ videoId, onError: handlePlayerError }) => {
    const playerRef = useRef<HTMLDivElement>(null);
    const ytPlayer = useRef<any>(null);

    useEffect(() => {
        if (!videoId || !playerRef.current) return;

        const playerElement = playerRef.current; // Capture ref value
        
        const getValidOrigin = (): string | undefined => {
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                return window.location.origin;
            }
            if (window.location.protocol === 'blob:') {
                const match = window.location.href.match(/^blob:(https?:\/\/[^/]+)/);
                if (match && match[1]) {
                    return match[1];
                }
            }
            return undefined;
        };

        const initializePlayer = async () => {
            try {
                await loadYouTubeAPI();
                
                if (!playerElement || ytPlayer.current) return;

                const onError = (event: any) => {
                    const payload = {
                        timestamp: new Date().toISOString(),
                        videoId,
                        pageUrl: window.location.href,
                        userAgent: navigator.userAgent,
                        playerError: event.data,
                        location: 'FeaturedCarousel'
                    };
                    console.error('YouTube Player Error Report:', payload);
                    handlePlayerError();
                };

                const playerVars: any = {
                    autoplay: 1,
                    controls: 0,
                    showinfo: 0,
                    rel: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    loop: 1,
                    playlist: videoId,
                    mute: 1,
                    playsinline: 1,
                };
                
                const origin = getValidOrigin();
                if (origin) {
                    playerVars.origin = origin;
                }

                // FIX: Cast window to any to access YT property for YouTube IFrame API
                ytPlayer.current = new (window as any).YT.Player(playerElement, {
                    videoId: videoId,
                    playerVars: playerVars,
                    events: {
                        onReady: (event: any) => event.target.playVideo(),
                        onStateChange: (event: any) => {
                            // FIX: Cast window to any to access YT property for YouTube IFrame API
                            if (event.data === (window as any).YT.PlayerState.ENDED) {
                                ytPlayer.current?.seekTo(0);
                            }
                        },
                        onError: onError,
                    },
                });
            } catch (error) {
                console.error("Failed to initialize YouTube player in carousel:", error);
                handlePlayerError();
            }
        };

        initializePlayer();

        return () => {
            ytPlayer.current?.destroy();
            ytPlayer.current = null;
        };
    }, [videoId, handlePlayerError]);


    return (
        <div
            ref={playerRef}
            className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[100vw] -translate-x-1/2 -translate-y-1/2 scale-105"
        />
    );
};


const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ animeList, onAnimeSelect, onDetailsSelect, isLoading, getEpisodeStatus, onLoginRequest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addToWatchlist, isInWatchlist } = useWatchlist();
  const { isLoggedIn } = useAuth();
  const { settings } = useSettings();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const [trailers, setTrailers] = useState<Record<number, string>>({});
  const [trailerErrors, setTrailerErrors] = useState<Set<number>>(new Set());
  const [showVideo, setShowVideo] = useState(false);

  const slides = animeList.slice(0, 5);

  useEffect(() => {
    if (slides.length > 0 && settings.homepageTrailer) {
        slides.forEach(slide => {
            if (!trailers[slide.id]) {
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${slide.id}/videos`)
                    .then(res => res.ok ? res.json() : Promise.resolve({ data: {} }))
                    .then(data => {
                        const trailer = data.data?.promo?.[0]?.trailer?.embed_url;
                        if (trailer) {
                            setTrailers(prev => ({ ...prev, [slide.id]: trailer }));
                        }
                    })
                    .catch(console.error);
            }
        });
    }
  }, [slides, settings.homepageTrailer, trailers]);
  
  useEffect(() => {
    setShowVideo(false); // Hide video when slide changes
    const timer = setTimeout(() => {
        setShowVideo(true);
    }, 2000); // 2 second delay for banner
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 0) {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  }, [slides.length]);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    intervalRef.current = setInterval(nextSlide, 12000); // 2s banner + 10s video
  }, [stopAutoPlay, nextSlide]);

  useEffect(() => {
    if (slides.length > 0) {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [slides.length, startAutoPlay, stopAutoPlay]);

  const handleManualInteraction = useCallback(() => {
    stopAutoPlay();
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      startAutoPlay();
    }, 12000); // Resume after 12s of inactivity
  }, [stopAutoPlay, resetTimeout, startAutoPlay]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    handleManualInteraction();
  };

  const goToPrev = () => {
    prevSlide();
    handleManualInteraction();
  };
  
  const goToNext = () => {
    nextSlide();
    handleManualInteraction();
  };
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); // Reset touch end position
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  const handleAddToWatchlist = () => {
      if (!currentSlide) return;
      if (inWatchlist) return;
      const status = 'Plan to Watch';
      addToWatchlist(currentSlide, status);
      if (settings.autoSyncAniList && settings.anilistToken) {
          updateAnilistEntry(currentSlide.id, settings.anilistToken, { status });
      }
  };
  
  const handleTrailerError = useCallback((slideId: number) => {
    setTrailerErrors(prev => new Set(prev).add(slideId));
  }, []);


  if (isLoading) {
    return (
        <section className="relative w-full h-[90vh] bg-[rgb(var(--surface-2))] animate-pulse">
            <div className="absolute bottom-10 md:bottom-20 left-4 md:left-12 max-w-xl z-20 space-y-4">
                <div className="h-10 md:h-16 bg-[rgb(var(--surface-3))] rounded-lg w-3/4"></div>
                <div className="h-6 bg-[rgb(var(--surface-3))] rounded-md w-1/2"></div>
                <div className="flex items-center gap-3">
                    <div className="h-12 bg-[rgb(var(--surface-4))] rounded-full w-36"></div>
                    <div className="h-12 bg-[rgb(var(--surface-4))] rounded-full w-48"></div>
                </div>
            </div>
        </section>
    );
  }
  
  if (slides.length === 0) {
      return null;
  }

  const currentSlide = slides[currentIndex];
  const inWatchlist = currentSlide ? isInWatchlist(currentSlide.id) : false;
  const displayTitle = currentSlide ? getDisplayTitle(currentSlide, settings) : '';
  const { isNew, episodeNumber } = currentSlide ? getEpisodeStatus(currentSlide.id) : { isNew: false, episodeNumber: null };

  return (
    <section 
      className="relative w-full h-[90vh] overflow-hidden group mb-8"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, index) => {
          const trailerUrl = settings.homepageTrailer ? trailers[slide.id] : null;
          const isActive = index === currentIndex;
          const videoId = trailerUrl ? getYouTubeId(trailerUrl) : null;
          const hasError = trailerErrors.has(slide.id);
          
          return (
            <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                <img loading="lazy" src={slide.bannerImage} alt={getDisplayTitle(slide, settings)} className={`w-full h-full object-cover ${isActive ? 'animate-ken-burns' : ''}`} />
                {isActive && videoId && !hasError && showVideo && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none animate-cinematic-fade-in" style={{ animationDuration: '1.5s' }}>
                       <YouTubeBackgroundPlayer videoId={videoId} onError={() => handleTrailerError(slide.id)} />
                    </div>
                )}
            </div>
          )
      })}

      {/* Gradient Fades */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-[rgb(var(--bg-gradient-start))] to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-[rgb(var(--bg-gradient-start))] to-transparent z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent w-3/4 z-10"></div>

      {/* Content */}
      {currentSlide && (
        <div className="absolute bottom-10 md:bottom-20 left-4 md:left-12 text-white max-w-2xl z-20">
            <div key={currentIndex} className="animate-subtle-fade-in-up">
              <h2 className="text-4xl md:text-6xl font-black mb-3 drop-shadow-2xl" style={{textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
                {displayTitle}
              </h2>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-gray-300 font-medium" style={{textShadow: '0 2px 8px rgba(0,0,0,0.7)'}}>
                  {isNew && <span className="px-2 py-1 text-sm font-bold rounded-md bg-red-600 text-white animate-pulse">NEW EPISODE</span>}
                  {currentSlide.status === 'Ongoing' && episodeNumber && (currentSlide.totalEpisodes || currentSlide.episodes_count) && (
                      <span
                          className="inline-flex items-center rounded-md bg-cyan-500/20 px-2 py-1 text-sm font-semibold text-cyan-300 backdrop-blur-sm"
                          title={`Episode ${episodeNumber} of ${currentSlide.totalEpisodes || currentSlide.episodes_count} released`}
                      >
                          Ep {episodeNumber} / {currentSlide.totalEpisodes || currentSlide.episodes_count}
                      </span>
                  )}
                  {currentSlide.type && <span>{currentSlide.type}</span>}
                  {currentSlide.type === 'Movie' && currentSlide.runtime && <span>{formatDuration(currentSlide.runtime)}</span>}
                  {currentSlide.rating && (
                      <div className="flex items-center gap-1.5">
                          <StarIcon className="w-5 h-5 text-[rgb(var(--color-warning))]" />
                          <span>{currentSlide.rating.toFixed(1)}</span>
                      </div>
                  )}
                  <span>{currentSlide.genres.slice(0, 3).join(' • ')}</span>
              </div>
              <p className="line-clamp-3 text-gray-200 mb-6 max-w-lg">{currentSlide.synopsis}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => onAnimeSelect(currentSlide)} className="flex items-center gap-2 px-6 py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-transform duration-300 hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.4] hover:shadow-[rgb(var(--shadow-color))/0.6]">
                  <PlayIcon className="w-6 h-6"/>
                  <span>Watch Now</span>
                </button>
                <button onClick={() => onDetailsSelect(currentSlide)} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-transform duration-300 hover:scale-105 backdrop-blur-sm">
                    <InfoIcon className="w-6 h-6"/>
                    <span>Details</span>
                </button>
                <button
                  onClick={() => {
                      if (!isLoggedIn) {
                          onLoginRequest("Please log in to manage your watchlist.");
                      } else {
                          handleAddToWatchlist();
                      }
                  }}
                  disabled={inWatchlist}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed">
                  {inWatchlist ? <CheckIcon/> : <PlusIcon/>}
                  <span>{inWatchlist ? 'In List' : 'Add to List'}</span>
                </button>
              </div>
            </div>
        </div>
      )}
      
      {/* Navigation */}
      <button onClick={goToPrev} className="absolute top-1/2 left-4 transform -translate-y-1/2 p-3 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[rgb(var(--color-primary))] hover:scale-110 z-20" aria-label="Previous slide">
        <ChevronLeftIcon className="w-8 h-8"/>
      </button>
      <button onClick={goToNext} className="absolute top-1/2 right-4 transform -translate-y-1/2 p-3 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[rgb(var(--color-primary))] hover:scale-110 z-20" aria-label="Next slide">
        <ChevronRightIcon className="w-8 h-8"/>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button 
            key={index} 
            onClick={() => goToSlide(index)} 
            className={`w-8 h-1.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-[rgb(var(--color-primary-accent))]' : 'bg-gray-500/50 hover:bg-gray-400'}`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
