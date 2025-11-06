import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import type { Anime, Club, Filter, Notification, Settings, Page, User, ShortcutAction } from './types';
import { useSettings } from './hooks/useSettings';
import { useShortcuts } from './hooks/useShortcuts';
import { mapJikanToAnime, fetchWithRetry } from './api';
import { deduplicateFranchises, getDisplayTitle, getFranchiseTitle } from './utils';
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

const ANIME_PAGE_SIZE = 25;

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
    const [hasMore, setHasMore] = useState(true);
    const [preloadedData, setPreloadedData] = useState<{ anime: Anime[], hasNext: boolean } | null>(null);

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

    const { settings, updateSettings } = useSettings();
    const { shortcuts } = useShortcuts();
    const { isLoggedIn, user } = useAuth();
    const { addToast } = useToast();
    const { hidePlayer } = useFloatingPlayer();
    const welcomeToastShown = useRef(false);
    const { watchProgressList } = useWatchProgress();
    const appRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number | null>(null);
    const homePageScrollPosition = useRef(0);
    const pageBeforePlayerRef = useRef<{page: Page, filters: Filter, source?: string}>({page: 'home', filters});
    const prevPageRef = useRef<Page | undefined>(undefined);
    const pageScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


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


    // Effect for main page scrollbar styling
    useEffect(() => {
        const htmlElement = document.documentElement;
        let isPageHovering = false; // Tracks if the mouse is currently over the page content

        const handlePageScrollActivity = () => {
            htmlElement.classList.add('active-scroll');
            if (pageScrollTimeoutRef.current) {
                clearTimeout(pageScrollTimeoutRef.current);
            }
            pageScrollTimeoutRef.current = setTimeout(() => {
                if (!isPageHovering) { // Only remove if not hovering
                    htmlElement.classList.remove('active-scroll');
                }
            }, 2000); // 2 seconds delay after last scroll activity
        };

        const handlePageMouseEnter = () => {
            isPageHovering = true;
            htmlElement.classList.add('active-scroll');
            if (pageScrollTimeoutRef.current) {
                clearTimeout(pageScrollTimeoutRef.current); // Clear any pending hide
            }
        };

        const handlePageMouseLeave = () => {
            isPageHovering = false;
            // Set a timeout to hide the scrollbar if no further interaction and mouse is truly off
            if (pageScrollTimeoutRef.current) {
                clearTimeout(pageScrollTimeoutRef.current);
            }
            pageScrollTimeoutRef.current = setTimeout(() => {
                if (!htmlElement.matches(':hover')) { // Double-check if mouse is truly gone
                    htmlElement.classList.remove('active-scroll');
                }
            }, 500); // Shorter delay to fade out quickly if mouse leaves
        };

        // Attach event listeners for window scroll and html element hover
        window.addEventListener('scroll', handlePageScrollActivity, { passive: true });
        htmlElement.addEventListener('mouseenter', handlePageMouseEnter);
        htmlElement.addEventListener('mouseleave', handlePageMouseLeave);

        // Initial check: if the page is already scrolled, show the scrollbar immediately
        if (window.scrollY > 0) {
            htmlElement.classList.add('active-scroll');
            // Set a timeout to hide it if no further interaction
            pageScrollTimeoutRef.current = setTimeout(() => {
                if (!isPageHovering) {
                    htmlElement.classList.remove('active-scroll');
                }
            }, 2000);
        }

        return () => {
            // Cleanup: remove all event listeners and clear any pending timeouts
            window.removeEventListener('scroll', handlePageScrollActivity);
            htmlElement.removeEventListener('mouseenter', handlePageMouseEnter);
            htmlElement.removeEventListener('mouseleave', handlePageMouseLeave);
            if (pageScrollTimeoutRef.current) {
                clearTimeout(pageScrollTimeoutRef.current);
            }
        };
    }, []); // Empty dependency array ensures this effect runs once on mount and cleans up on unmount


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
    }, [handleResetFilters]);

    const navigateTo = useCallback((newPage: Page) => {
        setIsPageLoading(true);
        if (page !== 'player' && page !== 'profile' && page !== 'club-detail' && page !== 'watch-together') {
            homePageScrollPosition.current = window.scrollY;
        }
        setPage(newPage);
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
        const validPages: Page[] = ['trending', 'schedule', 'history', 'news', 'manga', 'community', 'beginners', 'comment-meter', 'magazines', 'currency', 'about', 'rules', 'donation', 'og-image-generator', 'top-100', 'notifications'];

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

    const performFetch = useCallback(async (pageNum: number, searchFilters: Filter) => {
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

        const hasNext = data.pagination?.has_next_page ?? false;
        
        return { anime: mappedData, hasNext };
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
        } else {
            setIsLoadingMore(true);
        }
    
        try {
            if (isNewSearch && isDefaultHome) {
                let cumulativeAnime: Anime[] = [];
                let existingFranchises = new Set<string>();
                let currentPageToFetch = 1;
                let hasNextPage = true;
                const MAX_PAGES_TO_CHECK_WITHOUT_RESULTS = 5;
                let consecutiveEmptyFetches = 0;
    
                while (cumulativeAnime.length < ANIME_PAGE_SIZE && hasNextPage) {
                    const result = await performFetch(currentPageToFetch, searchFilters);
                    hasNextPage = result.hasNext;
                    currentPageToFetch++;
    
                    if (result.anime.length === 0) {
                        break; 
                    }
    
                    const initialCount = cumulativeAnime.length;
    
                    for (const anime of result.anime) {
                        const franchiseTitle = getFranchiseTitle(anime.title);
                        if (!existingFranchises.has(franchiseTitle)) {
                            existingFranchises.add(franchiseTitle);
                            cumulativeAnime.push(anime);
                        }
                    }
    
                    if (cumulativeAnime.length === initialCount) {
                        consecutiveEmptyFetches++;
                    } else {
                        consecutiveEmptyFetches = 0;
                    }
    
                    if (consecutiveEmptyFetches >= MAX_PAGES_TO_CHECK_WITHOUT_RESULTS) {
                        break;
                    }

                    // This prevents hitting the rate limit if multiple pages are fetched in quick succession.
                    if (hasNextPage && cumulativeAnime.length < ANIME_PAGE_SIZE) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                
                setGridAnime(cumulativeAnime);
                setHasMore(hasNextPage);
                setCurrentPage(currentPageToFetch - 1);
    
                if (hasNextPage) {
                    (async () => {
                         try {
                            const preloadResult = await performFetch(currentPageToFetch, searchFilters);
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
    
                setHasMore(result.hasNext);
                if (isNewSearch) setCurrentPage(1);
    
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
                const [topRes, seasonNowRes] = await Promise.allSettled([
                    fetchWithRetry(`https://api.jikan.moe/v4/top/anime?limit=15${sfwQuery}`),
                    fetchWithRetry(`https://api.jikan.moe/v4/seasons/now?limit=20${sfwQuery}`),
                ]);

                if (topRes.status === 'fulfilled' && topRes.value.ok) {
                    const topData = await topRes.value.json();
                    let mapped = topData.data.map(mapJikanToAnime).filter(Boolean);
                    if (settings.restrictAdultContent) {
                        mapped = mapped.filter((a: Anime) => !a.isAdult);
                    }
                    setFeaturedAnime(mapped);
                } else if (topRes.status === 'rejected') {
                    console.error("Failed to fetch top anime:", topRes.reason);
                }
                
                if (seasonNowRes.status === 'fulfilled' && seasonNowRes.value.ok) {
                    const seasonNowData = await seasonNowRes.value.json();
                    let mapped = seasonNowData.data.map(mapJikanToAnime).filter(Boolean);
                    if (settings.restrictAdultContent) {
                        mapped = mapped.filter((a: Anime) => !a.isAdult);
                    }
                    const seasonNowAnime = deduplicateFranchises(mapped);
                    setTrendingAnime(seasonNowAnime.slice(0, 10)); // For header
                } else if (seasonNowRes.status === 'rejected') {
                    console.error("Failed to fetch season now anime:", seasonNowRes.reason);
                }

                const fetchTop100 = async () => {
                    let allTopAnime: Anime[] = [];
                    // Fetch top 100 TV anime of all time, ordered by score.
                    const res = await fetchWithRetry(`https://api.jikan.moe/v4/top/anime?type=tv&limit=100${sfwQuery}`);
                    if (res.ok) {
                        const data = await res.json();
                        allTopAnime.push(...data.data.map(mapJikanToAnime).filter(Boolean));
                    }
                    
                    if (settings.restrictAdultContent) {
                        allTopAnime = allTopAnime.filter((a: Anime) => !a.isAdult);
                    }
                    setTopAnimeList(allTopAnime);
                    setIsTopAnimeLoading(false);
                };
                fetchTop100();

            } catch (error) {
                console.error("An unexpected error occurred during initial data fetch", error);
            } finally {
                setIsCarouselLoading(false);
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
        const handleResize = () => {
            if (window.innerWidth >= 1024) { // lg breakpoint
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-overlay-open', String(isSidebarOpen || isSearchOpen || isLoginOpen || isWatchlistOpen || isDetailModalOpen));
    }, [isSidebarOpen, isSearchOpen, isLoginOpen, isWatchlistOpen, isDetailModalOpen]);


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
            case 'player': return selectedAnime && <Player anime={selectedAnime} onGoBack={goBackFromPlayer} onSelectRelated={handleAnimeSelect} allAnime={allAnime} onGenreSelect={handleGenreSelect} onUserSelect={handleUserSelect} onEnterRoom={handleEnterRoom} breadcrumbsData={pageBeforePlayerRef.current} />;
            case 'watch-together': return watchTogetherRoomId && <WatchTogetherPage roomId={watchTogetherRoomId} onExit={goHome} />;
            case 'profile': return <ProfilePage onGoBack={goHome} allAnime={allAnime} onSelectAnime={handleAnimeSelect} />;
            case 'club-detail': return selectedClub && <ClubDetailPage club={selectedClub} onGoBack={() => navigateTo('community')} onSelectAnime={handleAnimeSelect} />;
            case 'magazines': return <MagazinesPage onGoBack={goHome} />;
            case 'trending': return <TrendingPage onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Trending')} />;
            case 'schedule': return <SchedulePage onAnimeSelect={handleAnimeSelect} />;
            case 'history': return <HistoryPage onAnimeSelect={handleAnimeSelect} allAnime={allAnime} />;
            case 'news': return <NewsPage onAnimeSelect={handleAnimeSelect} />;
            case 'manga': return <MangaPage onGoBack={goHome} />;
            case 'community': return <CommunityPage onLoginClick={() => handleLoginRequest()} onClubSelect={handleClubSelect} onUserSelect={handleUserSelect} onAnimeSelect={handleAnimeSelect} />;
            case 'comment-meter': return <CommentMeterPage onGoBack={goHome} onLoginClick={() => handleLoginRequest()} />;
            case 'beginners': return <BeginnerAnimePage onGoBack={goHome} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'For Beginners')} />;
            case 'currency': return <CurrencyPage onGoBack={goHome} />;
            case 'about': return <AboutPage onGoBack={goHome} />;
            case 'rules': return <RulesPage onGoBack={goHome} />;
            case 'donation': return <DonationPage onGoBack={goHome} />;
            case 'og-image-generator': return <OGImageGenerator onGoBack={goHome} />;
            case 'top-100': return <Top100Page onGoBack={goHome} onSelectAnime={(anime) => handleAnimeSelect(anime, 'Top 100')} topAnimeList={topAnimeList} isLoading={isTopAnimeLoading} />;
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
                    />
                );
            case 'home':
            default:
                const isDefaultHome = !hasActiveFilters;
                const gridTitle = filters.letter ? `Titles starting with "${filters.letter.toUpperCase()}"` : (isDefaultHome ? "Discover Anime" : "Filtered Results");
                return (
                    <>
                        {isDefaultHome && <FeaturedCarousel animeList={featuredAnime} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Home')} isLoading={isCarouselLoading} />}
                        {isDefaultHome && settings.showWatchHistoryOnHome && (
                            <ContinueWatching onSelectAnime={(anime) => handleAnimeSelect(anime, 'Continue Watching')} onShowHistory={() => navigateTo('history')} allAnime={allAnime} />
                        )}
                        {isDefaultHome && <TopAnime animeList={topAnimeList.slice(0, 10)} isLoading={isTopAnimeLoading} onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Top 10')} onShowTop100={() => navigateTo('top-100')} />}
                        {isDefaultHome && <ThisSeasonAnime onAnimeSelect={(anime) => handleAnimeSelect(anime, 'Best This Season')} onShowSchedule={() => navigateTo('schedule')} />}
                        {isDefaultHome && <BeginnerAnime onAnimeSelect={(anime) => handleAnimeSelect(anime, 'For Beginners')} />}
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
                        />
                        {isDefaultHome && <AlphabeticalBrowse onLetterSelect={handleLetterSelect} selectedLetter={filters.letter} />}
                    </>
                );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, watchTogetherRoomId, hasActiveFilters, isCarouselLoading, isGridLoading, isLoadingMore, hasMore, featuredAnime, gridAnime, allAnime, filters, settings.showWatchHistoryOnHome, settings.showComments, settings.loadMoreMode, selectedAnime, selectedClub, topAnimeList, isTopAnimeLoading]);

    if (isEmbedMode) {
        if (isEmbedLoading || !embedAnime) {
            return (
                <div className="w-screen h-screen bg-black flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(var(--color-primary))]"></div>
                </div>
            );
        }
        return <Player anime={embedAnime} onGoBack={() => {}} onSelectRelated={() => {}} allAnime={[]} onGenreSelect={() => {}} onUserSelect={() => {}} isEmbed={true} onEnterRoom={() => {}} />;
    }
    
    const showHeaderAndSidebar = page !== 'watch-together';
    const showLoginPrompt = page === 'home' && !hasActiveFilters && !isLoggedIn;

    const sidebarRoot = document.getElementById('sidebar-root');
    const gotoTopRoot = document.getElementById('goto-top-root');
    const detailModalRoot = document.getElementById('detail-modal-root');
    const toastRoot = document.getElementById('toast-root');

    const handleDock = (anime: Anime) => {
        handleAnimeSelect(anime, 'Floating Player');
    };


    return (
        <div 
            ref={appRef} 
            className="bg-[rgb(var(--bg-gradient-start))] text-[rgb(var(--text-primary))]"
        >
            <LoadingBar isLoading={isPageLoading || isGridLoading || isCarouselLoading || isTopAnimeLoading} />
            {isShortcutsHelpOpen && <ShortcutsHelpModal onClose={() => setIsShortcutsHelpOpen(false)} />}
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
            
            {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleAnimeSelect} onSearchSubmit={handleSearchSubmit} />}
            {isLoginOpen && <AuthModal onClose={() => { setIsLoginOpen(false); setLoginReason(null); }} reason={loginReason} />}
            {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleAnimeSelect} />}
            {isUserDetailModalOpen && selectedUser && <UserDetailModal user={selectedUser} onClose={() => setIsUserDetailModalOpen(false)} />}
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
                />,
                sidebarRoot
            )}

            <div className={showHeaderAndSidebar ? "" : ""}>
                <div className="lg:pl-80">
                    <main>
                        {showLoginPrompt && <LoginPrompt onLoginClick={() => handleLoginRequest()} />}
                        {pageContent}
                    </main>
                    
                    {showHeaderAndSidebar && <Footer onNavigate={navigateTo} />}
                </div>
            </div>
            
            <FloatingPlayer onDock={handleDock} />
            
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