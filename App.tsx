

import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import type { Anime, Club, Filter, Notification, Settings, Page } from './types';
import { useSettings } from './hooks/useSettings';
import { mapJikanToAnime } from './api';
import { deduplicateFranchises, getDisplayTitle } from './utils';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FeaturedCarousel from './components/FeaturedCarousel';
import AnimeGrid from './components/AnimeGrid';
import Footer from './components/Footer';
import Player from './components/Player';
import SearchOverlay from './components/SearchOverlay';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import GoToTopButton from './components/GoToTopButton';
import ContinueWatching from './components/ContinueWatching';
import WatchlistOverlay from './components/WatchlistOverlay';
import AdBanner from './components/AdBanner';
import ClubsPage from './components/ClubsPage';
import ClubDetailPage from './components/ClubDetailPage';
import MagazinesPage from './components/MagazinesPage';
import TrendingPage from './components/TrendingPage';
import SchedulePage from './components/SchedulePage';
import HistoryPage from './components/HistoryPage';
import NewsPage from './components/NewsPage';
import MangaPage from './components/MangaPage';
import BeginnerAnimePage from './components/BeginnerAnimePage';
import { useWatchProgress } from './hooks/useWatchProgress';

const ANIME_PAGE_SIZE = 25;

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);

    // State for carousels and grids
    const [featuredAnime, setFeaturedAnime] = useState<Anime[]>([]);
    const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]); // Used for header ticker
    const [isCarouselLoading, setIsCarouselLoading] = useState(true);
    
    // State for main anime grid (used for both home and filtered results)
    const [gridAnime, setGridAnime] = useState<Anime[]>([]);
    
    const [filters, setFilters] = useState<Filter>({
        query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity'
    });
    const [stagedFilters, setStagedFilters] = useState<Filter>(filters);

    const [isGridLoading, setIsGridLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

    const { settings, updateSettings } = useSettings();
    const { watchProgressList } = useWatchProgress();
    const appRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number | null>(null);
    const homePageScrollPosition = useRef(0);
    const prevPageRef = useRef<Page | undefined>(undefined);

    useEffect(() => {
        prevPageRef.current = page;
    }, [page]);
    
    const handleResetFilters = (scrollToTop?: boolean) => {
        const resolvedScrollToTop = scrollToTop ?? true;
        const resetState: Filter = { query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity' };
        if (resolvedScrollToTop) {
            homePageScrollPosition.current = 0;
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
        setFilters(resetState);
        setStagedFilters(resetState);
    };

    const navigateTo = (newPage: Page) => {
        if (page !== 'player' && page !== 'profile' && page !== 'club-detail') {
            homePageScrollPosition.current = window.scrollY;
        }

        if (newPage === 'home' && page !== 'home' && page !== 'player') {
            const resetState: Filter = { query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity' };
            setFilters(resetState);
            setStagedFilters(resetState);
        }
        
        setPage(newPage);
        setSelectedAnime(null);
        setSelectedClub(null);
    };

    const handleAnimeSelect = useCallback((anime: Anime) => {
        if (page !== 'player') {
          homePageScrollPosition.current = window.scrollY;
        }
        setSelectedAnime(anime);
        setPage('player');
    }, [page]);

    const handleClubSelect = useCallback((club: Club) => {
        homePageScrollPosition.current = window.scrollY;
        setSelectedClub(club);
        setPage('club-detail');
    }, []);

    const fetchJikanGridData = useCallback(async (pageNum: number, searchFilters: Filter, isNewSearch: boolean) => {
        if (!isNewSearch) setIsLoadingMore(true); else setIsGridLoading(true);

        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: ANIME_PAGE_SIZE.toString(),
            sfw: settings.restrictAdultContent ? 'true' : 'false'
        });

        if (searchFilters.query) params.append('q', searchFilters.query);
        if (searchFilters.genres.length > 0) params.append('genres', searchFilters.genres.join(','));
        if (searchFilters.types.length > 0) params.append('type', searchFilters.types.join(',').toLowerCase());
        if (searchFilters.statuses.length > 0) {
            const jikanStatuses = searchFilters.statuses.map(s => {
                if (s === 'Ongoing') return 'airing';
                if (s === 'Completed') return 'complete';
                if (s === 'Upcoming') return 'upcoming';
                return '';
            }).filter(Boolean).join(',');
            if (jikanStatuses) params.append('status', jikanStatuses);
        }
        
        switch (searchFilters.sort) {
            case 'release_date': params.append('order_by', 'start_date'); params.append('sort', 'desc'); break;
            case 'alphabetical': params.append('order_by', 'title'); params.append('sort', 'asc'); break;
            default: params.append('order_by', 'members'); params.append('sort', 'desc'); break;
        }

        try {
            const res = await fetch(`https://api.jikan.moe/v4/anime?${params.toString()}`);
            if (res.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchJikanGridData(pageNum, searchFilters, isNewSearch);
            }
            if (!res.ok) throw new Error('Failed to fetch from Jikan API');
            
            const data = await res.json();
            const mappedData: Anime[] = data.data.map(mapJikanToAnime).filter((a: Anime | null): a is Anime => a !== null);
            
            setGridAnime(prev => isNewSearch ? mappedData : [...prev, ...mappedData]);
            setHasMore(data.pagination?.has_next_page ?? false);
            if(isNewSearch) setCurrentPage(1);

        } catch (error) {
            console.error(error);
            setHasMore(false);
        } finally {
            setIsGridLoading(false);
            setIsLoadingMore(false);
        }
    }, [settings.restrictAdultContent]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsCarouselLoading(true);
            try {
                const [topRes, seasonNowRes] = await Promise.all([
                    fetch('https://api.jikan.moe/v4/top/anime?limit=15'),
                    fetch('https://api.jikan.moe/v4/seasons/now?limit=20'),
                ]);

                if (topRes.ok) {
                    const topData = await topRes.json();
                    setFeaturedAnime(topData.data.map(mapJikanToAnime).filter(Boolean));
                }
                
                if (seasonNowRes.ok) {
                    const seasonNowData = await seasonNowRes.json();
                    const seasonNowAnime = deduplicateFranchises(seasonNowData.data.map(mapJikanToAnime).filter(Boolean));
                    setTrendingAnime(seasonNowAnime.slice(0, 10)); // For header
                }
            } catch (error) {
                console.error("Failed to fetch initial carousel data", error);
            } finally {
                setIsCarouselLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const hasActiveFilters = useMemo(() => {
        return filters.query || filters.genres.length > 0 || filters.types.length > 0 || filters.statuses.length > 0;
    }, [filters]);
    
    useEffect(() => {
        setStagedFilters(filters);
    }, [filters]);

    useEffect(() => {
        setGridAnime([]);
        fetchJikanGridData(1, filters, true);
    }, [filters, fetchJikanGridData]);
    
    useEffect(() => {
        if (isSidebarOpen) document.body.classList.add('body-no-scroll');
        else document.body.classList.remove('body-no-scroll');
        return () => document.body.classList.remove('body-no-scroll');
    }, [isSidebarOpen]);

    useLayoutEffect(() => {
        const prevPage = prevPageRef.current;
        if (scrollPositionRef.current !== null) {
            window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
            scrollPositionRef.current = null;
        } 
        else if (page === 'home' && prevPage !== 'home') {
            window.scrollTo({ top: homePageScrollPosition.current, behavior: 'auto' });
        } else if (page !== 'home' && page !== prevPage) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [page, gridAnime]);

    const loadMoreGrid = useCallback(() => {
        if (hasMore && !isLoadingMore) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            fetchJikanGridData(newPage, filters, false);
        }
    }, [hasMore, isLoadingMore, currentPage, filters, fetchJikanGridData]);

    const handleStagedFilterChange = (newFilters: Partial<Filter>) => setStagedFilters(prev => ({ ...prev, ...newFilters }));
    
    const handleApplyFilters = () => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        setFilters(stagedFilters);
        setIsSidebarOpen(false);
        navigateTo('home');
    };

    const handleSearchSubmit = (query: string) => { 
        const newFilters = { ...filters, query };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'auto' });
        setFilters(newFilters);
        setIsSearchOpen(false);
        navigateTo('home');
    };
    const handleSortChange = (sort: Filter['sort']) => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        const newFilters = { ...filters, sort };
        setFilters(newFilters);
        setStagedFilters(newFilters);
    };

    const handleNotificationClick = (notification: Notification) => {
        const animeStub: Anime = {
            id: notification.animeId,
            title: 'Loading...',
            thumbnail: '', bannerImage: '', synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: false, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, title_english: null, title_japanese: '',
        };
        handleAnimeSelect(animeStub);
    }

    const handleSurpriseMe = useCallback(() => {
        const availableAnime = gridAnime.length > 0 ? gridAnime : featuredAnime;
        if (availableAnime.length > 0) {
            const randomAnime = availableAnime[Math.floor(Math.random() * availableAnime.length)];
            if (randomAnime) {
                handleAnimeSelect(randomAnime);
            }
        }
        setIsSidebarOpen(false);
    }, [gridAnime, featuredAnime, handleAnimeSelect]);
    
    const handleGenreSelect = (genre: string) => {
        const newFilters: Filter = {
            query: '', genres: [genre], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity'
        };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'auto' });
        setFilters(newFilters);
        navigateTo('home');
    };

    const allAnime = useMemo(() => {
        const animeMap = new Map<number, Anime>();
        [...featuredAnime, ...gridAnime, ...trendingAnime].forEach(anime => {
            if (anime) animeMap.set(anime.id, anime);
        });
        // We add stubs for anime in history that might not be in our loaded lists
        watchProgressList.forEach(item => {
            if (!animeMap.has(item.animeId)) {
                 animeMap.set(item.animeId, { id: item.animeId, title: 'Loading...' } as Anime);
            }
        });
        return Array.from(animeMap.values());
    }, [featuredAnime, gridAnime, trendingAnime, watchProgressList]);
    
    const pageContent = useMemo(() => {
        switch(page) {
            case 'player': return selectedAnime && <Player anime={selectedAnime} onGoBack={() => navigateTo('home')} onSelectRelated={handleAnimeSelect} allAnime={allAnime} onGenreSelect={handleGenreSelect} />;
            case 'profile': return <ProfilePage onGoBack={() => navigateTo('home')} allAnime={allAnime} onSelectAnime={handleAnimeSelect} />;
            case 'clubs': return <ClubsPage onGoBack={() => navigateTo('home')} onClubSelect={handleClubSelect} />;
            case 'club-detail': return selectedClub && <ClubDetailPage club={selectedClub} onGoBack={() => navigateTo('clubs')} onSelectAnime={handleAnimeSelect} />;
            case 'magazines': return <MagazinesPage onGoBack={() => navigateTo('home')} />;
            case 'trending': return <TrendingPage onAnimeSelect={handleAnimeSelect} />;
            case 'schedule': return <SchedulePage onAnimeSelect={handleAnimeSelect} />;
            case 'history': return <HistoryPage onAnimeSelect={handleAnimeSelect} allAnime={allAnime} />;
            case 'news': return <NewsPage onAnimeSelect={handleAnimeSelect} />;
            case 'manga': return <MangaPage onGoBack={() => navigateTo('home')} />;
            case 'beginners': return <BeginnerAnimePage onGoBack={() => navigateTo('home')} onAnimeSelect={handleAnimeSelect} />;
            case 'home':
            default:
                const isDefaultHome = !hasActiveFilters;
                return (
                    <>
                        {isDefaultHome && <FeaturedCarousel animeList={featuredAnime} onAnimeSelect={handleAnimeSelect} isLoading={isCarouselLoading} />}
                        
                        {isDefaultHome && settings.showWatchHistoryOnHome && (
                            <ContinueWatching 
                                allAnime={allAnime}
                                onSelectAnime={handleAnimeSelect} 
                                onShowHistory={() => navigateTo('history')} 
                            />
                        )}
                        
                        <AnimeGrid
                            title={isDefaultHome ? "Discover Anime" : (filters.query ? `Results for "${filters.query}"` : "Filtered Results")}
                            animeList={gridAnime}
                            onAnimeSelect={handleAnimeSelect}
                            filters={filters}
                            isLoading={isGridLoading && gridAnime.length === 0}
                            onLoadMore={loadMoreGrid}
                            hasMore={hasMore}
                            isLoadingMore={isLoadingMore}
                            sortValue={filters.sort}
                            onSortChange={handleSortChange}
                        />
                    </>
                );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, hasActiveFilters, isCarouselLoading, isGridLoading, isLoadingMore, hasMore, featuredAnime, gridAnime, allAnime, filters, settings.showWatchHistoryOnHome, selectedAnime, selectedClub]);

    return (
        <div ref={appRef} className="bg-[rgb(var(--bg-gradient-start))] text-[rgb(var(--text-primary))]">
            <Header
                onMenuClick={() => setIsSidebarOpen(true)}
                onLoginClick={() => setIsLoginOpen(true)}
                onSearchClick={() => setIsSearchOpen(true)}
                onShowWatchlist={() => setIsWatchlistOpen(true)}
                onNavigate={navigateTo}
                onNotificationClick={handleNotificationClick}
                trendingAnime={trendingAnime}
                onTrendingAnimeClick={handleSearchSubmit}
            />
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                filters={stagedFilters}
                onFilterChange={handleStagedFilterChange}
                onApplyFilters={handleApplyFilters}
                onResetFilters={() => { handleResetFilters(true); }}
                onNavigate={navigateTo}
                onSurpriseMe={handleSurpriseMe}
                settings={settings}
                updateSettings={updateSettings}
            />
            {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleAnimeSelect} onSearchSubmit={handleSearchSubmit} />}
            {isLoginOpen && <AuthModal onClose={() => setIsLoginOpen(false)} />}
            {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleAnimeSelect} />}
            
            <main className={`${page === 'home' && !hasActiveFilters ? '' : 'pt-20'}`}>
                {pageContent}
            </main>
            
            <GoToTopButton />
            <Footer />
        </div>
    );
};

export default App;