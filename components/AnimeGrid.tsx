import React, { useRef, useEffect } from 'react';
import AnimeCard from './AnimeCard';
import type { Anime, Filter, Settings } from '../types';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import { SearchIcon } from './icons/Icons';

interface AnimeGridProps {
  onAnimeSelect: (anime: Anime) => void;
  animeList: Anime[];
  title: string;
  filters: Filter;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  sortValue: Filter['sort'];
  onSortChange?: (sort: Filter['sort']) => void;
  loadMoreMode: Settings['loadMoreMode'];
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  currentPage: number;
  totalPages: number;
  isPreloading?: boolean;
  onCollapse?: () => void;
  onLoginRequest: (reason: string) => void;
  onRetry?: () => void;
}

const ANIME_PAGE_SIZE = 25; // As defined in App.tsx fetch logic

const AnimeGrid: React.FC<AnimeGridProps> = ({ onAnimeSelect, animeList, title, filters, isLoading, onLoadMore, hasMore, isLoadingMore, sortValue, onSortChange, loadMoreMode, getEpisodeStatus, currentPage, totalPages, isPreloading = false, onCollapse, onLoginRequest, onRetry }) => {
  const hasActiveFilters = Object.values(filters).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string' && v !== 'popularity') return true;
    return false;
  });

  const lastElementRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Effect for infinite scrolling using IntersectionObserver (for user scrolling)
  useEffect(() => {
    if (loadMoreMode !== 'auto' || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { rootMargin: '1600px' } // Load content when it's 1600px away from the viewport for a super smooth experience
    );

    const currentElement = lastElementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [onLoadMore, hasMore, isLoading, isLoadingMore, loadMoreMode]);

  // Effect to automatically load more content if the viewport isn't full,
  // which often happens after applying filters that reduce the item count.
  useEffect(() => {
    if (loadMoreMode !== 'auto') return;
      
    const fillViewport = () => {
      // Don't run if we are already loading, have no more items, or the ref is not attached.
      if (isLoading || isLoadingMore || !hasMore || !gridContainerRef.current) {
        return;
      }
      
      // Check if the bottom of the grid is above the bottom of the viewport.
      const rect = gridContainerRef.current.getBoundingClientRect();
      if (rect.bottom > 0 && rect.bottom < window.innerHeight) {
        onLoadMore();
      }
    };

    // Use a timeout to allow the DOM to render the new items before checking.
    // The dependency on `animeList` will cause this to re-run if more items are loaded,
    // creating a loop until the viewport is full or we run out of items.
    const timer = setTimeout(fillViewport, 300);

    return () => clearTimeout(timer);
  }, [animeList, hasMore, isLoading, isLoadingMore, onLoadMore, loadMoreMode]);


  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 anime-grid-section">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
          {title}
        </h2>
        <div className="flex items-center gap-4 self-end sm:self-center">
            {totalPages > 0 && (
                 <span className="text-sm font-semibold text-[rgb(var(--text-muted))] whitespace-nowrap">
                    Page {currentPage} / {totalPages}
                </span>
            )}
            {onCollapse && currentPage > 1 && (
                <button
                    onClick={onCollapse}
                    className="px-3 py-1.5 text-xs bg-[rgb(var(--surface-3))] hover:bg-[rgb(var(--surface-4))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] rounded-lg font-semibold transition-colors"
                >
                    Collapse All
                </button>
            )}
            {onSortChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="sort-by" className="text-sm font-semibold text-[rgb(var(--text-muted))]">Sort by:</label>
                <select
                  id="sort-by"
                  value={sortValue || 'popularity'}
                  onChange={(e) => onSortChange(e.target.value as Filter['sort'])}
                  className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-1.5 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
                >
                  <option value="popularity">Popularity</option>
                  <option value="release_date">Newest</option>
                  <option value="alphabetical">A-Z</option>
                </select>
              </div>
            )}
        </div>
      </div>
      {isLoading && animeList.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <AnimeCardSkeleton key={index} />
          ))}
        </div>
      ) : animeList.length > 0 ? (
        <>
            <div ref={gridContainerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {animeList.map((anime, index) => (
                <div key={anime.id} className="animate-subtle-fade-in-up" style={{ animationDelay: `${(index % ANIME_PAGE_SIZE) * 30}ms` }}>
                    <AnimeCard anime={anime} onSelect={onAnimeSelect} episodeStatus={getEpisodeStatus(anime.id)} onLoginRequest={onLoginRequest} />
                </div>
              ))}
            </div>

            {loadMoreMode === 'auto' && <div ref={lastElementRef} style={{ height: '1px' }} />}

            {isLoadingMore && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-6">
                    {Array.from({ length: 6 }).map((_, index) => <AnimeCardSkeleton key={index} />)}
                </div>
            )}
            
            {loadMoreMode === 'manual' && hasMore && !isLoading && (
                <div className="text-center mt-12">
                    <button onClick={onLoadMore} disabled={isLoadingMore || isPreloading} className="px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3] disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoadingMore || isPreloading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}

            {!hasMore && animeList.length > 0 && (
                <div className="text-center text-[rgb(var(--text-muted))] pt-12 text-lg">
                    <p>You've reached the end!</p>
                </div>
            )}
        </>
      ) : (
        <div className="text-center text-[rgb(var(--text-muted))] p-12 text-lg bg-[rgb(var(--surface-2))/0.5] rounded-2xl flex flex-col items-center gap-4">
            <SearchIcon className="w-16 h-16 text-[rgb(var(--text-muted))]/50" />
            {filters.query ? (
                 <>
                    <p className="font-semibold text-lg text-[rgb(var(--text-primary))]">No results found for "{filters.query}"</p>
                    <p>Try a different search term or adjust your filters.</p>
                </>
            ) : hasActiveFilters ? (
                 <>
                    <p className="font-semibold text-lg text-[rgb(var(--text-primary))]">No anime found matching your filters.</p>
                    <p>Try adjusting or clearing them for more results!</p>
                 </>
            ) : (
                <>
                    <p className="font-semibold text-lg text-[rgb(var(--text-primary))]">Nothing to see here... yet!</p>
                    <p>There might be an issue fetching data, or the library is empty.</p>
                    {onRetry && (
                        <button 
                            onClick={onRetry}
                            className="mt-4 px-6 py-2 bg-[rgb(var(--surface-3))] hover:bg-[rgb(var(--surface-4))] text-[rgb(var(--text-primary))] rounded-xl font-semibold transition-all"
                        >
                            Retry Fetch
                        </button>
                    )}
                </>
            )}
        </div>
      )}
    </section>
  );
};

export default AnimeGrid;