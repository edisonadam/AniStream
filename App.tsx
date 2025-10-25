
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FeaturedCarousel from './components/FeaturedCarousel';
import AnimeGrid from './components/AnimeGrid';
import Footer from './components/Footer';
import Player from './components/Player';
import AuthModal from './components/AuthModal';
import SearchOverlay from './components/SearchOverlay';
import WatchlistOverlay from './components/WatchlistOverlay';
import ProfilePage from './components/ProfilePage';
import ContinueWatching from './components/ContinueWatching';
import type { Anime, Filter, Notification } from './types';
import { useWatchLater } from './hooks/useWatchLater';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';
import { ANIME_TYPES } from './constants';

type View = 'home' | 'player' | 'list' | 'profile';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  
  const [view, setView] = useState<View>('home');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [topAnimeList, setTopAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filter>(() => {
    const savedFilters = sessionStorage.getItem('anistream-filters');
    return savedFilters ? JSON.parse(savedFilters) : {};
  });
  
  const [genreMap, setGenreMap] = useState<Record<string, number>>({});
  const { isLoggedIn } = useAuth();
  const { watchLaterList } = useWatchLater();
  const { settings } = useSettings();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Apply desktop mode class based on settings and window size
  useEffect(() => {
    const rootContainer = document.querySelector('#root > div');
    if (!rootContainer) return;

    const applyLayoutMode = () => {
      const isDesktop = settings.forceDesktopMode || window.innerWidth >= 1024;
      if (isDesktop) {
        rootContainer.classList.add('desktop-mode');
      } else {
        rootContainer.classList.remove('desktop-mode');
      }
      if (settings.forceDesktopMode) {
        rootContainer.classList.add('force-desktop-mode');
      } else {
        rootContainer.classList.remove('force-desktop-mode');
      }
    };

    applyLayoutMode();
    window.addEventListener('resize', applyLayoutMode);
    return () => window.removeEventListener('resize', applyLayoutMode);
  }, [settings.forceDesktopMode]);


  // Fetch genre mapping on initial load
  useEffect(() => {
    const fetchGenreMap = async () => {
      try {
        const response = await fetch('https://api.jikan.moe/v4/genres/anime');
        if (!response.ok) return;
        const data = await response.json();
        const map = data.data.reduce((acc: Record<string, number>, genre: any) => {
          acc[genre.name] = genre.mal_id;
          return acc;
        }, {});
        setGenreMap(map);
      } catch (e) {
        console.error("Failed to fetch genre map", e);
      }
    };
    fetchGenreMap();
  }, []);

  // Centralized data fetching logic based on filters
  useEffect(() => {
    const fetchAnime = async () => {
      setIsLoading(true);
      setError(null);

      if (filters.genres && filters.genres.length > 0 && Object.keys(genreMap).length === 0) {
        return; 
      }

      const params = new URLSearchParams({ limit: '25' });
      let endpoint = 'https://api.jikan.moe/v4/top/anime';
      let isSearchOrFilter = false;

      const { query, genres, types, status, sort } = filters;

      if (query || (genres && genres.length > 0) || status || (types && types.length > 0)) {
        endpoint = 'https://api.jikan.moe/v4/anime';
        isSearchOrFilter = true;
      }

      if (query) params.append('q', query);
      
      if (genres && genres.length > 0 && Object.keys(genreMap).length > 0) {
        const genreIds = genres.map(g => genreMap[g]).filter(Boolean).join(',');
        if (genreIds) params.append('genres', genreIds);
      }
      
      if (isSearchOrFilter) {
          if (types && types.length > 0) {
              params.append('type', types.map(t => t.toLowerCase()).join(','));
          } else if (query) {
              // Default to main anime types for general searches to exclude junk
              params.append('type', ANIME_TYPES.map(t => t.toLowerCase()).join(','));
          }
      }

      if (status) {
        const jikanStatusMap = { 'Ongoing': 'airing', 'Completed': 'complete', 'Upcoming': 'upcoming' };
        params.append('status', jikanStatusMap[status]);
      }
      
      const sortMap = { 'popularity': 'score', 'release_date': 'start_date', 'alphabetical': 'title' };
      if (sort && isSearchOrFilter) {
          params.append('order_by', sortMap[sort]);
          params.append('sort', sort === 'alphabetical' ? 'asc' : 'desc');
      }

      try {
        const response = await fetch(`${endpoint}?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch anime data from Jikan API.');
        
        const data = await response.json();

        let mappedData: Anime[] = data.data
          .map((item: any): Anime => {
            let totalMinutes = 0;
            const hourMatch = item.duration?.match(/(\d+)\s*hr/);
            const minMatch = item.duration?.match(/(\d+)\s*min/);
            if (hourMatch?.[1]) totalMinutes += parseInt(hourMatch[1], 10) * 60;
            if (minMatch?.[1]) totalMinutes += parseInt(minMatch[1], 10);
            
            let avgEpDuration: number | null = null;
            if (item.duration && item.duration.includes('per ep')) {
              const epMinMatch = item.duration.match(/(\d+)\s*min/);
              if (epMinMatch && epMinMatch[1]) {
                avgEpDuration = parseInt(epMinMatch[1], 10);
              }
            }

            return {
              id: item.mal_id,
              title: item.title_english || item.title,
              thumbnail: item.images.jpg.large_image_url,
              bannerImage: item.images.jpg.large_image_url,
              synopsis: item.synopsis || 'No synopsis available.',
              genres: item.genres.map((g: any) => g.name),
              releaseYear: item.year,
              status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming',
              totalEpisodes: item.episodes,
              rating: item.score,
              type: item.type,
              studio: item.studios.length > 0 ? item.studios[0].name : 'Unknown',
              hasSub: true,
              hasDub: !!item.title_english,
              runtime: totalMinutes > 0 ? totalMinutes : null,
              avgEpisodeDuration: avgEpDuration,
              isAdult: item.rating === 'Rx - Hentai',
            };
          })
          .filter((anime: Anime) => anime.type && ANIME_TYPES.includes(anime.type));
        
        // Apply content restriction and post-fetch filters
        mappedData = mappedData.filter(anime => {
            if (settings.restrictAdultContent && anime.isAdult) return false;
            if (types && types.length > 0 && (!anime.type || !types.includes(anime.type))) return false;
            if (filters.year && anime.releaseYear) {
                const startYear = parseInt(filters.year.substring(0, 4));
                if (anime.releaseYear < startYear || anime.releaseYear > startYear + 9) return false;
            }
            if (filters.language) {
              if (filters.language === 'Sub' && !anime.hasSub) return false;
              if (filters.language === 'Dub' && !anime.hasDub) return false;
            }
            if(query && !isSearchOrFilter) {
                const lowerQuery = query.toLowerCase();
                const titleMatch = anime.title.toLowerCase().includes(lowerQuery);
                const genreMatch = anime.genres.some(g => g.toLowerCase().includes(lowerQuery));
                if(!titleMatch && !genreMatch) return false;
            }
            return true;
        });
        
        if (!isSearchOrFilter) {
            if (sort === 'alphabetical') mappedData.sort((a, b) => a.title.localeCompare(b.title));
            else if (sort === 'release_date') mappedData.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
            else mappedData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        setAnimeList(mappedData);
        if(!isSearchOrFilter) {
          setTopAnimeList(mappedData);
        }

      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnime();
  }, [filters, genreMap, settings.restrictAdultContent]);

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime(anime);
    setView('player');
    window.scrollTo(0, 0);
  };

  const handleGoHome = () => {
    setSelectedAnime(null);
    setView('home');
    setFilters({});
  };

  const handleShowWatchLater = () => {
      setIsWatchlistOpen(true);
  };

  const handleShowProfile = () => {
    setView('profile');
    closeSidebar();
  }
  
  const handleApplyFilters = (newFilters: Filter) => {
      setFilters(newFilters);
      sessionStorage.setItem('anistream-filters', JSON.stringify(newFilters));
      setView('home');
      closeSidebar();
  }

  const handleSearchSubmit = (query: string) => {
    const newFilters: Filter = { query: query.trim() };
    if (filters.sort) { // Preserve sorting preference
        newFilters.sort = filters.sort;
    }
    setFilters(newFilters);
    sessionStorage.setItem('anistream-filters', JSON.stringify(newFilters));
    setIsSearchOpen(false);
    setView('home');
    setSelectedAnime(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.animeId) {
        const anime = topAnimeList.find(a => a.id === notification.animeId) || animeList.find(a => a.id === notification.animeId);
        if (anime) {
            handleSelectAnime(anime);
        }
    }
  };

  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isSidebarOpen) closeSidebar();
      if (isAuthModalOpen) setIsAuthModalOpen(false);
      if (isSearchOpen) setIsSearchOpen(false);
      if (isWatchlistOpen) setIsWatchlistOpen(false);
      if (view === 'profile') setView('home');
    }
  }, [isSidebarOpen, isAuthModalOpen, isSearchOpen, isWatchlistOpen, view]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [handleEscKey]);

  const getGridTitle = () => {
      if (view === 'list') return "My Watch Later List";
      if (filters.query) return `Search Results for "${filters.query}"`;
      if (filters.genres && filters.genres.length > 0) return `${filters.genres.join(', ')} Anime`;
      if (Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : !!v)) return "Filtered Results";
      return "Top Anime";
  }
  
  const isHomePage = !Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : !!v) && view === 'home';

  const renderContent = () => {
    if (view === 'player' && selectedAnime) {
      return <Player anime={selectedAnime} onGoBack={handleGoHome} onSelectRelated={handleSelectAnime} allAnime={animeList} />;
    }

    if (view === 'profile') {
        return <ProfilePage onGoBack={handleGoHome} allAnime={animeList} onSelectAnime={handleSelectAnime}/>
    }
    
    const listToDisplay = view === 'list' ? watchLaterList : animeList;

    return (
      <>
        {isHomePage && <FeaturedCarousel animeList={topAnimeList.slice(0, 5)} onAnimeSelect={handleSelectAnime} isLoading={isLoading} />}
        {isHomePage && isLoggedIn && <ContinueWatching allAnime={topAnimeList} onShowWatchlist={handleShowWatchLater} onSelectAnime={handleSelectAnime} />}
        
        {error && <div className="text-center p-12 text-[rgb(var(--color-danger))]">{error}</div>}
        {!error && <AnimeGrid animeList={listToDisplay} onAnimeSelect={handleSelectAnime} title={getGridTitle()} filters={filters} isLoading={isLoading} />}
      </>
    );
  };

  return (
    <div className="bg-gradient-to-b from-[rgb(var(--bg-gradient-start))] via-[rgb(var(--bg-gradient-via))] to-[rgb(var(--bg-gradient-end))] min-h-screen text-[rgb(var(--text-primary))] font-sans transition-colors duration-500">
      <Header 
        onMenuClick={toggleSidebar} 
        onLoginClick={() => setIsAuthModalOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        onShowWatchLater={handleShowWatchLater}
        onShowProfile={handleShowProfile}
        onLogoClick={handleGoHome}
        onNotificationClick={handleNotificationClick}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        onShowWatchLater={handleShowWatchLater}
        onShowProfile={handleShowProfile}
        onLogoClick={handleGoHome}
      />
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleSelectAnime} onSearchSubmit={handleSearchSubmit} />}
      {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleSelectAnime}/>}

      <main className="pt-20">
        <div key={`${view}-${selectedAnime?.id || 'home'}`} className="animate-cinematic-fade-in">
          {renderContent()}
        </div>
      </main>
      <Footer />

       <style>{`
        /* This style block can be removed as animations are now global in index.html */
       `}</style>
    </div>
  );
};

export default App;
