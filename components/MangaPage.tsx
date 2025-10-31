import React, { useState, useEffect, useCallback } from 'react';
import type { Manga } from '../types';
import { mapJikanToManga } from '../api';
import { ChevronLeftIcon } from './icons/Icons';
import MangaCard from './MangaCard';

// Skeleton for loading
const MangaCardSkeleton: React.FC = () => (
    <div className="rounded-[2rem] bg-[rgb(var(--surface-2))] animate-pulse">
        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-lg"></div>
        <div className="p-3">
            <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
        </div>
    </div>
);

interface MangaPageProps {
  onGoBack: () => void;
}

const MangaPage: React.FC<MangaPageProps> = ({ onGoBack }) => {
  const [manga, setManga] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchManga = useCallback(async (pageNum: number, isNewSearch: boolean) => {
    if (isNewSearch) setIsLoading(true); else setIsLoadingMore(true);
    setError(null);

    try {
      let res = await fetch(`https://api.jikan.moe/v4/top/manga?page=${pageNum}&limit=24`);
      if (res.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        res = await fetch(`https://api.jikan.moe/v4/top/manga?page=${pageNum}&limit=24`);
      }
      if (!res.ok) throw new Error('Failed to fetch manga from Jikan API.');

      const data = await res.json();
      const newManga = data.data.map(mapJikanToManga).filter(Boolean);

      setManga(prev => isNewSearch ? newManga : [...prev, ...newManga]);
      setHasMore(data.pagination?.has_next_page ?? false);
      setPage(pageNum);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchManga(1, true);
  }, [fetchManga]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchManga(page + 1, false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
        <span>Back to Browse</span>
      </button>

      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        Top Manga
      </h1>

      {error ? (
        <div className="text-center p-12 text-[rgb(var(--color-danger))]">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {isLoading && manga.length === 0 
              ? Array.from({ length: 12 }).map((_, i) => <MangaCardSkeleton key={i} />)
              : manga.map(item => <MangaCard key={item.id} manga={item} />)
            }
            {isLoadingMore && Array.from({ length: 6 }).map((_, i) => <MangaCardSkeleton key={`loading-${i}`} />)}
          </div>

          {hasMore && !isLoading && !isLoadingMore && manga.length > 0 && (
            <div className="text-center mt-12">
              <button onClick={loadMore} className="px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MangaPage;
