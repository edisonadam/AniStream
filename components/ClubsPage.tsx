import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Club } from '../types';
import ClubCard from './ClubCard';
import { SearchIcon, ChevronLeftIcon } from './icons/Icons';
import { fetchWithRetry } from '../api';

const ClubCardSkeleton: React.FC = () => (
    <div className="rounded-3xl bg-[rgb(var(--surface-2))] animate-pulse">
        <div className="aspect-[4/3] w-full bg-[rgb(var(--surface-3))] rounded-t-3xl"></div>
        <div className="p-4">
            <div className="h-5 bg-[rgb(var(--surface-4))] rounded w-3/4 mb-3"></div>
            <div className="flex justify-between">
                <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-1/4"></div>
                <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-1/3"></div>
            </div>
        </div>
    </div>
);

interface ClubsPageProps {
  onClubSelect: (club: Club) => void;
  onGoBack?: () => void;
  isTabbed?: boolean;
  onCreateClub?: () => void;
  userCreatedClubs?: Club[];
}

const ClubsPage: React.FC<ClubsPageProps> = ({ onClubSelect, onGoBack, isTabbed = false, onCreateClub, userCreatedClubs = [] }) => {
  const [jikanClubs, setJikanClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchClubs = useCallback(async (pageNum: number, isNewSearch: boolean) => {
    if (isNewSearch) setIsLoading(true); else setIsLoadingMore(true);
    setError(null);

    const params = new URLSearchParams({ page: pageNum.toString(), limit: '24' });
    if (debouncedQuery) params.append('q', debouncedQuery);

    try {
        const res = await fetchWithRetry(`https://api.jikan.moe/v4/clubs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch clubs from Jikan API.');

        const data = await res.json();
        const newClubs = data.data.filter((c: any) => c?.mal_id && c?.name && c?.images?.jpg?.image_url);

        setJikanClubs(prev => isNewSearch ? newClubs : [...prev, ...newClubs]);
        setHasMore(data.pagination?.has_next_page ?? false);
        setPage(pageNum);

    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    setJikanClubs([]);
    setPage(1);
    setHasMore(true);
    fetchClubs(1, true);
  }, [debouncedQuery, fetchClubs]);

  const allClubs = useMemo(() => {
      const combined = [...userCreatedClubs, ...jikanClubs];
      const filtered = debouncedQuery 
        ? combined.filter(c => c.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
        : combined;
      // Remove duplicates that might come from Jikan after a user creates a club that now exists on MAL
      return Array.from(new Map(filtered.map(c => [c.mal_id, c])).values());
  }, [userCreatedClubs, jikanClubs, debouncedQuery]);


  const loadMore = () => {
    if (!isLoadingMore && hasMore && !debouncedQuery) { // Only paginate if not searching
        fetchClubs(page + 1, false);
    }
  };

  return (
    <div className={!isTabbed ? "container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up" : ""}>
        {!isTabbed && onGoBack && (
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Browse</span>
            </button>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            {!isTabbed && (
                <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Discover Clubs
                </h2>
            )}
            <div className="relative w-full flex-grow sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon /></div>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clubs..." className="w-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-color))] rounded-lg py-2 pl-10 pr-4 text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] focus:ring-1 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
            </div>
             {onCreateClub && (
                <button onClick={onCreateClub} className="px-5 py-2.5 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
                    Create Club
                </button>
            )}
        </div>

        {error && <div className="text-center p-12 text-[rgb(var(--color-danger))]">{error}</div>}

        {!error && (
             <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading && allClubs.length === 0 ? (
                        Array.from({ length: 8 }).map((_, i) => <ClubCardSkeleton key={i} />)
                    ) : allClubs.length > 0 ? (
                        allClubs.map(club => <ClubCard key={club.mal_id} club={club} onSelect={onClubSelect} />)
                    ) : !isLoading ? (
                        <div className="col-span-full text-center text-[rgb(var(--text-muted))] p-12 text-lg bg-[rgb(var(--surface-2))/0.5] rounded-2xl">
                            <p className="text-2xl mb-2">🤔</p>
                            <p className="font-semibold text-[rgb(var(--text-primary))]">No clubs found{debouncedQuery ? ` for "${debouncedQuery}"` : ''}</p>
                            <p>Try a different search term or create your own club!</p>
                        </div>
                    ): null}
                    {isLoadingMore && Array.from({ length: 4 }).map((_, i) => <ClubCardSkeleton key={`loading-${i}`} />)}
                </div>

                {hasMore && !isLoading && !isLoadingMore && allClubs.length > 0 && !debouncedQuery && (
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

export default ClubsPage;