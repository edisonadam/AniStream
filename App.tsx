

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, Club, Filter, Notification, Settings, Page, User, ShortcutAction, RecentEpisode } from './types';
import { useSettings } from './hooks/useSettings';
import { useShortcuts } from './hooks/useShortcuts';
import { mapJikanToAnime, fetchWithRetry } from './api';
import { getDisplayTitle, mapPartialToFullAnime } from './utils';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AnimeGrid from './components/AnimeGrid';
import Footer from './components/Footer';
import GoToTopButton from './components/GoToTopButton';
import ContinueWatching from './components/ContinueWatching';
import AdBanner from './components/AdBanner';
import BeginnerAnime from './components/BeginnerAnime';
import { useWatchProgress } from './hooks/useWatchProgress';
import { useAuth } from './hooks/useAuth';
import { GENRES_MAP } from './constants';
import RecentCommentsCarousel from './components/RecentComments';
import LoginPrompt from './components/LoginPrompt';
import AlphabeticalBrowse from './components/AlphabeticalBrowse';
import FloatingPlayer from './components/FloatingPlayer';
import { useFloatingPlayer } from './hooks/useFloatingPlayer';
import TopAnime from './components/TopAnime';
import { Toaster } from './components/Toaster';
import { useToast } from './hooks/useToast';
import ThisSeasonAnime from './components/ThisSeasonAnime';
import LoadingBar from './components/LoadingBar';
import NewEpisodesSection from './components/NewEpisodesSection';
import FeaturedCarousel from './components/FeaturedCarousel';
import { useQueue } from './hooks/useQueue';
import { useProfileData } from './hooks/useProfileData';
import AuthModal from './components/AuthModal';

// Lazy load pages and overlays
const Player = lazy(() => import('./components/Player'));
const SearchOverlay = lazy(() => import('./components/SearchOverlay'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const WatchlistOverlay = lazy(() => import('./components/WatchlistOverlay'));
const ClubDetailPage = lazy(() => import('./components/ClubDetailPage'));
const TrendingPage = lazy(() => import('./components/TrendingPage'));
const SchedulePage = lazy(() => import('./components/SchedulePage'));
const HistoryPage = lazy(() => import('./components/HistoryPage'));
const NewsPage = lazy(() => import('./components/NewsPage'));
const MangaPage = lazy(() => import('./components/MangaPage'));
const BeginnerAnimePage = lazy(() => import('./components/BeginnerAnimePage'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const CommentMeterPage = lazy(() => import('./components/CommentMeterPage'));
const CurrencyPage = lazy(() => import('./components/CurrencyPage'));
const UserDetailModal = lazy(() => import('./components/UserDetailModal'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const RulesPage = lazy(() => import('./components/RulesPage'));
const DonationPage = lazy(() => import('./components/DonationPage'));
const WatchTogetherPage = lazy(() => import('./components/WatchTogetherPage'));
const OGImageGenerator = lazy(() => import('./components/OGImageGenerator'));
const ShortcutsHelpModal = lazy(() => import('./components/ShortcutsHelpModal'));
const Top100Page = lazy(() => import('./components/Top100Page'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const HowToUsePage = lazy(() => import('./components/HowToUsePage'));
const NewEpisodesPage = lazy(() => import('./components/NewEpisodesPage'));
const VideosPage = lazy(() => import('./components/VideosPage'));
const AnimeDetailPage = lazy(() => import('./components/AnimeDetailPage'));
const QueueOverlay = lazy(() => import('./components/QueueOverlay'));
const ErrorsPage = lazy(() => import('./components/ErrorsPage'));


const ANIME_PAGE_SIZE = 25;

const PageLoader: React.FC = () => (
    <div className="w-full min-h-screen flex items-center justify-center">
        <div 
            className="w-12 h-12 border-4 border-transparent rounded-full animate-spin"
            style={{ borderTopColor: 'rgb(var(--color-primary))' }}
        ></div>
    </div>
);

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [watchTogetherRoomId, setWatchTogetherRoomId] = useState<string | null>(null);
    const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

    const [featuredAnime, setFeaturedAnime] = useState<Anime[]>([]);
    const [topAnimeList, setTopAnimeList] = useState<Anime[]>([]);
    const [isCarouselLoading, setIsCarouselLoading] = useState(true);
    const [isTopAnimeLoading, setIsTopAnimeLoading] = useState(true);
    
    const [gridAnime, setGridAnime] = useState<Anime[]>([]);
    const [allAnime, setAllAnime] = useState<Anime[]>([]); // For lookups
    
    const [filters, setFilters] = useState<Filter>({ query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [], letter: '' });
    const [stagedFilters, setStagedFilters] = useState<Filter>(filters);

    const [isGridLoading, setIsGridLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginReason, setLoginReason] = useState<string | null>(null);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    
    const [isEmbedMode, setIsEmbedMode] = useState(false);
    const [embedAnime, setEmbedAnime] = useState<Anime | null>(null);

    const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisode[]>([]);
    const [newEpisodeAnime, setNewEpisodeAnime] = useState<(Anime & { episodeNumber: number })[]>([]);
    const [isNewEpisodesLoading, setIsNewEpisodesLoading] = useState(true);
    
    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

    const { settings, updateSettings } = useSettings();
    const { shortcuts } = useShortcuts();
    const { isLoggedIn, user } = useAuth();
    const { addToast } = useToast();
    const { hidePlayer } = useFloatingPlayer();
    const { addNotification } = useProfileData();
    const { watchProgressList } = useWatchProgress();
    const welcomeToastShown = useRef(false);
    
    const homePageScrollPosition = useRef(0);
    const pageBeforePlayerRef = useRef<{page: Page, filters: Filter, source?: string}>({page: 'home', filters});

    const lastViewedTimestamps = useMemo(() => {
        const map = new Map<number, number>();
        // watchProgressList is sorted by timestamp descending, so first found is latest
        watchProgressList.forEach(item => {
            if (!map.has(item.animeId)) {
                map.set(item.animeId, item.timestamp);
            }
        });
        return map;
    }, [watchProgressList]);

    const getEpisodeStatusCallback = useCallback((id: number) => {
        const recentEp = recentEpisodes.find(ep => ep.malId === id);
        const lastViewed = lastViewedTimestamps.get(id);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        let isNew = false;
        if (recentEp && recentEp.releaseTimestamp) {
            // Accommodate both seconds and milliseconds
            const releaseTimeInMs = recentEp.releaseTimestamp > 1000000000000 ? recentEp.releaseTimestamp : recentEp.releaseTimestamp * 1000;
            const isRecent = (Date.now() - releaseTimeInMs) < twentyFourHours;
            const hasBeenViewedSinceRelease = lastViewed && lastViewed > releaseTimeInMs;
            isNew = isRecent && !hasBeenViewedSinceRelease;
        }
        
        const episodeData = newEpisodeAnime.find(a => a.id === id);
        return {
            isNew,
            episodeNumber: episodeData?.episodeNumber || null,
        };
    }, [recentEpisodes, lastViewedTimestamps, newEpisodeAnime]);


    const handleLoginRequest = useCallback((reason: string) => {
        setIsLoginOpen(true);
        setLoginReason(reason);
    }, []);
    
    useEffect(() => {
        const hidePreloader = () => {
            const preloader = document.getElementById('preloader');
            if (preloader && preloader.style.display !== 'none') {
                preloader.style.transition = 'opacity 0.5s ease';
                preloader.style.opacity = '0';
                setTimeout(() => { preloader.style.display = 'none'; }, 500);
            }
        };

        if (!isCarouselLoading && !isTopAnimeLoading) {
            hidePreloader();
        }

        // Failsafe timeout to hide preloader after 10 seconds regardless of loading state
        const failsafeTimer = setTimeout(hidePreloader, 10000);

        return () => {
            clearTimeout(failsafeTimer);
        };
    }, [isCarouselLoading, isTopAnimeLoading]);

    useEffect(() => {
      const handleBeforeInstallPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    useEffect(() => {
        let scrollTimeout: number;
        const handleScroll = () => {
          document.body.classList.add('is-scrolling');
          clearTimeout(scrollTimeout);
          scrollTimeout = window.setTimeout(() => {
            document.body.classList.remove('is-scrolling');
          }, 500); // Fade out after 0.5s of inactivity
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        (installPrompt as any).prompt();
        (installPrompt as any).userChoice.then((choice: { outcome: 'accepted' | 'dismissed' }) => {
            addToast(choice.outcome === 'accepted' ? 'App installed!' : 'Installation cancelled.', 'info');
            setInstallPrompt(null);
        });
    };

    useEffect(() => {
        if (isLoggedIn && user && !welcomeToastShown.current) {
            addToast(`👋 Welcome back, ${user.username}!`, 'info');
            welcomeToastShown.current = true;
        } else if (!isLoggedIn) {
            welcomeToastShown.current = false;
        }
    }, [isLoggedIn, user, addToast]);
    
    useEffect(() => {
        const isAnyModalOpen = isSearchOpen || isLoginOpen || isWatchlistOpen || isQueueOpen || isUserDetailModalOpen || isShortcutsHelpOpen;
        if (isAnyModalOpen) {
            document.body.classList.add('modal-zoom-effect-active');
        } else {
            document.body.classList.remove('modal-zoom-effect-active');
        }
        return () => {
            document.body.classList.remove('modal-zoom-effect-active');
        };
    }, [isSearchOpen, isLoginOpen, isWatchlistOpen, isQueueOpen, isUserDetailModalOpen, isShortcutsHelpOpen]);

    const fetchSecondaryHomePageData = useCallback(async () => {
        setIsNewEpisodesLoading(true);
        try {
            const recentResult = await fetchWithRetry(`https://api.jikan.moe/v4/watch/episodes?limit=25`);
            if (recentResult.ok) {
                const data = await recentResult.json();
                const recentEntries: any[] = (data && data.data && Array.isArray(data.data)) ? data.data : [];
    
                setRecentEpisodes(recentEntries.map(entry => ({
                    id: `${entry.entry.mal_id}-${entry.episodes[0]?.mal_id}`,
                    episodeId: entry.episodes[0]?.url,
                    episodeNumber: entry.episodes[0]?.mal_id,
                    title: entry.entry.title,
                    image: entry.entry.images.jpg.image_url,
                    url: entry.episodes[0]?.url,
                    releaseTimestamp: new Date(entry.date).getTime(),
                    malId: entry.entry.mal_id,
                })));
                
                const mappedAnime = recentEntries.map(entry => {
                    const anime = mapJikanToAnime(entry.entry);
                    if (!anime) return null;
                    return {
                        ...anime,
                        episodeNumber: entry.episodes[0]?.mal_id || 1,
                    };
                }).filter((a): a is (Anime & { episodeNumber: number }) => a !== null);
                
                const uniqueAnimeMap = new Map<number, (Anime & { episodeNumber: number })>();
                for (const anime of mappedAnime) {
                    if (!uniqueAnimeMap.has(anime.id) || (uniqueAnimeMap.get(anime.id)!.episodeNumber < anime.episodeNumber)) {
                        uniqueAnimeMap.set(anime.id, anime);
                    }
                }
                const uniqueAnimeList = Array.from(uniqueAnimeMap.values());
                
                setNewEpisodeAnime(uniqueAnimeList);
                setAllAnime(prev => Array.from(new Map([...prev, ...uniqueAnimeList].map(a => [a.id, a])).values()));
            } else {
                console.error("Failed to fetch recent episodes from Jikan:", await recentResult.text());
                setNewEpisodeAnime([]);
            }
        } catch (error) {
            console.error("An unexpected error occurred in fetchSecondaryHomePageData:", error);
            setNewEpisodeAnime([]);
        } finally {
            setIsNewEpisodesLoading(false);
        }
    }, []);

    const fetchPrimaryHomePageData = useCallback(async () => {
        setIsCarouselLoading(true);
        setIsTopAnimeLoading(true);
        try {
            const [featuredResult, topResult] = await Promise.allSettled([
                fetchWithRetry('https://api.jikan.moe/v4/seasons/now?limit=15'),
                fetchWithRetry('https://api.jikan.moe/v4/top/anime?limit=15'),
            ]);

            let allFetchedAnime: Anime[] = [];

            if (featuredResult.status === 'fulfilled' && featuredResult.value.ok) {
                const data = await featuredResult.value.json();
                if (data && data.data && Array.isArray(data.data)) {
                    const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                    setFeaturedAnime(mapped);
                    allFetchedAnime.push(...mapped);
                }
            } else {
                console.error("Failed to fetch featured anime:", featuredResult.status === 'rejected' ? featuredResult.reason : 'Request failed');
            }

            if (topResult.status === 'fulfilled' && topResult.value.ok) {
                const data = await topResult.value.json();
                if (data && data.data && Array.isArray(data.data)) {
                    const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                    setTopAnimeList(mapped);
                    allFetchedAnime.push(...mapped);
                }
            } else {
                console.error("Failed to fetch top anime:", topResult.status === 'rejected' ? topResult.reason : 'Request failed');
            }
            setAllAnime(prev => Array.from(new Map([...prev, ...allFetchedAnime].map(a => [a.id, a])).values()));
        } catch (error) {
            console.error("An unexpected error occurred in fetchPrimaryHomePageData:", error);
            addToast("Could not load some initial anime data.", "error");
        } finally {
            setIsCarouselLoading(false);
            setIsTopAnimeLoading(false);
        }
    }, [addToast]);

    useEffect(() => { 
        fetchPrimaryHomePageData(); 
        fetchSecondaryHomePageData();
    }, [fetchPrimaryHomePageData, fetchSecondaryHomePageData]);

    const buildQuery = useCallback((pageToFetch: number) => {
        const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
        const params = new URLSearchParams({
            page: pageToFetch.toString(),
            limit: ANIME_PAGE_SIZE.toString(),
        });
        switch (filters.sort) {
            case 'release_date': params.append('order_by', 'start_date'); params.append('sort', 'desc'); break;
            case 'alphabetical': params.append('order_by', 'title'); params.append('sort', 'asc'); break;
            case 'popularity': default: params.append('order_by', 'score'); params.append('sort', 'desc'); break;
        }
        if (filters.query) params.append('q', filters.query);
        if (filters.genres.length > 0) params.append('genres', filters.genres.map(g => GENRES_MAP[g]).filter(Boolean).join(','));
        if (filters.types.length > 0) params.append('type', filters.types.join(',').toLowerCase());
        if (filters.statuses.length > 0) params.append('status', filters.statuses.join(',').toLowerCase());
        if (filters.letter && !filters.query) params.append('letter', filters.letter);
        return `https://api.jikan.moe/v4/anime?${params.toString()}${sfwQuery}`;
    }, [filters, settings.restrictAdultContent]);

    useEffect(() => {
        const fetchFirstPage = async () => {
            setIsGridLoading(true);
            try {
                const url = buildQuery(1);
                const response = await fetchWithRetry(url);
                if (!response.ok) throw new Error(`Jikan API responded with status ${response.status}`);
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                    setGridAnime(mapped);
                    setAllAnime(prev => Array.from(new Map([...prev, ...mapped].map(a => [a.id, a])).values()));
                    setHasMore(data.pagination?.has_next_page ?? false);
                    setTotalPages(data.pagination?.last_visible_page ?? 0);
                    setCurrentPage(1);
                } else {
                    setGridAnime([]);
                    setHasMore(false);
                    setTotalPages(0);
                }
            } catch (error) {
                console.error("Failed to fetch initial grid data:", error);
                addToast("Could not load anime list.", "error");
                setGridAnime([]);
            } finally {
                setIsGridLoading(false);
            }
        };
        fetchFirstPage();
    }, [buildQuery, addToast]);

    const loadMoreData = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const pageToFetch = currentPage + 1;
        try {
            const url = buildQuery(pageToFetch);
            const response = await fetchWithRetry(url);
            if (!response.ok) throw new Error(`Jikan API responded with status ${response.status}`);
            const data = await response.json();
            if (data && data.data && Array.isArray(data.data)) {
                const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                setGridAnime(prev => [...prev, ...mapped]);
                setAllAnime(prev => Array.from(new Map([...prev, ...mapped].map(a => [a.id, a])).values()));
                setHasMore(data.pagination?.has_next_page ?? false);
                setCurrentPage(pageToFetch);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more grid data:", error);
            addToast("Could not load more anime.", "error");
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, currentPage, buildQuery, addToast]);
    
    const handleCollapseGrid = () => {
        setGridAnime(prev => prev.slice(0, ANIME_PAGE_SIZE));
        setCurrentPage(1);
        setHasMore(true);
        window.scrollTo({ top: 0, behavior: 'smooth'});
    };

    const goHome = useCallback(() => {
        setPage('home');
        setSelectedAnime(null);
        setSelectedClub(null);
        setWatchTogetherRoomId(null);
        window.history.pushState({}, '', window.location.pathname);
        setIsSidebarOpen(false);
    }, []);

    const navigateTo = useCallback((newPage: Page) => {
        if (page === newPage) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        setIsPageLoading(true);
        if (!['player', 'details'].includes(page)) { homePageScrollPosition.current = window.scrollY; }
        setPage(newPage);
        window.scrollTo(0, 0);
        setIsSidebarOpen(false);
    }, [page]);

    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 500);
        return () => clearTimeout(timer);
    }, [page, selectedAnime]);

    const handleWatchNow = (anime: Anime, source?: string) => {
        if (page !== 'player' && page !== 'details') {
            pageBeforePlayerRef.current = { page, filters, source };
        }
        setSelectedAnime(anime);
        setPage('player');
        hidePlayer();
    };

    const handleDetailSelect = (anime: Anime, source?: string) => {
        if (page !== 'player' && page !== 'details') {
            pageBeforePlayerRef.current = { page, filters, source };
        }
        setSelectedAnime(anime);
        setPage('details');
        hidePlayer();
    };

    const handleAnimeSelect = (anime: Anime, source?: string) => {
        if (source === 'Season Navigation' && page === 'player') {
            handleWatchNow(anime, source);
        } else if (source === 'Continue Watching' || source === 'Watchlist' || source === 'Queue') {
            handleWatchNow(anime, source);
        } else {
            handleDetailSelect(anime, source);
        }
    };
    
    const renderPage = () => {
        if (watchTogetherRoomId) return <WatchTogetherPage roomId={watchTogetherRoomId} onExit={() => setWatchTogetherRoomId(null)} />;
        switch (page) {
            case 'player': return selectedAnime && <Player anime={selectedAnime} allAnime={allAnime} onGoBack={() => setPage(pageBeforePlayerRef.current.page)} onGoHome={goHome} onSelectRelated={handleAnimeSelect} onGenreSelect={(g) => { setFilters({ ...filters, genres: [g] }); setPage('home'); }} onStudioSelect={(s) => { setFilters({ ...filters, studios: [s] }); setPage('home'); }} onUserSelect={(u) => { setSelectedUser(u); setIsUserDetailModalOpen(true); }} onEnterRoom={setWatchTogetherRoomId} breadcrumbsData={pageBeforePlayerRef.current} settings={settings} updateSettings={updateSettings} isLoggedIn={isLoggedIn} onLoginRequest={handleLoginRequest} getEpisodeStatus={getEpisodeStatusCallback} />;
            case 'details': return selectedAnime && <AnimeDetailPage anime={selectedAnime} onGoBack={() => setPage(pageBeforePlayerRef.current.page)} onGoHome={goHome} onWatchNow={handleWatchNow} onGenreSelect={(g) => { setFilters({ ...filters, genres: [g] }); setPage('home'); }} onStudioSelect={(s) => { setFilters({ ...filters, studios: [s] }); setPage('home'); }} onLoginRequest={handleLoginRequest} breadcrumbsData={pageBeforePlayerRef.current} getEpisodeStatus={getEpisodeStatusCallback} onSelectRelated={handleAnimeSelect} />;
            case 'profile': return <ProfilePage onGoBack={() => setPage('home')} allAnime={allAnime} onSelectAnime={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} />;
            case 'club-detail': return selectedClub && <ClubDetailPage club={selectedClub} onGoBack={() => setPage('community')} onSelectAnime={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} />;
            case 'trending': return <TrendingPage onAnimeSelect={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />;
            case 'schedule': return <SchedulePage onAnimeSelect={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />;
            case 'history': return <HistoryPage onGoBack={() => setPage('home')} onSelectAnime={handleAnimeSelect} allAnime={allAnime} />;
            case 'news': return <NewsPage onAnimeSelect={handleAnimeSelect} />;
            case 'manga': return <MangaPage onGoBack={() => setPage('home')} />;
            case 'beginners': return <BeginnerAnimePage onGoBack={() => setPage('home')} onAnimeSelect={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />;
            case 'community': return <CommunityPage onLoginClick={() => handleLoginRequest("Please log in to join the community.")} onClubSelect={(c) => { setSelectedClub(c); setPage('club-detail'); }} onUserSelect={(u) => { setSelectedUser(u); setIsUserDetailModalOpen(true); }} onAnimeSelect={handleAnimeSelect} />;
            case 'comment-meter': return <CommentMeterPage onGoBack={() => setPage('profile')} onLoginClick={() => handleLoginRequest("Please log in to view your stats.")} />;
            case 'currency': return <CurrencyPage onGoBack={() => setPage('profile')} />;
            case 'about': return <AboutPage onGoBack={() => setPage('home')} />;
            case 'rules': return <RulesPage onGoBack={() => setPage('home')} />;
            case 'donation': return <DonationPage onGoBack={() => setPage('home')} />;
            case 'top-100': return <Top100Page onSelectAnime={handleAnimeSelect} onGoBack={() => setPage('home')} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />;
            case 'notifications': return <NotificationsPage onGoBack={() => setPage('home')} onSelectAnime={handleAnimeSelect} />;
            case 'how-to-use': return <HowToUsePage onGoBack={() => setPage('home')} />;
            case 'videos': return <VideosPage onGoBack={() => setPage('home')} onAnimeSelect={handleAnimeSelect} />;
            case 'new-episodes': return <NewEpisodesPage onAnimeSelect={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} onGoBack={() => setPage('home')} />;
            case 'errors': return <ErrorsPage onGoBack={() => setPage('home')} />;
            case 'home':
            default: return (
                <>
                    <FeaturedCarousel
                        animeList={featuredAnime}
                        onAnimeSelect={handleWatchNow}
                        onDetailsSelect={handleDetailSelect}
                        isLoading={isCarouselLoading}
                        getEpisodeStatus={getEpisodeStatusCallback}
                        onLoginRequest={handleLoginRequest}
                    />
                    {isLoggedIn && settings.showViewHistoryOnHome && <ContinueWatching onShowHistory={() => setPage('history')} onSelectAnime={(a) => handleAnimeSelect(a, 'Continue Watching')} allAnime={allAnime} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />}
                    <NewEpisodesSection onAnimeSelect={handleAnimeSelect} newEpisodeAnime={newEpisodeAnime} getEpisodeStatus={getEpisodeStatusCallback} isLoading={isNewEpisodesLoading} onViewAll={() => navigateTo('new-episodes')} onLoginRequest={handleLoginRequest} />
                    <TopAnime animeList={topAnimeList.slice(0, 10)} isLoading={isTopAnimeLoading} onAnimeSelect={handleAnimeSelect} onShowTop100={() => setPage('top-100')} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />
                    <ThisSeasonAnime onAnimeSelect={handleAnimeSelect} onShowSchedule={() => setPage('schedule')} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />
                    <RecentCommentsCarousel onAnimeSelect={handleAnimeSelect} />
                    <BeginnerAnime onAnimeSelect={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} onLoginRequest={handleLoginRequest} />
                    <AnimeGrid
                        title={filters.query ? `Search Results for "${filters.query}"` : (filters.letter ? `Titles starting with "${filters.letter}"` : "Discover Anime")}
                        animeList={gridAnime}
                        onAnimeSelect={handleAnimeSelect}
                        isLoading={isGridLoading}
                        onLoadMore={loadMoreData}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        filters={filters}
                        onSortChange={(sort) => setFilters(prev => ({ ...prev, sort }))}
                        sortValue={filters.sort}
                        loadMoreMode={settings.loadMoreMode}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        getEpisodeStatus={getEpisodeStatusCallback}
                        onCollapse={handleCollapseGrid}
                        onLoginRequest={handleLoginRequest}
                    />
                    <AlphabeticalBrowse onLetterSelect={(letter) => setFilters(prev => ({...prev, letter: prev.letter === letter ? '' : letter, query: ''}))} selectedLetter={filters.letter} />
                </>
            );
        }
    };

    return (
        <div>
            <LoadingBar isLoading={isPageLoading || isCarouselLoading || isGridLoading} />
            <Toaster />
            
            {!isEmbedMode && (
                <Sidebar 
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    filters={stagedFilters}
                    onFilterChange={setStagedFilters}
                    onApplyFilters={() => { setFilters(stagedFilters); setPage('home'); }}
                    onResetFilters={() => { setFilters({ query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [], letter: '' }); setPage('home'); }}
                    onNavigate={navigateTo}
                    onGoHome={goHome}
                    onSurpriseMe={() => {}}
                    settings={settings}
                    updateSettings={updateSettings}
                    isLoggedIn={isLoggedIn}
                    onLoginClick={handleLoginRequest}
                    installPrompt={installPrompt}
                    onInstallClick={handleInstallClick}
                />
            )}
            
            <div className={!isEmbedMode ? "" : ""}>
                {!isEmbedMode && (
                    <Header 
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onLoginClick={() => handleLoginRequest("Please log in to continue.")}
                        onSearchClick={() => setIsSearchOpen(true)}
                        onShowWatchlist={() => setIsWatchlistOpen(true)}
                        onShowQueue={() => setIsQueueOpen(true)}
                        onNavigate={navigateTo}
                        onGoHome={goHome}
                        onNotificationClick={(n) => { if(n.animeId) handleDetailSelect({id: n.animeId} as Anime); }}
                    />
                )}
                
                {!isLoggedIn && page === 'home' && <LoginPrompt onLoginClick={() => handleLoginRequest("Please log in to access all features.")} />}
                
                <main className="min-h-screen">
                    <Suspense fallback={<PageLoader />}>
                        {renderPage()}
                    </Suspense>
                </main>
                
                {!isEmbedMode && <Footer onNavigate={navigateTo} />}
            </div>
            
            {isLoginOpen && <AuthModal onClose={() => setIsLoginOpen(false)} reason={loginReason} />}
            
            <Suspense fallback={<div/>}>
                {isShortcutsHelpOpen && <ShortcutsHelpModal onClose={() => setIsShortcutsHelpOpen(false)} />}
                {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleDetailSelect} onSearchSubmit={(q) => { setFilters({ ...filters, query: q }); setPage('home'); setIsSearchOpen(false); }} />}
                {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleAnimeSelect} newEpisodeAnime={newEpisodeAnime} />}
                {isQueueOpen && <QueueOverlay onClose={() => setIsQueueOpen(false)} onSelectAnime={handleAnimeSelect} />}
                {isUserDetailModalOpen && selectedUser && <UserDetailModal user={selectedUser} onClose={() => setIsUserDetailModalOpen(false)} />}
            </Suspense>

            {!isEmbedMode && (
                <>
                    <GoToTopButton />
                    <FloatingPlayer onDock={handleWatchNow} />
                </>
            )}
        </div>
    );
}

export default App;