import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import type { Anime, Club, Filter, Notification, Settings, Page, User, ShortcutAction, RecentEpisode } from './types';
import { useSettings } from './hooks/useSettings';
import { useShortcuts } from './hooks/useShortcuts';
import { mapJikanToAnime, fetchWithRetry } from './api';
import { deduplicateFranchises, getDisplayTitle, getFranchiseTitle } from './utils';
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
import { GENRES_MAP, BEGINNER_ANIME_LIST } from './constants';
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
import WatchTogetherPage from './components/WatchTogetherPage';
import OGImageGenerator from './components/OGImageGenerator';
import ShortcutsHelpModal from './components/ShortcutsHelpModal';
import FloatingPlayer from './components/FloatingPlayer';
import { useFloatingPlayer } from './hooks/useFloatingPlayer';
import TopAnime from './components/TopAnime';
import Top100Page from './components/Top100Page';
import AnimeDetailModal from './components/AnimeDetailModal';
import { Toaster } from './components/Toaster';
import { useToast } from './hooks/useToast';
import NotificationsPage from './components/NotificationsPage';
import ThisSeasonAnime from './components/ThisSeasonAnime';
import LoadingBar from './components/LoadingBar';
import HowToUsePage from './components/HowToUsePage';
import NewEpisodesSection from './components/NewEpisodesSection';
import { useWatchlist } from './hooks/useWatchlist';
import { useFavorites } from './hooks/useFavorites';
import { useProfileData } from './hooks/useProfileData';
// FIX: Add missing import for FeaturedCarousel component.
import FeaturedCarousel from './components/AnimeCarousel';
import { useNotificationPrefs } from './hooks/useNotificationPrefs';
import VideosPage from './components/VideosPage';

const ANIME_PAGE_SIZE = 25;

type PaginationInfo = { hasNext: boolean; currentPage: number; totalPages: number; };

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [watchTogetherRoomId, setWatchTogetherRoomId] = useState<string | null>(null);
    const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

    // State for carousels and grids
    const [featuredAnime, setFeaturedAnime] = useState<Anime[]>([]);
    const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]); // Used for header ticker
    const [topAnimeList, setTopAnimeList] = useState<Anime[]>([]);
    const [isCarouselLoading, setIsCarouselLoading] = useState(true);
    const [isTopAnimeLoading, setIsTopAnimeLoading] = useState(true);
    
    // State for main anime grid (used for both home and filtered results)
    const [gridAnime, setGridAnime] = useState<Anime[]>([]);
    
    const [filters, setFilters] = useState<Filter>({
        query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [], letter: ''
    });
    const [stagedFilters, setStagedFilters] = useState<Filter>(filters);

    const [isGridLoading, setIsGridLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [preloadedData, setPreloadedData] = useState<{ anime: Anime[]; pagination: PaginationInfo; } | null>(null);

    const isPreloading = useRef(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [loginReason, setLoginReason] = useState<string | null>(null);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
    
    // State for Detail Modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAnimeForModal, setSelectedAnimeForModal] = useState<Anime | null>(null);


    // Embed Mode State
    const [isEmbedMode, setIsEmbedMode] = useState(false);
    const [embedAnime, setEmbedAnime] = useState<Anime | null>(null);
    const [isEmbedLoading, setIsEmbedLoading] = useState(false);

    // New Episode State
    const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisode[]>([]);
    const [newEpisodeAnime, setNewEpisodeAnime] = useState<(Anime & { episodeNumber: number })[]>([]);
    const [isNewEpisodesLoading, setIsNewEpisodesLoading] = useState(true);
    
    // PWA Install Prompt state
    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

    const { settings, updateSettings } = useSettings();
    const { shortcuts } = useShortcuts();
    const { isLoggedIn, user } = useAuth();
    const { addToast } = useToast();
    const { hidePlayer } = useFloatingPlayer();
    const { getPrefsForAnime } = useNotificationPrefs();
    const { addNotification } = useProfileData();
    const { watchlist } = useWatchlist();
    const { favorites } = useFavorites();
    const welcomeToastShown = useRef(false);
    const notifiedEpisodesRef = useRef(new Set<string>());
    const notifiedDubsRef = useRef(new Set<string>());
    const { getWatchProgress } = useWatchProgress();
    const appRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number | null>(null);
    const homePageScrollPosition = useRef(0);
    const pageBeforePlayerRef = useRef<{page: Page, filters: Filter, source?: string}>({page: 'home', filters});
    const prevPageRef = useRef<Page | undefined>(undefined);


    useEffect(() => {
        // Wait until the initial carousel data fetch is complete before removing preloader.
        if (!isCarouselLoading) {
            const preloader = document.getElementById('preloader');
            if (preloader && preloader.style.display !== 'none') {
                preloader.style.transition = 'opacity 0.5s ease';
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500); // Must match transition duration
            }
        }
    }, [isCarouselLoading]);

    // PWA Install Prompt Handler
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        (installPrompt as any).prompt();
        (installPrompt as any).userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
            if (choiceResult.outcome === 'accepted') {
                addToast('App installed successfully!', 'success');
            } else {
                addToast('Installation cancelled.', 'info');
            }
            setInstallPrompt(null);
        });
    };

    // Welcome toast on login
    useEffect(() => {
        if (isLoggedIn && user && !welcomeToastShown.current) {
            addToast(`👋 Welcome back, ${user.username}!`, 'info');
            welcomeToastShown.current = true;
        } else if (!isLoggedIn) {
            welcomeToastShown.current = false;
        }
    }, [isLoggedIn, user, addToast]);

    // Global Keyboard Shortcuts Handler
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            const formatKey = (event: KeyboardEvent): string => {
                const parts: string[] = [];
                if (event.ctrlKey) parts.push('Ctrl');
                if (event.altKey) parts.push('Alt');
                if (event.shiftKey) parts.push('Shift');
                
                let key = event.key;
                if (key === ' ') key = 'Space';
                // Avoid adding modifier keys themselves if they are the key pressed
                if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
                    parts.push(key);
                }
                return parts.join('+');
            };
            
            const formattedKey = formatKey(e);

            const action = (Object.keys(shortcuts) as ShortcutAction[]).find(act => 
                shortcuts[act].some(binding => binding.toLowerCase() === formattedKey.toLowerCase())
            );

            if (action) {
                e.preventDefault();
                switch(action) {
                    case 'toggleDarkMode':
                        updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
                        break;
                    case 'showShortcuts':
                        setIsShortcutsHelpOpen(prev => !prev);
                        break;
                    case 'escape':
                        setIsShortcutsHelpOpen(false);
                        // Other escape listeners in modals/overlays will handle their own closing
                        break;
                    default:
                        // Dispatch custom events for player-related actions
                        document.dispatchEvent(new CustomEvent(`shortcut:${action}`));
                }
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcuts, settings.theme, updateSettings]);


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
        const resetState: Filter = { query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [], letter: '' };
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
        setWatchTogetherRoomId(null);
        window.history.pushState({}, '', window.location.pathname);
        setIsSidebarOpen(false);
    }, [handleResetFilters]);

    const navigateTo = useCallback((newPage: Page) => {
        setIsPageLoading(true);
        if (page !== 'player' && page !== 'profile' && page !== 'club-detail' && page !== 'watch-together') {
            homePageScrollPosition.current = window.scrollY;
        }
        setPage(newPage);
        setIsSidebarOpen(false);
        setTimeout(() => setIsPageLoading(false), 500); // Simulate page load time for visual feedback
    }, [page]);

    const handleEnterRoom = (roomId: string) => {
        setWatchTogetherRoomId(roomId);
        setPage('watch-together');
        const url = new URL(window.location.href);
        url.searchParams.set('room', roomId);
        window.history.pushState({}, '', url);
    };
    
    // This effect handles URL parameters for PWA shortcuts and embed mode.
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for Watch Together room
        const roomParam = urlParams.get('room');
        if (roomParam) {
            handleEnterRoom(roomParam);
            return;
        }

        // Check for embed mode first
        const embedParam = urlParams.get('embed');
        const animeIdParam = urlParams.get('animeId');

        if (embedParam === 'true' && animeIdParam) {
            setIsEmbedMode(true);
            setIsEmbedLoading(true);

            const fetchEmbedAnime = async () => {
                try {
                    const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${animeIdParam}/full`);
                    if (!res.ok) throw new Error('Failed to fetch anime for embed');
                    const data = await res.json();
                    const mapped = mapJikanToAnime(data.data);
                    if (mapped) {
                        setEmbedAnime(mapped);
                    } else {
                        throw new Error('Could not process anime data for embed');
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsEmbedLoading(false);
                }
            };
            fetchEmbedAnime();
            return; // Exit early if in embed mode
        }


        const pageParam = urlParams.get('page') as Page;
        const validPages: Page[] = ['trending', 'schedule', 'history', 'news', 'manga', 'community', 'beginners', 'comment-meter', 'magazines', 'currency', 'about', 'rules', 'donation', 'og-image-generator', 'top-100', 'notifications', 'how-to-use', 'videos'];

        if (pageParam && validPages.includes(pageParam)) {
            navigateTo(pageParam);
        }

        const showWatchlistParam = urlParams.get('showWatchlist');
        if (showWatchlistParam === 'true') setIsWatchlistOpen(true);

        if (urlParams.has('page') || urlParams.has('showWatchlist')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [navigateTo]);


    const handleAnimeSelect = useCallback((anime: Anime, source?: string) => {
        hidePlayer();
        if (page !== 'player') {
          homePageScrollPosition.current = window.scrollY;
          pageBeforePlayerRef.current = { page, filters, source };
        }
        setSelectedAnime(anime);
        setPage('player');
    }, [page, filters, hidePlayer]);
    
    const handleOpenDetailModal = (anime: Anime) => {
        setSelectedAnimeForModal(anime);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setTimeout(() => setSelectedAnimeForModal(null), 300); // Delay for animation
    };

    const handleWatchNowFromModal = (anime: Anime) => {
        handleCloseDetailModal();
        setTimeout(() => handleAnimeSelect(anime, 'Detail Modal'), 300);
    };

    const goBackFromPlayer = useCallback(() => {
        setSelectedAnime(null);
        setFilters(pageBeforePlayerRef.current.filters);
        setPage(pageBeforePlayerRef.current.page);
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

    const performFetch = useCallback(async (pageNum: number, searchFilters: Filter): Promise<{ anime: Anime[], pagination: PaginationInfo }> => {
        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: ANIME_PAGE_SIZE.toString(),
        });

        if (settings.restrictAdultContent) params.append('sfw', 'true');
        if (searchFilters.query) params.append('q', searchFilters.query);
        if (searchFilters.letter) params.append('letter', searchFilters.letter);


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
    
        const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime?${params.toString()}`);
        if (!res.ok) throw new Error(`Jikan API fetch failed for page ${pageNum} with status ${res.status}`);
        
        const data = await res.json();
        let mappedData: Anime[] = data.data.map(mapJikanToAnime).filter((a: Anime | null): a is Anime => a !== null);

        if (settings.restrictAdultContent) {
            mappedData = mappedData.filter(anime => !anime.isAdult);
        }
        
        // Client-side filtering for years
        if (searchFilters.years && searchFilters.years.length > 0) {
            mappedData = mappedData.filter(anime => {
                if (!anime.releaseYear) return false;
                return searchFilters.years.some(yearRange => {
                    const startYear = parseInt(yearRange.substring(0, 4));
                    const endYear = startYear + 9;
                    return anime.releaseYear >= startYear && anime.releaseYear <= endYear;
                });
            });
        }

        // Client-side filtering for languages
        if (searchFilters.languages && searchFilters.languages.length > 0) {
            mappedData = mappedData.filter(anime => {
                return searchFilters.languages.some(lang => {
                    if (lang === 'Sub') return anime.hasSub;
                    if (lang === 'Dub') return anime.hasDub;
                    if (lang === 'Raw') return !anime.hasSub && !anime.hasDub;
                    return false;
                });
            });
        }

        // Client-side filtering for studios
        if (searchFilters.studios && searchFilters.studios.length > 0) {
            mappedData = mappedData.filter(anime => {
                return anime.studio && searchFilters.studios.includes(anime.studio);
            });
        }
        
        // Client-side filtering for tags, as Jikan API doesn't support it directly
        if (searchFilters.tags && searchFilters.tags.length > 0) {
            mappedData = mappedData.filter(anime => 
                searchFilters.tags.every(tag => 
                    anime.themes?.some(theme => theme.toLowerCase() === tag.toLowerCase())
                )
            );
        }
        
        const pagination: PaginationInfo = {
            hasNext: data.pagination?.has_next_page ?? false,
            currentPage: data.pagination?.current_page ?? 1,
            totalPages: data.pagination?.last_visible_page ?? 0,
        };

        return { anime: mappedData, pagination };
    }, [settings.restrictAdultContent]);

    const hasActiveFilters = useMemo(() => {
        return filters.query || 
               filters.genres.length > 0 || 
               filters.types.length > 0 || 
               filters.statuses.length > 0 ||
               filters.years.length > 0 ||
               filters.languages.length > 0 ||
               filters.studios.length > 0 ||
               filters.letter ||
               filters.tags.length > 0;
    }, [filters]);

    const fetchJikanGridData = useCallback(async (pageNum: number, searchFilters: Filter, isNewSearch: boolean) => {
        const isDefaultHome = !hasActiveFilters;
    
        if (isNewSearch) {
            setIsGridLoading(true);
            setPreloadedData(null);
            setTotalPages(0);
        } else {
            setIsLoadingMore(true);
        }
    
        try {
            if (isNewSearch && isDefaultHome) {
                // New logic: Fetch only the first page and deduplicate it.
                const result = await performFetch(1, searchFilters);
    
                const uniqueAnime: Anime[] = [];
                const existingFranchises = new Set<string>();
                for (const anime of result.anime) {
                    const franchiseTitle = getFranchiseTitle(anime.title);
                    if (!existingFranchises.has(franchiseTitle)) {
                        existingFranchises.add(franchiseTitle);
                        uniqueAnime.push(anime);
                    }
                }
                
                setGridAnime(uniqueAnime);
                setHasMore(result.pagination.hasNext);
                setTotalPages(result.pagination.totalPages);
                setCurrentPage(1);
    
                if (result.pagination.hasNext) {
                    (async () => {
                         try {
                            const preloadResult = await performFetch(2, searchFilters);
                            setPreloadedData(preloadResult);
                        } catch (e) {
                            console.error("Preload failed", e);
                        }
                    })();
                }
            } else {
                const result = await performFetch(pageNum, searchFilters);
    
                setGridAnime(prev => {
                    if (isNewSearch || !isDefaultHome) {
                        return isNewSearch ? result.anime : [...prev, ...result.anime];
                    }
                    const existingFranchises = new Set(prev.map(a => getFranchiseTitle(a.title)));
                    const newUniqueAnime: Anime[] = [];
                    for (const anime of result.anime) {
                        const franchiseTitle = getFranchiseTitle(anime.title);
                        if (!existingFranchises.has(franchiseTitle)) {
                            existingFranchises.add(franchiseTitle);
                            newUniqueAnime.push(anime);
                        }
                    }
                    return [...prev, ...newUniqueAnime];
                });
    
                setHasMore(result.pagination.hasNext);
                setTotalPages(result.pagination.totalPages);
                if (isNewSearch) setCurrentPage(1);
    
                if (result.pagination.hasNext) {
                     const preloadNextPage = () => {
                        if (isPreloading.current) return;
                        isPreloading.current = true;
                        (async () => {
                            try {
                                const preloadResult = await performFetch(pageNum + 1, searchFilters);
                                setPreloadedData(preloadResult);
                            } catch (e) {
                                console.error("Preload failed", e);
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
            }
        } catch (error) {
            console.error("Failed to fetch grid data:", error);
            setHasMore(false);
        } finally {
            if (isNewSearch) setIsGridLoading(false);
            else setIsLoadingMore(false);
        }
    }, [performFetch, hasActiveFilters]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsCarouselLoading(true);
            setIsTopAnimeLoading(true);
            try {
                const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
                
                // Fetch for carousel
                const topRes = await fetchWithRetry(`https://api.jikan.moe/v4/top/anime?limit=15${sfwQuery}`);

                if (topRes.ok) {
                    const topData = await topRes.json();
                    let mapped = topData.data.map(mapJikanToAnime).filter(Boolean);
                    if (settings.restrictAdultContent) {
                        mapped = mapped.filter((a: Anime) => !a.isAdult);
                    }
                    setFeaturedAnime(mapped);
                } else {
                    console.error("Failed to fetch top anime:", await topRes.text());
                }
                
                // Carousel data fetch is now complete, so we can set loading to false for it.
                // This allows the preloader to hide and the carousel to render while other data loads.
                setIsCarouselLoading(false);


                // Wait before next request
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const seasonNowRes = await fetchWithRetry(`https://api.jikan.moe/v4/seasons/now?limit=20${sfwQuery}`);
                
                if (seasonNowRes.ok) {
                    const seasonNowData = await seasonNowRes.json();
                    let mapped = seasonNowData.data.map(mapJikanToAnime).filter(Boolean);
                    if (settings.restrictAdultContent) {
                        mapped = mapped.filter((a: Anime) => !a.isAdult);
                    }
                    const seasonNowAnime = deduplicateFranchises(mapped);
                    setTrendingAnime(seasonNowAnime.slice(0, 10)); // For header
                } else {
                    console.error("Failed to fetch season now anime:", await seasonNowRes.text());
                }

                const fetchTop100 = async () => {
                    let allTopAnime: Anime[] = [];
                    // This function now handles its own loading state and error handling more robustly.
                    try {
                        // Jikan API limit is 25 per page, so we need 4 pages for top 100.
                        for (let page = 1; page <= 4; page++) {
                            // Wait before each request to respect rate limits.
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            const res = await fetchWithRetry(`https://api.jikan.moe/v4/top/anime?type=tv&limit=25&page=${page}${sfwQuery}`);
                            if (res.ok) {
                                const data = await res.json();
                                if(data.data) {
                                    allTopAnime.push(...data.data.map(mapJikanToAnime).filter(Boolean));
                                }
                                if (!data.pagination?.has_next_page) {
                                    break; // Stop if Jikan indicates no more pages.
                                }
                            } else {
                                console.error(`Failed to fetch Top 100 (page ${page}):`, await res.text());
                                break; // Stop on any page fetch error.
                            }
                        }
                        
                        if (settings.restrictAdultContent) {
                            allTopAnime = allTopAnime.filter((a: Anime) => !a.isAdult);
                        }
                        setTopAnimeList(allTopAnime);
                    } catch (error) {
                        console.error("An error occurred while fetching the top 100 anime list", error);
                    } finally {
                        setIsTopAnimeLoading(false);
                    }
                };
                fetchTop100();

            } catch (error) {
                console.error("An unexpected error occurred during initial data fetch", error);
                setIsCarouselLoading(false);
                setIsTopAnimeLoading(false);
            }
        };
        fetchInitialData();
    }, [settings.restrictAdultContent]);

    
    useEffect(() => {
        setStagedFilters(filters);
    }, [filters]);

    useEffect(() => {
        if (page !== 'player' && page !== 'watch-together') {
            setGridAnime([]);
            fetchJikanGridData(1, filters, true);
        }
    }, [filters, fetchJikanGridData, page]);
    
    useEffect(() => {
        document.documentElement.setAttribute('data-overlay-open', String(isSidebarOpen || isSearchOpen || isLoginOpen || isWatchlistOpen || isDetailModalOpen));
    }, [isSidebarOpen, isSearchOpen, isLoginOpen, isWatchlistOpen, isDetailModalOpen]);

    const allAnime = useMemo(() => {
        const animeMap = new Map<number, Anime>();
        [...featuredAnime, ...gridAnime, ...trendingAnime, ...topAnimeList].forEach(anime => {
            if (anime) animeMap.set(anime.id, anime);
        });
        return Array.from(animeMap.values());
    }, [featuredAnime, gridAnime, trendingAnime, topAnimeList]);

    // New Episode Logic
    useEffect(() => {
        const fetchRecentEpisodes = async () => {
            setIsNewEpisodesLoading(true);
            try {
                const res = await fetchWithRetry(`https://api.jikan.moe/v4/watch/episodes`);
                if (res.ok) {
                    const data = await res.json();
                    const recentFromJikan: RecentEpisode[] = (data.data || [])
                        .flatMap((day: any) => day.entry)
                        .map((entry: any) => ({
                            id: entry.mal_id.toString(), // Jikan entry mal_id is the anime ID
                            episodeId: entry.episodes?.[0]?.mal_id.toString() || '',
                            malId: entry.mal_id,
                            episodeNumber: entry.episodes?.[0]?.mal_id || 1,
                            title: entry.title,
                            image: entry.images?.jpg?.image_url,
                            url: entry.url,
                            releaseTimestamp: Date.now() // Jikan doesn't provide this, so we assume "now"
                        }));
                    setRecentEpisodes(recentFromJikan);
                } else {
                     throw new Error('Failed to fetch recent episodes from Jikan');
                }
            } catch (error) {
                console.error("Failed to fetch recent episodes:", error);
            } finally {
                setIsNewEpisodesLoading(false);
            }
        };

        fetchRecentEpisodes();
        const interval = setInterval(fetchRecentEpisodes, 15 * 60 * 1000); // every 15 mins
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (recentEpisodes.length === 0) {
            setNewEpisodeAnime([]);
            return;
        }

        const animeMap = new Map<number, Anime>();
        allAnime.forEach(anime => {
            if (anime) animeMap.set(anime.id, anime);
        });

        const newAnimeList: (Anime & { episodeNumber: number })[] = [];
        const processedMalIds = new Set<number>();

        recentEpisodes.forEach(ep => {
            if (ep.malId && !processedMalIds.has(ep.malId)) {
                const animeDetails = animeMap.get(ep.malId);
                const animeForCard = animeDetails || {
                    id: ep.malId, title: ep.title, thumbnail: ep.image, bannerImage: ep.image,
                    synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: true, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, title_english: null, title_japanese: '', themes: [], seasons_count: null, episodes_count: null,
                };
                
                const progress = getWatchProgress(ep.malId);
                if (!progress || progress.currentEpisode < ep.episodeNumber) {
                     newAnimeList.push({ ...animeForCard, episodeNumber: ep.episodeNumber });
                     processedMalIds.add(ep.malId);
                }
            }
        });

        setNewEpisodeAnime(newAnimeList);
    }, [recentEpisodes, allAnime, getWatchProgress]);
    
    // New Episode Notifications Logic
    useEffect(() => {
        if (!isLoggedIn || !settings.showNewEpisodeBadges || newEpisodeAnime.length === 0) {
            return;
        }

        newEpisodeAnime.forEach(anime => {
            const notificationId = `${anime.id}-${anime.episodeNumber}`;
            if (notifiedEpisodesRef.current.has(notificationId)) {
                return; // Already notified for this session
            }

            const isInWatchlist = watchlist.some(item => item.id === anime.id);
            const isFavorited = favorites.includes(anime.id);
            const prefs = getPrefsForAnime(anime.id);

            if ((isInWatchlist || isFavorited) && prefs.newEpisode) {
                const notifText = `Episode ${anime.episodeNumber} of "${getDisplayTitle(anime, settings)}" is now available.`;
                addNotification({
                    type: 'new_episode',
                    text: notifText,
                    animeId: anime.id,
                    animeTitle: getDisplayTitle(anime, settings),
                });
                addToast(notifText, 'info');
                notifiedEpisodesRef.current.add(notificationId);
            }
        });
    }, [newEpisodeAnime, isLoggedIn, settings, addNotification, getPrefsForAnime, watchlist, favorites, addToast]);

    // New Dub Notifications Logic
    useEffect(() => {
        if (!isLoggedIn) return;

        const allUserAnime = [
            ...watchlist,
            ...allAnime.filter(a => favorites.includes(a.id))
        ];
        const uniqueUserAnime = Array.from(new Map(allUserAnime.map(a => [a.id, a])).values());

        uniqueUserAnime.forEach(anime => {
            if (anime.hasDub) {
                const notificationId = `${anime.id}-dub`;
                if (notifiedDubsRef.current.has(notificationId)) return;

                const prefs = getPrefsForAnime(anime.id);
                if (prefs.newDub) {
                    const notifText = `A dub is now available for "${getDisplayTitle(anime, settings)}".`;
                    addNotification({
                        type: 'general', // no specific dub type
                        text: notifText,
                        animeId: anime.id,
                        animeTitle: getDisplayTitle(anime, settings)
                    });
                    addToast(notifText, 'info');
                    notifiedDubsRef.current.add(notificationId);
                }
            }
        });
    }, [isLoggedIn, watchlist, favorites, allAnime, getPrefsForAnime, addNotification, addToast, settings]);
    
    const newEpisodeAnimeRef = useRef(newEpisodeAnime);
    newEpisodeAnimeRef.current = newEpisodeAnime;

    const getEpisodeStatus = useCallback((animeId: number): { isNew: boolean, episodeNumber: number | null } => {
        if (!settings.showNewEpisodeBadges) {
            return { isNew: false, episodeNumber: null };
        }
        const found = newEpisodeAnimeRef.current.find(a => a.id === animeId);
        if (found) {
            const progress = getWatchProgress(animeId);
            // The episode is "new" if the user hasn't watched it yet.
            const isNewFlag = !progress || progress.currentEpisode < found.episodeNumber;
            return { isNew: isNewFlag, episodeNumber: found.episodeNumber };
        }
        // If not in the new episodes list, there's no current episode number to display for the badge.
        return { isNew: false, episodeNumber: null };
    }, [settings.showNewEpisodeBadges, getWatchProgress]);


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
        let isDragging = false;
        let touchStartPos = { x: 0, y: 0 };
        const dragThreshold = 10; // pixels to detect a scroll/drag

        const handleTouchStart = (event: TouchEvent) => {
            // Reset state for new touch interaction
            isDragging = false;
            if (lastHoveredElement) {
                lastHoveredElement.classList.remove('touch-hover');
                lastHoveredElement = null;
            }

            if (event.touches.length === 1) {
                touchStartPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };

                const targetElement = event.target as HTMLElement;
                const card = targetElement.closest('.anime-card-touch-target, .continue-watching-card-touch-target, .slideshow-card-touch-target, .club-card-touch-target, .manga-card-touch-target');
                
                // For a responsive tap-and-hold feel, we apply the hover immediately.
                // It will be removed if a drag is detected.
                if (card) {
                    card.classList.add('touch-hover');
                    lastHoveredElement = card;
                }
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            // If we've already detected a drag, or it's a multi-touch gesture, do nothing.
            if (isDragging || event.touches.length !== 1) return;

            const dx = Math.abs(event.touches[0].clientX - touchStartPos.x);
            const dy = Math.abs(event.touches[0].clientY - touchStartPos.y);

            // If movement exceeds the threshold, it's a drag.
            if (dx > dragThreshold || dy > dragThreshold) {
                isDragging = true;
                // Since it's a drag, remove the hover effect from the element that was initially touched.
                if (lastHoveredElement) {
                    lastHoveredElement.classList.remove('touch-hover');
                    lastHoveredElement = null;
                }
            }
        };

        const handleTouchEnd = () => {
            // Always clean up on touchend, for both taps and drags.
            if (lastHoveredElement) {
                lastHoveredElement.classList.remove('touch-hover');
                lastHoveredElement = null;
            }
            isDragging = false;
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
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
        
        const isDefaultHome = !hasActiveFilters;

        if (preloadedData) {
            let animeToAdd = preloadedData.anime;
            if (isDefaultHome) {
                const existingFranchises = new Set(gridAnime.map(a => getFranchiseTitle(a.title)));
                const uniqueNewItems: Anime[] = [];
                const franchisesOnThisPage = new Set<string>();

                for (const anime of animeToAdd) {
                    const franchiseTitle = getFranchiseTitle(anime.title);
                    if (!existingFranchises.has(franchiseTitle) && !franchisesOnThisPage.has(franchiseTitle)) {
                        franchisesOnThisPage.add(franchiseTitle);
                        uniqueNewItems.push(anime);
                    }
                }
                animeToAdd = uniqueNewItems;
            }

            setGridAnime(prev => [...prev, ...animeToAdd]);
            setHasMore(preloadedData.pagination.hasNext);
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            setTotalPages(preloadedData.pagination.totalPages);
            setPreloadedData(null);

            if (preloadedData.pagination.hasNext) {
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
    }, [hasMore, isLoadingMore, currentPage, filters, fetchJikanGridData, preloadedData, performFetch, hasActiveFilters, gridAnime]);

    const handleStagedFilterChange = (newFilters: Partial<Filter>) => setStagedFilters(prev => ({ ...prev, ...newFilters }));
    
    const handleApplyFilters = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (page !== 'home') setPage('home');
        setFilters(stagedFilters);
        setIsSidebarOpen(false);
    };

    const handleSearchSubmit = (query: string) => { 
        const newFilters = { ...filters, query, letter: '' };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFilters(newFilters);
        setIsSearchOpen(false);
        navigateTo('search');
    };

    const handleLetterSelect = (letter: string) => {
        const newFilters = { ...filters, letter, query: '' };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFilters(newFilters);
        navigateTo('home');
    }

    const handleSortChange = (sort: Filter['sort']) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const newFilters = { ...filters, sort };
        setFilters(newFilters);
        setStagedFilters(newFilters);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.animeId) return;
        const animeStub: Anime = {
            id: notification.animeId, title: notification.animeTitle || 'Loading...', thumbnail: '', bannerImage: '', synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: false, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, title_english: null, title_japanese: '', themes: [], rank: undefined,
            seasons_count: null,
            episodes_count: null,
        };
        handleAnimeSelect(animeStub);
    }

    const handleSurpriseMe = useCallback(() => {
        let availableAnime = gridAnime.length > 0 ? gridAnime : featuredAnime;
        if (availableAnime.length === 0) {
            availableAnime = BEGINNER_ANIME_LIST;
        }
        if (availableAnime.length > 0) {
            const randomAnime = availableAnime[Math.floor(Math.random() * availableAnime.length)];
            if (randomAnime) handleAnimeSelect(randomAnime, 'Surprise Me!');
        }
        setIsSidebarOpen(false);
    }, [gridAnime, featuredAnime, handleAnimeSelect]);
    
    const handleGenreSelect = (genre: string) => {
        const newFilters: Filter = {
            query: '', genres: [genre], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [], letter: ''
        };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFilters(newFilters);
        navigateTo('home');
    };

    const handleStudioSelect = (studio: string) => {
        const newFilters: Filter = {
            query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [studio], sort: 'popularity', tags: [], letter: ''
        };
        homePageScrollPosition.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setFilters(newFilters);
        navigateTo('home');
    };

    const handleCollapseGrid = useCallback(() => {
        // Find grid and scroll to it's top, it might be below other components on home page.
        const gridTitleElement = document.querySelector('.anime-grid-section h2');
        if (gridTitleElement) {
            gridTitleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        fetchJikanGridData(1, filters, true);
    }, [fetchJikanGridData, filters]);
    
    const pageContent = useMemo(() => {
        switch(page) {
            case 'player': return null; // Handled separately to preserve state
            case 'watch-together': return watchTogetherRoomId && <WatchTogetherPage roomId={watchTogetherRoomId} onExit={goHome} />;
            case 'profile': return <ProfilePage onGoBack={goHome} allAnime={allAnime} onSelectAnime={handleAnimeSelect} getEpisodeStatus={getEpisodeStatus} />;
            case 'club-detail': return selectedClub && <ClubDetailPage club={selectedClub} onGoBack={() => navigateTo('community')} onSelectAnime={handleAnimeSelect} getEpisodeStatus={getEpisodeStatus} />;
            case 'magazines': return <MagazinesPage onGoBack={goHome} />;
            case 'trending': return <TrendingPage onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Trending')} getEpisodeStatus={getEpisodeStatus} />;
            case 'schedule': return <SchedulePage onAnimeSelect={handleAnimeSelect} getEpisodeStatus={getEpisodeStatus} />;
            case 'history': return <HistoryPage onAnimeSelect={handleAnimeSelect} allAnime={allAnime} />;
            case 'news': return <NewsPage onAnimeSelect={handleAnimeSelect} />;
            case 'videos': return <VideosPage onGoBack={goHome} onAnimeSelect={handleAnimeSelect} />;
            case 'manga': return <MangaPage onGoBack={goHome} />;
            case 'community': return <CommunityPage onLoginClick={() => handleLoginRequest()} onClubSelect={handleClubSelect} onUserSelect={handleUserSelect} onAnimeSelect={handleAnimeSelect} />;
            case 'comment-meter': return <CommentMeterPage onGoBack={goHome} onLoginClick={() => handleLoginRequest()} />;
            case 'beginners': return <BeginnerAnimePage onGoBack={goHome} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'For Beginners')} getEpisodeStatus={getEpisodeStatus} />;
            case 'currency': return <CurrencyPage onGoBack={goHome} />;
            case 'about': return <AboutPage onGoBack={goHome} />;
            case 'rules': return <RulesPage onGoBack={goHome} />;
            case 'donation': return <DonationPage onGoBack={goHome} />;
            case 'how-to-use': return <HowToUsePage onGoBack={goHome} />;
            case 'og-image-generator': return <OGImageGenerator onGoBack={goHome} />;
            case 'top-100': return <Top100Page onGoBack={goHome} onSelectAnime={(anime) => handleAnimeSelect(anime, 'Top 100')} topAnimeList={topAnimeList} isLoading={isTopAnimeLoading} getEpisodeStatus={getEpisodeStatus} />;
            case 'notifications': return <NotificationsPage onGoBack={goHome} onSelectAnime={handleAnimeSelect} />;
            case 'search':
                return (
                    <AnimeGrid
                        title={`Results for "${filters.query}"`}
                        animeList={gridAnime}
                        onAnimeSelect={(anime) => handleAnimeSelect(anime, `Search "${filters.query}"`)}
                        filters={filters}
                        isLoading={isGridLoading && gridAnime.length === 0}
                        onLoadMore={loadMoreGrid}
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        sortValue={filters.sort}
                        onSortChange={handleSortChange}
                        loadMoreMode={settings.loadMoreMode}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        getEpisodeStatus={getEpisodeStatus}
                        onCollapse={handleCollapseGrid}
                    />
                );
            case 'home':
            default:
                const isDefaultHome = !hasActiveFilters;
                const gridTitle = filters.letter ? `Titles starting with "${filters.letter.toUpperCase()}"` : (isDefaultHome ? "Discover Anime" : "Filtered Results");
                return (
                    <>
                        {isDefaultHome && <FeaturedCarousel animeList={featuredAnime} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Home')} isLoading={isCarouselLoading} getEpisodeStatus={getEpisodeStatus} />}
                        {isDefaultHome && settings.showNewEpisodeBadges && <NewEpisodesSection newEpisodeAnime={newEpisodeAnime} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'New Episodes')} getEpisodeStatus={getEpisodeStatus} isLoading={isNewEpisodesLoading} />}
                        {isDefaultHome && settings.showWatchHistoryOnHome && (
                            <ContinueWatching onSelectAnime={(anime) => handleAnimeSelect(anime, 'Continue Watching')} onShowHistory={() => navigateTo('history')} allAnime={allAnime} getEpisodeStatus={getEpisodeStatus} />
                        )}
                        {isDefaultHome && <TopAnime animeList={topAnimeList.slice(0, 10)} isLoading={isTopAnimeLoading} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Top 10')} onShowTop100={() => navigateTo('top-100')} getEpisodeStatus={getEpisodeStatus} />}
                        {isDefaultHome && <ThisSeasonAnime onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Best This Season')} onShowSchedule={() => navigateTo('schedule')} getEpisodeStatus={getEpisodeStatus} />}
                        {isDefaultHome && <BeginnerAnime onAnimeSelect={(anime) => handleAnimeSelect(anime, 'For Beginners')} getEpisodeStatus={getEpisodeStatus} />}
                        <AnimeGrid
                            title={gridTitle}
                            animeList={gridAnime}
                            onAnimeSelect={(anime) => handleAnimeSelect(anime, hasActiveFilters ? 'Filtered Results' : 'Home')}
                            filters={filters}
                            isLoading={isGridLoading && gridAnime.length === 0}
                            onLoadMore={loadMoreGrid}
                            hasMore={hasMore}
                            isLoadingMore={isLoadingMore}
                            sortValue={filters.sort}
                            onSortChange={handleSortChange}
                            loadMoreMode={settings.loadMoreMode}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            getEpisodeStatus={getEpisodeStatus}
                            onCollapse={handleCollapseGrid}
                        />
                        {isDefaultHome && <AlphabeticalBrowse onLetterSelect={handleLetterSelect} selectedLetter={filters.letter} />}
                    </>
                );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, watchTogetherRoomId, hasActiveFilters, isCarouselLoading, isGridLoading, isLoadingMore, hasMore, featuredAnime, gridAnime, allAnime, filters, settings, selectedAnime, selectedClub, topAnimeList, isTopAnimeLoading, getEpisodeStatus, newEpisodeAnime, isNewEpisodesLoading, currentPage, totalPages, updateSettings, isLoggedIn]);

    if (isEmbedMode) {
        if (isEmbedLoading || !embedAnime) {
            return (
                <div className="w-screen h-screen bg-black flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(var(--color-primary))]"></div>
                </div>
            );
        }
        return <Player anime={embedAnime} onGoBack={() => {}} onSelectRelated={() => {}} allAnime={[]} onGenreSelect={() => {}} onStudioSelect={() => {}} onUserSelect={() => {}} isEmbed={true} onEnterRoom={() => {}} settings={settings} updateSettings={updateSettings} isLoggedIn={isLoggedIn} onLoginRequest={handleLoginRequest} getEpisodeStatus={getEpisodeStatus} />;
    }
    
    const showHeaderAndSidebar = page !== 'watch-together';
    const showLoginPrompt = page === 'home' && !hasActiveFilters && !isLoggedIn;

    const modalRoot = document.getElementById('modal-root');
    const sidebarRoot = document.getElementById('sidebar-root');
    const gotoTopRoot = document.getElementById('goto-top-root');
    const detailModalRoot = document.getElementById('detail-modal-root');
    const toastRoot = document.getElementById('toast-root');
    const loadingBarRoot = document.getElementById('loading-bar-root');
    const floatingPlayerRoot = document.getElementById('floating-player-root');


    const handleDock = (anime: Anime) => {
        handleAnimeSelect(anime, 'Floating Player');
    };


    return (
        <div 
            ref={appRef} 
            className="bg-[rgb(var(--bg-gradient-start))] text-[rgb(var(--text-primary))]"
        >
            {loadingBarRoot && ReactDOM.createPortal(
                <LoadingBar isLoading={isPageLoading || isGridLoading || isCarouselLoading || isTopAnimeLoading || isNewEpisodesLoading} />,
                loadingBarRoot
            )}
            {isShortcutsHelpOpen && modalRoot && ReactDOM.createPortal(
                <ShortcutsHelpModal onClose={() => setIsShortcutsHelpOpen(false)} />,
                modalRoot
            )}
            {showHeaderAndSidebar && <Header
                onMenuClick={() => setIsSidebarOpen(true)}
                onLoginClick={() => handleLoginRequest()}
                onSearchClick={() => setIsSearchOpen(true)}
                onShowWatchlist={() => setIsWatchlistOpen(true)}
                onNavigate={navigateTo}
                onGoHome={goHome}
                onNotificationClick={handleNotificationClick}
                trendingAnime={trendingAnime}
                onTrendingAnimeClick={handleSearchSubmit}
            />}
            
            {isSearchOpen && modalRoot && ReactDOM.createPortal(
                <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleAnimeSelect} onSearchSubmit={handleSearchSubmit} />,
                modalRoot
            )}
            {isLoginOpen && modalRoot && ReactDOM.createPortal(
                <AuthModal onClose={() => { setIsLoginOpen(false); setLoginReason(null); }} reason={loginReason} />,
                modalRoot
            )}
            {isWatchlistOpen && modalRoot && ReactDOM.createPortal(
                <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleAnimeSelect} newEpisodeAnime={newEpisodeAnime} />,
                modalRoot
            )}
            {isUserDetailModalOpen && selectedUser && modalRoot && ReactDOM.createPortal(
                <UserDetailModal user={selectedUser} onClose={() => setIsUserDetailModalOpen(false)} />,
                modalRoot
            )}
            {isDetailModalOpen && selectedAnimeForModal && detailModalRoot && ReactDOM.createPortal(
                <AnimeDetailModal 
                    anime={selectedAnimeForModal} 
                    onClose={handleCloseDetailModal} 
                    onWatchNow={() => handleWatchNowFromModal(selectedAnimeForModal)}
                    onGenreSelect={handleGenreSelect}
                />,
                detailModalRoot
            )}
            
            {/* Sidebar is now rendered using a Portal */}
            {showHeaderAndSidebar && sidebarRoot && ReactDOM.createPortal(
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
                    installPrompt={installPrompt}
                    onInstallClick={handleInstallClick}
                />,
                sidebarRoot
            )}

            <div className={showHeaderAndSidebar ? "" : ""}>
                <div className={`transition-[padding-left] duration-300 ease-in-out ${isSidebarOpen ? "lg:pl-80" : ""}`}>
                    <main>
                        {showLoginPrompt && <LoginPrompt onLoginClick={() => handleLoginRequest()} />}
                        
                        {/* Player is kept in the DOM but hidden to preserve its state and avoid re-mounting */}
                        <div style={{ display: page === 'player' ? 'block' : 'none' }}>
                            {selectedAnime && (
                                <Player
                                    key={selectedAnime.id}
                                    anime={selectedAnime}
                                    onGoBack={goBackFromPlayer}
                                    onSelectRelated={handleAnimeSelect}
                                    allAnime={allAnime}
                                    onGenreSelect={handleGenreSelect}
                                    onStudioSelect={handleStudioSelect}
                                    onUserSelect={handleUserSelect}
                                    onEnterRoom={handleEnterRoom}
                                    breadcrumbsData={pageBeforePlayerRef.current}
                                    settings={settings}
                                    updateSettings={updateSettings}
                                    isLoggedIn={isLoggedIn}
                                    onLoginRequest={handleLoginRequest}
                                    getEpisodeStatus={getEpisodeStatus}
                                />
                            )}
                        </div>

                        {/* Render other pages conditionally */}
                        {page !== 'player' && pageContent}
                    </main>
                    
                    {showHeaderAndSidebar && <Footer onNavigate={navigateTo} />}
                </div>
            </div>
            
            {floatingPlayerRoot && ReactDOM.createPortal(
                <FloatingPlayer onDock={handleDock} />,
                floatingPlayerRoot
            )}
            
            {gotoTopRoot && ReactDOM.createPortal(
                <GoToTopButton />,
                gotoTopRoot
            )}

            {toastRoot && ReactDOM.createPortal(
                <Toaster />,
                toastRoot
            )}
        </div>
    );
};

export default App;