
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Anime } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon, PlusIcon, StarIcon, CheckIcon } from './icons/Icons';
import { useWatchLater } from '../hooks/useWatchLater';
import { useAuth } from '../hooks/useAuth';

interface FeaturedCarouselProps {
  animeList: Anime[];
  onAnimeSelect: (anime: Anime) => void;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ animeList, onAnimeSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addToWatchLater, isInWatchLater } = useWatchLater();
  const { isLoggedIn } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const slides = animeList.slice(0, 5);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    intervalRef.current = setInterval(nextSlide, 5000);
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
    }, 5000); // Resume after 5s of inactivity
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


  if (slides.length === 0) {
    return (
      <section className="relative w-full h-[60vh] md:h-[85vh] bg-[rgb(var(--surface-2))/0.5] animate-pulse"></section>
    );
  }

  const currentSlide = slides[currentIndex];
  const inWatchLater = isInWatchLater(currentSlide.id);

  return (
    <section 
      className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden group"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
          <img src={slide.bannerImage} alt={slide.title} className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Gradient Fades */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[rgb(var(--bg-gradient-via))] via-[rgb(var(--bg-gradient-via))/0.7] to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[rgb(var(--bg-gradient-via))] via-[rgb(var(--bg-gradient-via))/0.8] to-transparent z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent w-1/2 z-10"></div>

      {/* Content */}
      <div className="absolute bottom-10 md:bottom-20 left-4 md:left-12 text-white max-w-xl z-20">
        <h2 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl" style={{textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
          {currentSlide.title}
        </h2>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-[rgb(var(--text-secondary))]" style={{textShadow: '0 2px 8px rgba(0,0,0,0.7)'}}>
            {currentSlide.type && <span className="font-semibold">{currentSlide.type}</span>}
            {currentSlide.rating && (
                <div className="flex items-center gap-1.5">
                    <StarIcon className="w-5 h-5 text-[rgb(var(--color-warning))]" />
                    <span className="font-semibold">{currentSlide.rating.toFixed(1)}</span>
                </div>
            )}
            <p className="hidden sm:block">{currentSlide.genres.slice(0, 3).join(' • ')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onAnimeSelect(currentSlide)} className="flex items-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.4] hover:shadow-[rgb(var(--shadow-color))/0.6]">
            <InfoIcon />
            <span>More Info</span>
          </button>
          {isLoggedIn && (
            <button
              onClick={() => !inWatchLater && addToWatchLater(currentSlide)}
              disabled={inWatchLater}
              className="flex items-center gap-2 px-5 py-3 bg-[rgb(var(--surface-3))/0.6] text-white rounded-lg font-semibold hover:bg-[rgb(var(--surface-4))] transition-colors backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {inWatchLater ? <CheckIcon/> : <PlusIcon/>}
              <span>{inWatchLater ? 'Added' : 'Add to Watchlist'}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <button onClick={goToPrev} className="absolute top-1/2 left-4 transform -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[rgb(var(--color-primary))/0.5] z-20" aria-label="Previous slide">
        <ChevronLeftIcon />
      </button>
      <button onClick={goToNext} className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-[rgb(var(--color-primary))/0.5] z-20" aria-label="Next slide">
        <ChevronRightIcon />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button key={index} onClick={() => goToSlide(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-[rgb(var(--shadow-color))] scale-125' : 'bg-gray-500/50 hover:bg-gray-400'}`}></button>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCarousel;