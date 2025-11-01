import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import type { Anime, Club, Filter, Notification, Settings, Page, User } from './types';
import { useSettings } from './hooks/useSettings';
import { mapJikanToAnime } from './api';
import { deduplicateFranchises, getDisplayTitle, countUserComments } from './utils';
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
import ClubDetailPage from './components/ClubDetailPage';
import MagazinesPage from './components/MagazinesPage';
import TrendingPage from './components/TrendingPage';
import SchedulePage from './components/SchedulePage';
import HistoryPage from './components/HistoryPage';
import NewsPage from './components/NewsPage';
import MangaPage from './components/MangaPage';
import BeginnerAnimePage from './components/BeginnerAnimePage';
import { useWatchProgress } from './hooks/useWatchProgress';
import BeginnerAnime from './components/BeginnerAnime';
import { useAuth } from './hooks/useAuth';
import { GENRES_MAP } from './constants';
import RecentCommentsCarousel from './components/RecentComments';
import CommunityPage from './components/CommunityPage';
import LoginPrompt from './components/LoginPrompt';
import CommentMeterPage from './components/CommentMeterPage';
import CurrencyPage from './components/CurrencyPage';
import UserDetailModal from './components/UserDetailModal';

const ANIME_PAGE_SIZE = 25;

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);

    // State for carousels and grids
    const [featuredAnime, setFeaturedAnime] = useState<Anime[]>([]);
    const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]); // Used for header ticker
    const [isCarouselLoading, setIsCarouselLoading] = useState(true);
    
    // State for main anime grid (used for both home and filtered results)
    const [gridAnime, setGridAnime] = useState<Anime[]>([]);
    
    const [filters, setFilters] = useState<Filter>({
        query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: []
    });
    const [stagedFilters, setStagedFilters] = useState<Filter>(filters);

    const [isGridLoading, setIsGridLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [preloadedData, setPreloadedData] = useState<{ anime: Anime[], hasNext: boolean } | null>(null);

    const isPreloading = useRef(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginReason, setLoginReason] = useState<string | null>(null);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

    const { settings, updateSettings } = useSettings();
    const { isLoggedIn } = useAuth();
    const { watchProgressList } = useWatchProgress();
    const appRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number | null>(null);
    const homePageScrollPosition = useRef(0);
    const pageBeforePlayerRef = useRef<Page>('home'); // To store page before navigating to player
    const prevPageRef = useRef<Page | undefined>(undefined);

    // CRITICAL FIX: Preloader removal logic.
    useEffect(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.transition = 'opacity 0.5s ease';
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500); // Must match transition duration
        }
    }, []);


    // Content Protection
    useEffect(() => {
        const handleContextmenu = (e: MouseEvent) => e.preventDefault();
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.ctrlKey && ['c', 'u', 's'].includes(e.key.toLowerCase())) e.preventDefault();
            if (e.key === 'F12') e.preventDefault();
        };
        document.addEventListener('contextmenu', handleContextmenu);
        document.addEventListener('keydown', handleKeydown);
        return () => {
            document.removeEventListener('contextmenu', handleContextmenu);
            document.removeEventListener('keydown', handleKeydown);
        };
    }, []);

    useEffect(() => {
        prevPageRef.current = page;
    }, [page]);
    
    const handleResetFilters = useCallback((scrollToTop?: boolean) => {
        const resolvedScrollToTop = scrollToTop ?? true;
        const resetState: Filter = { query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [] };
        if (resolvedScrollToTop) {
            homePageScrollPosition.current = 0;
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
        setFilters(resetState);
        setStagedFilters(resetState);
    }, []);

    const goHome = useCallback(() => {
        handleResetFilters(true);
        setPage('home');
        setSelectedAnime(null);
        setSelectedClub(null);
    }, [handleResetFilters]);

    const navigateTo = useCallback((newPage: Page) => {
        if (page !== 'player' && page !== 'profile' && page !== 'club-detail') {
            homePageScrollPosition.current = window.scrollY;
        }
        setPage(newPage);
    }, [page]);
    
    // This effect handles URL parameters for PWA shortcuts.
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page') as Page;
        const validPages: Page[] = ['trending', 'schedule', 'history', 'news', 'manga', 'community', 'beginners', 'comment-meter', 'magazines', 'currency'];

        if (pageParam && validPages.includes(pageParam)) {
            navigateTo(pageParam);
        }

        const showWatchlistParam = urlParams.get('showWatchlist');
        if (showWatchlistParam === 'true') setIsWatchlistOpen(true);

        if (urlParams.has('page') || urlParams.has('showWatchlist')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [navigateTo]);


    const handleAnimeSelect = useCallback((anime: Anime) => {
        if (page !== 'player') {
          homePageScrollPosition.current = window.scrollY;
          pageBeforePlayerRef.current = page;
        }
        setSelectedAnime(anime);
        setPage('player');
    }, [page]);

    const goBackFromPlayer = useCallback(() => {
        setSelectedAnime(null);
        setPage(pageBeforePlayerRef.current);
    }, []);

    const handleClubSelect = useCallback((club: Club) => {
        homePageScrollPosition.current = window.scrollY;
        setSelectedClub(club);
        setPage('club-detail');
    }, []);
    
    const handleLoginRequest = (reason?: string) => {
        setLoginReason(reason || null);
        setIsLoginOpen(true);
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setIsUserDetailModalOpen(true);
    };

    const performFetch = useCallback(async (pageNum: number, searchFilters: Filter) => {
        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: ANIME_PAGE_SIZE.toString(),
        });

        if (settings.restrictAdultContent) params.append('sfw', 'true');
        if (searchFilters.query) params.append('q', searchFilters.query);

        const genreIds = searchFilters.genres.map(genre => GENRES_MAP[genre]).filter(Boolean);
        if (genreIds.length > 0) params.append('genres', genreIds.join(','));

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
    
        const res = await fetch(`https://api.jikan.moe/v4/anime?${params.toString()}`);
        if (res.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return performFetch(pageNum, searchFilters); // Recurse
        }
        if (!res.ok) throw new Error(`Jikan API fetch failed for page ${pageNum}`);
        
        const data = await res.json();
        let mappedData: Anime[] = data.data.map(mapJikanToAnime).filter((a: Anime | null): a is Anime => a !== null);

        if (settings.restrictAdultContent) {
            mappedData = mappedData.filter(anime => !anime.isAdult);
        }
        
        // Client-side filtering for tags, as Jikan API doesn't support it directly
        if (searchFilters.tags && searchFilters.tags.length > 0) {
            mappedData = mappedData.filter(anime => 
                searchFilters.tags.every(tag => 
                    anime.themes?.some(theme => theme.toLowerCase() === tag.toLowerCase())
                )
            );
        }

        const hasNext = data.pagination?.has_next_page ?? false;
        
        return { anime: mappedData, hasNext };
    }, [settings.restrictAdultContent]);

    const fetchJikanGridData = useCallback(async (pageNum: number, searchFilters: Filter, isNewSearch: boolean) => {
        if (isNewSearch) {
            setIsGridLoading(true);
            setPreloadedData(null);
        } else {
            setIsLoadingMore(true);
        }
    
        try {
            const result = await performFetch(pageNum, searchFilters);
            
            setGridAnime(prev => isNewSearch ? result.anime : [...prev, ...result.anime]);
            setHasMore(result.hasNext);
            if(isNewSearch) setCurrentPage(1);
    
            // After displaying, trigger preload for the next page when the browser is idle.
            if (result.hasNext) {
                const preloadNextPage = () => {
                    if (isPreloading.current) return;
                    isPreloading.current = true;
                    (async () => {
                        try {
                            const preloadResult = await performFetch(pageNum + 1, searchFilters);
                            setPreloadedData(preloadResult);
                        } catch (e) {
                            console.error("Preload failed", e);
                            setPreloadedData(null);
                        } finally {
                            isPreloading.current = false;
                        }
                    })();
                };

                if (window.requestIdleCallback) {
                    window.requestIdleCallback(preloadNextPage, { timeout: 2000 });
                } else {
                    setTimeout(preloadNextPage, 500); // Fallback for older browsers
                }
            }
    
        } catch (error) {
            console.error(error);
            setHasMore(false);
        } finally {
            if (isNewSearch) setIsGridLoading(false);
            else setIsLoadingMore(false);
        }
    }, [performFetch]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsCarouselLoading(true);
            try {
                const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
                const [topRes, seasonNowRes] = await Promise.all([
                    fetch(`https://api.jikan.moe/v4/top/anime?limit=15${sfwQuery}`),
                    fetch(`https://api.jikan.moe/v4/seasons/now?limit=20${sfwQuery}`),
                ]);

                if (topRes.ok) {
                    const topData = await topRes.json();
                    let mapped = topData.data.map(mapJikanToAnime).filter(Boolean);
                    if (settings.restrictAdultContent) {
                        mapped = mapped.filter((a: Anime) => !a.isAdult);
                    }
                    setFeaturedAnime(mapped);
                }
                
                if (seasonNowRes.ok) {
                    const seasonNowData = await seasonNowRes.json();
                    let mapped = seasonNowData.data.map(mapJikanToAnime).filter(Boolean);
                    if (settings.restrictAdultContent) {
                        mapped = mapped.filter((a: Anime) => !a.isAdult);
                    }
                    const seasonNowAnime = deduplicateFranchises(mapped);
                    setTrendingAnime(seasonNowAnime.slice(0, 10)); // For header
                }
            } catch (error) {
                console.error("Failed to fetch initial carousel data", error);
            } finally {
                setIsCarouselLoading(false);
            }
        };
        fetchInitialData();
    }, [settings.restrictAdultContent]);

    const hasActiveFilters = useMemo(() => {
        return filters.query || 
               filters.genres.length > 0 || 
               filters.types.length > 0 || 
               filters.statuses.length > 0 ||
               filters.years.length > 0 ||
               filters.languages.length > 0 ||
               filters.studios.length > 0 ||
               filters.tags.length > 0;
    }, [filters]);
    
    useEffect(() => {
        setStagedFilters(filters);
    }, [filters]);

    useEffect(() => {
        if (page !== 'player') {
            setGridAnime([]);
            fetchJikanGridData(1, filters, true);
        }
    }, [filters, fetchJikanGridData, page]);
    
    useEffect(() => {
        if (isSidebarOpen) document.body.classList.add('body-no-scroll');
        else document.body.classList.remove('body-no-scroll');
        return () => document.body.classList.remove('body-no-scroll');
    }, [isSidebarOpen]);

    // Close sidebar on main content scroll
    useEffect(() => {
        const handleScroll = () => { if (isSidebarOpen) setIsSidebarOpen(false); };
        if (isSidebarOpen) window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSidebarOpen]);

    // Touch hover effect for cards
    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) return;
        let lastHoveredElement: Element | null = null;
        let inThrottle = false;
        const throttleLimit = 100; // ms
        const emptyListener = () => {};
        document.body.addEventListener('touchstart', emptyListener, { passive: true });
        const handleTouchMove = (event: TouchEvent) => {
            if (inThrottle) return;
            inThrottle = true;
            setTimeout(() => { inThrottle = false; }, throttleLimit);
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!targetElement) return;
            const card = targetElement.closest('.anime-card-touch-target, .continue-watching-card-touch-target, .slideshow-card-touch-target, .club-card-touch-target, .manga-card-touch-target');
            if (card) {
                if (card !== lastHoveredElement) {
                    lastHoveredElement?.classList.remove('touch-hover');
                    card.classList.add('touch-hover');
                    lastHoveredElement = card;
                }
            } else {
                if (lastHoveredElement) {
                    lastHoveredElement.classList.remove('touch-hover');
                    lastHoveredElement = null;
                }
            }
        };
        const handleTouchEnd = () => {
            if (lastHoveredElement) {
                lastHoveredElement.classList.remove('touch-hover');
                lastHoveredElement = null;
            }
        };
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        return () => {
            document.body.removeEventListener('touchstart', emptyListener);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, []);

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
        if (isLoadingMore || !hasMore) return;
        if (preloadedData) {
            setGridAnime(prev => [...prev, ...preloadedData.anime]);
            setHasMore(preloadedData.hasNext);
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            setPreloadedData(null);
            if (preloadedData.hasNext) {
                const preloadNextPage = () => {
                    if (isPreloading.current) return;
                    isPreloading.current = true;
                    (async () => {
                        try {
                            const preloadResult = await performFetch(newPage + 1, filters);
                            setPreloadedData(preloadResult);
                        } catch (e) {
                            console.error("Preload failed", e);
                            setPreloadedData(null);
                        } finally {
                            isPreloading.current = false;
                        }
                    })();
                };
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(preloadNextPage, { timeout: 2000 });
                } else {
                    setTimeout(preloadNextPage, 500);
                }
            }
        } else {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            fetchJikanGridData(newPage, filters, false);
        }
    }, [hasMore, isLoadingMore, currentPage, filters, fetchJikanGridData, preloadedData, performFetch]);

    const handleStagedFilterChange = (newFilters: Partial<Filter>) => setStagedFilters(prev => ({ ...prev, ...newFilters }));
    
    const handleApplyFilters = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (page !== 'home') setPage('home');
        setFilters(stagedFilters);
        setIsSidebarOpen(false);
    };

    const handleSearchSubmit = (query: string) => { 
        const newFilters = { ...filters, query };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFilters(newFilters);
        setIsSearchOpen(false);
        navigateTo('search');
    };
    const handleSortChange = (sort: Filter['sort']) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const newFilters = { ...filters, sort };
        setFilters(newFilters);
        setStagedFilters(newFilters);
    };

    const handleNotificationClick = (notification: Notification) => {
        const animeStub: Anime = {
            id: notification.animeId, title: 'Loading...', thumbnail: '', bannerImage: '', synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: false, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, title_english: null, title_japanese: '', themes: [],
        };
        handleAnimeSelect(animeStub);
    }

    const handleSurpriseMe = useCallback(() => {
        const availableAnime = gridAnime.length > 0 ? gridAnime : featuredAnime;
        if (availableAnime.length > 0) {
            const randomAnime = availableAnime[Math.floor(Math.random() * availableAnime.length)];
            if (randomAnime) handleAnimeSelect(randomAnime);
        }
        setIsSidebarOpen(false);
    }, [gridAnime, featuredAnime, handleAnimeSelect]);
    
    const handleGenreSelect = (genre: string) => {
        const newFilters: Filter = {
            query: '', genres: [genre], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [],
        };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFilters(newFilters);
        navigateTo('home');
    };

    const allAnime = useMemo(() => {
        const animeMap = new Map<number, Anime>();
        [...featuredAnime, ...gridAnime, ...trendingAnime].forEach(anime => {
            if (anime) animeMap.set(anime.id, anime);
        });
        watchProgressList.forEach(item => {
            if (!animeMap.has(item.animeId)) {
                 animeMap.set(item.animeId, { id: item.animeId, title: 'Loading...' } as Anime);
            }
        });
        return Array.from(animeMap.values());
    }, [featuredAnime, gridAnime, trendingAnime, watchProgressList]);
    
    const pageContent = useMemo(() => {
        switch(page) {
            case 'player': return selectedAnime && <Player anime={selectedAnime} onGoBack={goBackFromPlayer} onSelectRelated={handleAnimeSelect} allAnime={allAnime} onGenreSelect={handleGenreSelect} onUserSelect={handleUserSelect} />;
            case 'profile': return <ProfilePage onGoBack={goHome} allAnime={allAnime} onSelectAnime={handleAnimeSelect} />;
            case 'club-detail': return selectedClub && <ClubDetailPage club={selectedClub} onGoBack={() => navigateTo('community')} onSelectAnime={handleAnimeSelect} />;
            case 'magazines': return <MagazinesPage onGoBack={goHome} />;
            case 'trending': return <TrendingPage onAnimeSelect={handleAnimeSelect} />;
            case 'schedule': return <SchedulePage onAnimeSelect={handleAnimeSelect} />;
            case 'history': return <HistoryPage onAnimeSelect={handleAnimeSelect} allAnime={allAnime} />;
            case 'news': return <NewsPage onAnimeSelect={handleAnimeSelect} />;
            case 'manga': return <MangaPage onGoBack={goHome} />;
            case 'community': return <CommunityPage onLoginClick={() => handleLoginRequest()} onClubSelect={handleClubSelect} onUserSelect={handleUserSelect} />;
            case 'comment-meter': return <CommentMeterPage onGoBack={goHome} onLoginClick={() => handleLoginRequest()} />;
            case 'beginners': return <BeginnerAnimePage onGoBack={goHome} onAnimeSelect={handleAnimeSelect} />;
            case 'currency': return <CurrencyPage onGoBack={goHome} />;
            case 'search':
                return (
                    <AnimeGrid
                        title={`Results for "${filters.query}"`}
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
                );
            case 'home':
            default:
                const isDefaultHome = !hasActiveFilters;
                return (
                    <>
                        {isDefaultHome && <FeaturedCarousel animeList={featuredAnime} onAnimeSelect={handleAnimeSelect} isLoading={isCarouselLoading} />}
                        {isDefaultHome && settings.showWatchHistoryOnHome && (
                            <ContinueWatching onSelectAnime={handleAnimeSelect} onShowHistory={() => navigateTo('history')} />
                        )}
                        {isDefaultHome && settings.showComments && <RecentCommentsCarousel onAnimeSelect={handleAnimeSelect} />}
                        {isDefaultHome && <BeginnerAnime onAnimeSelect={handleAnimeSelect} />}
                        <AnimeGrid
                            title={isDefaultHome ? "Discover Anime" : "Filtered Results"}
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
    }, [page, hasActiveFilters, isCarouselLoading, isGridLoading, isLoadingMore, hasMore, featuredAnime, gridAnime, allAnime, filters, settings.showWatchHistoryOnHome, settings.showComments, selectedAnime, selectedClub]);

    return (
        <div ref={appRef} className="bg-[rgb(var(--bg-gradient-start))] text-[rgb(var(--text-primary))]">
            <Header
                onMenuClick={() => setIsSidebarOpen(true)}
                onLoginClick={() => handleLoginRequest()}
                onSearchClick={() => setIsSearchOpen(true)}
                onShowWatchlist={() => setIsWatchlistOpen(true)}
                onNavigate={navigateTo}
                onGoHome={goHome}
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
                onGoHome={goHome}
                onSurpriseMe={handleSurpriseMe}
                settings={settings}
                updateSettings={updateSettings}
                isLoggedIn={isLoggedIn}
                onLoginClick={handleLoginRequest}
            />
            {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleAnimeSelect} onSearchSubmit={handleSearchSubmit} />}
            {isLoginOpen && <AuthModal onClose={() => { setIsLoginOpen(false); setLoginReason(null); }} reason={loginReason} />}
            {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleAnimeSelect} />}
            {isUserDetailModalOpen && selectedUser && <UserDetailModal user={selectedUser} onClose={() => setIsUserDetailModalOpen(false)} />}
            
            <main className={`${page === 'home' && !hasActiveFilters ? '' : 'pt-20'}`}>
                {page === 'home' && !hasActiveFilters && <LoginPrompt onLoginClick={() => handleLoginRequest()} />}
                {pageContent}
            </main>
            
            <GoToTopButton />
            <Footer />
        </div>
    );
};

export default App;
