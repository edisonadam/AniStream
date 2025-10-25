
import React from 'react';
import AnimeCard from './AnimeCard';
import type { Anime, Filter } from '../types';

interface AnimeGridProps {
  onAnimeSelect: (anime: Anime) => void;
  animeList: Anime[];
  title: string;
  filters: Filter;
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ onAnimeSelect, animeList, title, filters }) => {
  const hasActiveFilters = Object.values(filters).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    return !!v;
  });

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold mb-8 text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        {title}
      </h2>
      {animeList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {animeList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onSelect={onAnimeSelect} />
          ))}
        </div>
      ) : (
        <div className="text-center text-[rgb(var(--text-muted))] p-12 text-lg bg-[rgb(var(--surface-2))/0.5] rounded-2xl">
            <p className="text-2xl mb-2">🎬</p>
            {filters.query ? (
                 <>
                    <p className="font-semibold text-[rgb(var(--text-primary))]">No results found for "{filters.query}"</p>
                    <p>Try a different search or clear some filters.</p>
                </>
            ) : hasActiveFilters ? (
                 <>
                    <p className="font-semibold text-[rgb(var(--text-primary))]">No anime found matching your filters.</p>
                    <p>Try adjusting or clearing your filters!</p>
                 </>
            ) : (
                <>
                    <p className="font-semibold text-[rgb(var(--text-primary))]">No anime to display.</p>
                    <p>There might be an issue fetching data. Please try again later.</p>
                </>
            )}
        </div>
      )}
    </section>
  );
};

export default AnimeGrid;