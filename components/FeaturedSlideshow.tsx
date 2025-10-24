import React, { useState, useEffect, useCallback } from 'react';
import { FEATURED_SLIDES } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from './icons/Icons';

const FeaturedSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % FEATURED_SLIDES.length);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + FEATURED_SLIDES.length) % FEATURED_SLIDES.length);
  };

  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with a browser-compatible type for setInterval's return value.
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      intervalId = setInterval(nextSlide, 5000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, nextSlide]);

  const currentSlide = FEATURED_SLIDES[currentIndex];

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden group">
      <div className="w-full h-full">
        {FEATURED_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 md:bottom-20 left-4 md:left-12 text-white">
        <h2 className="text-3xl md:text-5xl font-bold mb-2 animate-fade-in-up" style={{textShadow: '0 2px 10px rgba(0,0,0,0.7)'}}>
            {currentSlide.title}
        </h2>
        <p className="text-lg md:text-xl text-gray-300 animate-fade-in-up" style={{animationDelay: '0.3s', textShadow: '0 2px 5px rgba(0,0,0,0.5)'}}>
            {currentSlide.subtitle}
        </p>
      </div>

      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-purple-600/50"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon />
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-purple-600/50"
        aria-label="Next slide"
      >
        <ChevronRightIcon />
      </button>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-4 right-4 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-purple-600/50"
        aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {FEATURED_SLIDES.map((_, index) => (
            <button key={index} onClick={() => setCurrentIndex(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-purple-500' : 'bg-gray-500/50'}`}></button>
        ))}
      </div>
    </section>
  );
};

export default FeaturedSlideshow;