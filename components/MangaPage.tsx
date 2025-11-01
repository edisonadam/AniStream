import React, { useState, useEffect, useCallback } from 'react';
import type { Manga } from '../types';
import { mapJikanToManga, fetchWithRetry } from '../api';
import { ChevronLeftIcon, SearchIcon } from './icons/Icons';
import MangaCard from './MangaCard';
import { useSettings } from '../hooks/useSettings';
import { MANGA_TYPES, MANGA_STATUSES } from '../constants';

// Skeleton for loading
const MangaCardSkeleton: React.FC = () => (
    <div className="rounded-[2rem] bg-[rgb(var(--surface-2))] animate-pulse">
        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-lg"></div>
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
  const { settings } = useSettings();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('popularity'); // popularity, score, title, start_date

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchManga = useCallback(async (pageNum: number, isNewSearch: boolean) => {
    if (isNewSearch) setIsLoading(true); else setIsLoadingMore(true);
    setError(null);

    const isSearching = debouncedQuery || typeFilter || statusFilter;
    // Use /manga for search/filter, /top/manga for default browsing
    const endpoint = isSearching ? 'manga' : 'top/manga';
    
    const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '24'
    });
    
    if (settings.restrictAdultContent) {
        params.append('sfw', 'true');
    }

    if (isSearching) {
        if (debouncedQuery) params.append('q', debouncedQuery);
        if (typeFilter) params.append('type', typeFilter);
        if (statusFilter) params.append('status', statusFilter);
        
        switch (sort) {
            case 'title': params.append('order_by', 'title'); params.append('sort', 'asc'); break;
            case 'start_date': params.append('order_by', 'start_date'); params.append('sort', 'desc'); break;
            case 'score': params.append('order_by', 'score'); params.append('sort', 'desc'); break;
            default: params.append('order_by', 'members'); params.append('sort', 'desc'); break;
        }
    }


    try {
      const res = await fetchWithRetry(`https://api.jikan.moe/v4/${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch manga from Jikan API.');

      const data = await res.json();
      let newManga = data.data.map(mapJikanToManga).filter(Boolean);
      if (settings.restrictAdultContent) {
          newManga = newManga.filter((m: Manga) => !m.isAdult);
      }

      setManga(prev => isNewSearch ? newManga : [...prev, ...newManga]);
      setHasMore(data.pagination?.has_next_page ?? false);
      setPage(pageNum);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [settings.restrictAdultContent, debouncedQuery, typeFilter, statusFilter, sort]);

  useEffect(() => {
    fetchManga(1, true);
  }, [fetchManga, debouncedQuery, typeFilter, statusFilter, sort]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchManga(page + 1, false);
    }
  };

  const FilterSelect: React.FC<{ value: string, onChange: (val: string) => void, options: string[], placeholder: string }> = ({ value, onChange, options, placeholder }) => (
      <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all capitalize"
      >
          <option value="">{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt} className="capitalize">{opt.replace(/_/g, ' ')}</option>)}
      </select>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
        <span>Back to Browse</span>
      </button>

      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        Discover Manga
      </h1>
      
       <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon /></div>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search manga..."
                    className="w-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-color))] rounded-lg py-2 pl-10 pr-4 text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] focus:ring-1 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
                />
            </div>
             <div className="flex items-center gap-2 flex-wrap justify-center">
                <FilterSelect value={typeFilter} onChange={setTypeFilter} options={MANGA_TYPES} placeholder="All Types" />
                <FilterSelect value={statusFilter} onChange={setStatusFilter} options={MANGA_STATUSES} placeholder="All Statuses" />
                <select value={sort} onChange={e => setSort(e.target.value)} className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all">
                    <option value="popularity">Popularity</option>
                    <option value="score">Score</option>
                    <option value="start_date">Newest</option>
                    <option value="title">A-Z</option>
                </select>
            </div>
       </div>

      {error ? (
        <div className="text-center p-12 text-[rgb(var(--color-danger))]">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {isLoading && manga.length === 0 
              ? Array.from({ length: 12 }).map((_, i) => <MangaCardSkeleton key={i} />)
              : manga.length > 0 ? manga.map(item => <MangaCard key={item.id} manga={item} />)
              : !isLoading && <div className="col-span-full text-center p-12 bg-[rgb(var(--surface-2))/0.5] rounded-2xl text-[rgb(var(--text-muted))]">No manga found for your criteria.</div>
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