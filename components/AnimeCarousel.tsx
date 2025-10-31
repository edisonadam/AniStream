import React, { useRef } from 'react';
import type { Anime } from '../types';
import AnimeCard from './AnimeCard';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface AnimeCarouselProps {
  title: string;
  animeList: Anime[];
  onAnimeSelect: (anime: Anime) => void;
  isLoading: boolean;
}

const AnimeCarousel: React.FC<AnimeCarouselProps> = ({ title, animeList, onAnimeSelect, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  if (!isLoading && animeList.length === 0) {
      return null;
  }

  return (
    <section className="py-4 md:py-6 relative group">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] mb-6" style={{ textShadow: `0 0 10px rgb(var(--shadow-color) / 0.5)` }}>
          {title}
        </h2>

        <div className="relative">
            <div
                ref={scrollContainerRef}
                className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
                style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
            >
                {isLoading ? (
                    Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="flex-shrink-0 w-40 sm:w-48">
                            <AnimeCardSkeleton />
                        </div>
                    ))
                ) : (
                    animeList.map((anime, index) => (
                        <div key={anime.id} className="flex-shrink-0 w-40 sm:w-48 animate-subtle-fade-in-up" style={{ animationDelay: `${index * 40}ms` }}>
                            <AnimeCard anime={anime} onSelect={onAnimeSelect} />
                        </div>
                    ))
                )}
            </div>
            {/* Desktop Navigation Arrows */}
            <div className="hidden md:block">
                <button
                    onClick={() => scroll('left')}
                    className="absolute top-1/2 -translate-y-1/2 -left-4 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[rgb(var(--color-primary))] hover:scale-110 z-20"
                    aria-label="Scroll left"
                >
                    <ChevronLeftIcon className="w-8 h-8"/>
                </button>
                <button
                    onClick={() => scroll('right')}
                    className="absolute top-1/2 -translate-y-1/2 -right-4 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[rgb(var(--color-primary))] hover:scale-110 z-20"
                    aria-label="Scroll right"
                >
                    <ChevronRightIcon className="w-8 h-8"/>
                </button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default AnimeCarousel;