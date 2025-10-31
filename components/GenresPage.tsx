
import React from 'react';
import { GENRES } from '../constants';
import { ChevronLeftIcon } from './icons/Icons';

interface GenresPageProps {
  onGoBack: () => void;
  onGenreSelect: (genre: string) => void;
}

const GenresPage: React.FC<GenresPageProps> = ({ onGoBack, onGenreSelect }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
        <span>Back to Browse</span>
      </button>
      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        All Genres
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => onGenreSelect(genre)}
            className="p-6 bg-[rgb(var(--surface-2))/0.6] rounded-xl text-center font-semibold text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--color-primary))/0.5] hover:scale-105 transition-all duration-300"
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenresPage;
