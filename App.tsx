
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import Player from './components/Player';
import SearchOverlay from './components/SearchOverlay';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import GoToTopButton from './components/GoToTopButton';
import ContinueWatching from './components/ContinueWatching';
import WatchlistOverlay from './components/WatchlistOverlay';
import AdBanner from './components/AdBanner';
import ClubDetailPage from './components/ClubDetailPage';
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
import AboutPage from './components/AboutPage';
import RulesPage from './components/RulesPage';
import DonationPage from './components/DonationPage';
import AlphabeticalBrowse from './components/AlphabeticalBrowse';
import WatchTogetherPage, { RoomList } from './components/WatchTogetherPage';
import OGImageGenerator from './components/OGImageGenerator';
import ShortcutsHelpModal from './components/ShortcutsHelpModal';
import FloatingPlayer from './components/FloatingPlayer';
import { useFloatingPlayer } from './hooks/useFloatingPlayer';
import TopAnime from './components/TopAnime';
import Top100Page from './components/Top100Page';
import { Toaster } from './components/Toaster';
import { useToast } from './hooks/useToast';
import NotificationsPage from './components/NotificationsPage';
import ThisSeasonAnime from './components/ThisSeasonAnime';
import LoadingBar from './components/LoadingBar';
import HowToUsePage from './components/HowToUsePage';
import NewEpisodesSection from './components/NewEpisodesSection';
import NewEpisodesPage from './components/NewEpisodesPage';
import FeaturedCarousel from './components/FeaturedCarousel';
import VideosPage from './components/VideosPage';
import AnimeDetailPage from './components/AnimeDetailPage';
import QueueOverlay from './components/QueueOverlay';
import { useQueue } from './hooks/useQueue';
import { useProfileData } from './hooks/useProfileData';
import LeaderboardsPage from './components/LeaderboardsPage';
import ShopPage from './components/ShopPage';
import DownloadsPage from './components/DownloadsPage';
import VoiceActorPage from './components/VoiceActorPage';
import PermissionInfoModal from './components/PermissionInfoModal';

const ANIME_PAGE_SIZE = 25;

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedVoiceActorId, setSelectedVoiceActorId] = useState<number | null>(null);
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
    const [seenNewEpisodes, setSeenNewEpisodes] = useState<Record<number, number>>({});
    
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

    // Global listener to un-highlight elements on scroll/drag
    useEffect(() => {
        const handleInteraction = () => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };
        window.addEventListener('scroll', handleInteraction, { passive: true });
        window.addEventListener('touchmove', handleInteraction, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('touchmove', handleInteraction);
        };
    }, []);

    // Handle History API (Browser Back/Forward)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (page === 'player') {
                hidePlayer();
            }
            if (page !== 'home') {
                // If we are deep in the app, going back likely means going home or to previous view
                // For simplicity in this SPA, back button often maps to home or restoring state if we had a router.
                // Here we just go home as a fallback if no state.
                setPage('home');
                setSelectedAnime(null);
                // Restore scroll logic
                setTimeout(() => {
                    window.scrollTo({ top: homePageScrollPosition.current, behavior: 'smooth' });
                }, 100);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [page, hidePlayer]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('seen-new-episodes');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Clean up old entries
                const twentyFourHours = 24 * 60 * 60 * 1000;
                const now = Date.now();
                const freshEntries: Record<number, number> = {};
                for (const id in parsed) {
                    if ((now - parsed[id]) < twentyFourHours) {
                        freshEntries[id] = parsed[id];
                    }
                }
                setSeenNewEpisodes(freshEntries);
                if (Object.keys(parsed).length !== Object.keys(freshEntries).length) {
                    localStorage.setItem('seen-new-episodes', JSON.stringify(freshEntries));
                }
            }
        } catch (e) {
            console.error("Failed to load seen new episodes", e);
        }
    }, []);

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
        const seenTimestamp = seenNewEpisodes[id];
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (seenTimestamp && (Date.now() - seenTimestamp) < twentyFourHours) {
            return { isNew: false, episodeNumber: null };
        }

        const recentEp = recentEpisodes.find(ep => ep.malId === id);
        const lastViewed = lastViewedTimestamps.get(id);
        
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
    }, [recentEpisodes, lastViewedTimestamps, newEpisodeAnime, seenNewEpisodes]);


    const handleLoginRequest = useCallback((reason: string) => {
        setIsLoginOpen(true);
        setLoginReason(reason);
    }, []);
    
    // Prevent scroll on LOADING SCREEN ONLY
    useEffect(() => {
        const isLoading = isCarouselLoading || isTopAnimeLoading;
        const preloader = document.getElementById('preloader');
        
        if (isLoading) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            if (preloader) preloader.style.display = 'flex';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            if (preloader && preloader.style.display !== 'none') {
                preloader.style.transition = 'opacity 0.5s ease';
                preloader.style.opacity = '0';
                setTimeout(() => { preloader.style.display = 'none'; }, 500);
            }
        }
    }, [isCarouselLoading, isTopAnimeLoading]);

    // Sidebar should NOT lock scroll anymore, allowing backdrop scroll to work and close menu
    // We remove the useEffect that was doing `document.body.style.overflow = 'hidden'` on sidebar open.

    useEffect(() => {
      const handleBeforeInstallPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    useEffect(() => {
        let scrollTimeout: number;
        const handleScroll = () => {
          document.body.classList.add('is-scrolling');
          // Add to html element as well for some browser compat
          document.documentElement.classList.add('is-scrolling');
          
          clearTimeout(scrollTimeout);
          scrollTimeout = window.setTimeout(() => {
            document.body.classList.remove('is-scrolling');
            document.documentElement.classList.remove('is-scrolling');
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
    
    // Automatically close sidebar on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

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
                const recentEntries: any[] = data.data || [];
    
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
                const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                setFeaturedAnime(mapped);
                allFetchedAnime.push(...mapped);
            } else {
                console.error("Failed to fetch featured anime:", featuredResult.status === 'rejected' ? featuredResult.reason : 'Request failed');
            }

            if (topResult.status === 'fulfilled' && topResult.value.ok) {
                const data = await topResult.value.json();
                const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                setTopAnimeList(mapped);
                allFetchedAnime.push(...mapped);
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
                const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                setGridAnime(mapped);
                setAllAnime(prev => Array.from(new Map([...prev, ...mapped].map(a => [a.id, a])).values()));
                setHasMore(data.pagination?.has_next_page ?? false);
                setTotalPages(data.pagination?.last_visible_page ?? 0);
                setCurrentPage(1);
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
            const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
            setGridAnime(prev => [...prev, ...mapped]);
            setAllAnime(prev => Array.from(new Map([...prev, ...mapped].map(a => [a.id, a])).values()));
            setHasMore(data.pagination?.has_next_page ?? false);
            setCurrentPage(pageToFetch);
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
        setSelectedVoiceActorId(null);
        setWatchTogetherRoomId(null);
        window.history.pushState({}, '', window.location.pathname);
        setIsSidebarOpen(false);
    }, []);

    const navigateTo = useCallback((newPage: Page) => {
        if (page === newPage) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        setIsPageLoading(true);
        if (!['player', 'details', 'voice-actor'].includes(page)) { homePageScrollPosition.current = window.scrollY; }
        setPage(newPage);
        window.scrollTo(0, 0);
        window.history.pushState({}, '', `?page=${newPage}`);
        setIsSidebarOpen(false);
    }, [page]);

    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoading(false), 500);
        return () => clearTimeout(timer);
    }, [page, selectedAnime]);

    const handleWatchNow = useCallback((anime: Anime, source?: string) => {
        if (page !== 'player' && page !== 'details') {
            pageBeforePlayerRef.current = { page, filters, source };
        }
        setSelectedAnime(anime);
        setPage('player');
        hidePlayer();
    }, [page, filters, hidePlayer]);

    const handleDetailSelect = useCallback((anime: Anime, source?: string) => {
        if (page !== 'player' && page !== 'details') {
            pageBeforePlayerRef.current = { page, filters, source };
        }
        setSelectedAnime(anime);
        setPage('details');
        hidePlayer();
    }, [page, filters, hidePlayer]);

    const handleAnimeSelect = useCallback((anime: Anime, source?: string) => {
        const isActuallyNew = (() => {
            const recentEp = recentEpisodes.find(ep => ep.malId === anime.id);
            if (!recentEp?.releaseTimestamp) return false;
            const releaseTimeInMs = recentEp.releaseTimestamp > 1000000000000 ? recentEp.releaseTimestamp : recentEp.releaseTimestamp * 1000;
            return (Date.now() - releaseTimeInMs) < 24 * 60 * 60 * 1000;
        })();

        if (isActuallyNew) {
            const newSeen = { ...seenNewEpisodes, [anime.id]: Date.now() };
            setSeenNewEpisodes(newSeen);
            localStorage.setItem('seen-new-episodes', JSON.stringify(newSeen));
        }

        if (source === 'Season Navigation' && page === 'player') {
            handleWatchNow(anime, source);
        } else if (source === 'Continue Watching' || source === 'Watchlist' || source === 'Queue') {
            handleWatchNow(anime, source);
        } else {
            handleDetailSelect(anime, source);
        }
    }, [page, recentEpisodes, seenNewEpisodes, handleWatchNow, handleDetailSelect]);

    const handleVoiceActorSelect = useCallback((id: number) => {
        if (page !== 'voice-actor') {
            pageBeforePlayerRef.current = { page, filters, source: 'Voice Actor' };
        }
        setSelectedVoiceActorId(id);
        setPage('voice-actor');
    }, [page, filters]);
    
    const renderPage = () => {
        if (watchTogetherRoomId) return <WatchTogetherPage roomId={watchTogetherRoomId} onExit={() => setWatchTogetherRoomId(null)} />;
        switch (page) {
            case 'player': return selectedAnime && <Player anime={selectedAnime} allAnime={allAnime} onGoBack={() => setPage(pageBeforePlayerRef.current.page)} onGoHome={goHome} onSelectRelated={handleAnimeSelect} onGenreSelect={(g) => { setFilters({ ...filters, genres: [g] }); setPage('home'); }} onStudioSelect={(s) => { setFilters({ ...filters, studios: [s] }); setPage('home'); }} onUserSelect={(u) => { setSelectedUser(u); setIsUserDetailModalOpen(true); }} onEnterRoom={setWatchTogetherRoomId} breadcrumbsData={pageBeforePlayerRef.current} settings={settings} updateSettings={updateSettings} isLoggedIn={isLoggedIn} onLoginRequest={handleLoginRequest} getEpisodeStatus={getEpisodeStatusCallback} />;
            case 'details': return selectedAnime && <AnimeDetailPage anime={selectedAnime} onGoBack={() => setPage(pageBeforePlayerRef.current.page)} onGoHome={goHome} onWatchNow={handleWatchNow} onGenreSelect={(g) => { setFilters({ ...filters, genres: [g] }); setPage('home'); }} onStudioSelect={(s) => { setFilters({ ...filters, studios: [s] }); setPage('home'); }} onLoginRequest={handleLoginRequest} breadcrumbsData={pageBeforePlayerRef.current} getEpisodeStatus={getEpisodeStatusCallback} onSelectRelated={handleAnimeSelect} onVoiceActorSelect={handleVoiceActorSelect} />;
            case 'voice-actor': return selectedVoiceActorId && <VoiceActorPage voiceActorId={selectedVoiceActorId} onGoBack={() => setPage(pageBeforePlayerRef.current.page)} onAnimeSelect={handleAnimeSelect} />;
            case 'profile': return <ProfilePage onGoBack={() => setPage('home')} allAnime={allAnime} onSelectAnime={handleAnimeSelect} getEpisodeStatus={getEpisodeStatusCallback} onNavigate={navigateTo} />;
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
            case 'leaderboards': return <LeaderboardsPage onGoBack={() => setPage('home')} />;
            case 'shop': return <ShopPage onGoBack={() => setPage('home')} onLoginRequest={handleLoginRequest} />;
            case 'downloads': return <DownloadsPage onGoBack={() => setPage('home')} />;
            case 'watch-together': return <RoomList onJoin={setWatchTogetherRoomId} onBack={() => setPage('home')} />;
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
            <PermissionInfoModal />
            {isShortcutsHelpOpen && <ShortcutsHelpModal onClose={() => setIsShortcutsHelpOpen(false)} />}
            
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
            
            <div className={`main-content-wrapper ${!isEmbedMode ? "lg:ml-80" : ""}`}>
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
                    {renderPage()}
                </main>
                
                {!isEmbedMode && <Footer onNavigate={navigateTo} />}
            </div>
            
            {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleDetailSelect} onSearchSubmit={(q) => { setFilters({ ...filters, query: q }); setPage('home'); setIsSearchOpen(false); }} />}
            {isLoginOpen && <AuthModal onClose={() => setIsLoginOpen(false)} reason={loginReason} />}
            {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleAnimeSelect} newEpisodeAnime={newEpisodeAnime} />}
            {isQueueOpen && <QueueOverlay onClose={() => setIsQueueOpen(false)} onSelectAnime={handleAnimeSelect} />}
            {isUserDetailModalOpen && selectedUser && <UserDetailModal user={selectedUser} onClose={() => setIsUserDetailModalOpen(false)} />}

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
