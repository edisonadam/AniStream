
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
import type { Anime, Filter } from './types';
import { useWatchLater } from './hooks/useWatchLater';
import { ANIME_TYPES } from './constants';

type View = 'home' | 'player' | 'list';

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

  const { watchLaterList } = useWatchLater();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

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

      // FIX: If genre filters are active, wait for the genre map to be loaded.
      // This prevents a race condition on initial load with filters from session storage.
      if (filters.genres && filters.genres.length > 0 && Object.keys(genreMap).length === 0) {
        return; // It will refetch when genreMap updates.
      }

      const params = new URLSearchParams({ limit: '25' });
      let endpoint = 'https://api.jikan.moe/v4/top/anime';
      let isSearchOrFilter = false;

      const { query, genres, types, status, sort } = filters;

      // Determine if we need to use the more flexible /anime endpoint
      if (query || (genres && genres.length > 0) || status) {
        endpoint = 'https://api.jikan.moe/v4/anime';
        isSearchOrFilter = true;
      }

      if (query) params.append('q', query);
      
      if (genres && genres.length > 0 && Object.keys(genreMap).length > 0) {
        const genreIds = genres.map(g => genreMap[g]).filter(Boolean).join(',');
        if (genreIds) params.append('genres', genreIds);
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
          .map((item: any): Anime => ({
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
            hasSub: true, // Assume subs are available for most content.
            hasDub: !!item.title_english, // Use English title as a proxy for dub availability.
          }))
          .filter((anime: Anime) => anime.type && ANIME_TYPES.includes(anime.type));


        // === Perform client-side filtering for params Jikan API doesn't support well together ===
        mappedData = mappedData.filter(anime => {
            if (types && types.length > 0 && (!anime.type || !types.includes(anime.type))) return false;
            if (filters.year && anime.releaseYear) {
                const startYear = parseInt(filters.year.substring(0, 4));
                if (anime.releaseYear < startYear || anime.releaseYear > startYear + 9) return false;
            }
            if (filters.language) {
              if (filters.language === 'Sub' && !anime.hasSub) return false;
              if (filters.language === 'Dub' && !anime.hasDub) return false;
            }
            // Enhance text search to include genres
            if(query && !isSearchOrFilter) {
                const lowerQuery = query.toLowerCase();
                const titleMatch = anime.title.toLowerCase().includes(lowerQuery);
                const genreMatch = anime.genres.some(g => g.toLowerCase().includes(lowerQuery));
                if(!titleMatch && !genreMatch) return false;
            }
            return true;
        });
        
        // Client-side sort if API didn't handle it
        if (!isSearchOrFilter) {
            if (sort === 'alphabetical') mappedData.sort((a, b) => a.title.localeCompare(b.title));
            else if (sort === 'release_date') mappedData.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
            else mappedData.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Default popularity
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
  }, [filters, genreMap]);

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
  
  const handleApplyFilters = (newFilters: Filter) => {
      setFilters(newFilters);
      sessionStorage.setItem('anistream-filters', JSON.stringify(newFilters));
      setView('home');
      closeSidebar();
  }

  const handleSearchSubmit = (query: string) => {
    const newFilters = { ...filters, query: query.trim() };
    setFilters(newFilters);
    sessionStorage.setItem('anistream-filters', JSON.stringify(newFilters));
    setIsSearchOpen(false);
    setView('home'); // Ensure we navigate back to the home/grid view
    setSelectedAnime(null); // Clear any selected anime
  };

  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isSidebarOpen) closeSidebar();
      if (isAuthModalOpen) setIsAuthModalOpen(false);
      if (isSearchOpen) setIsSearchOpen(false);
      if (isWatchlistOpen) setIsWatchlistOpen(false);
    }
  }, [isSidebarOpen, isAuthModalOpen, isSearchOpen, isWatchlistOpen]);

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
      return <Player anime={selectedAnime} onGoBack={handleGoHome} onSelectRelated={handleSelectAnime} />;
    }
    
    const listToDisplay = view === 'list' ? watchLaterList : animeList;

    return (
      <>
        {isHomePage && <FeaturedCarousel animeList={topAnimeList.slice(0, 5)} onAnimeSelect={handleSelectAnime} />}
        
        {isLoading && <div className="text-center p-12 text-xl font-semibold text-[rgb(var(--color-primary-accent))]/80">Loading Anime...</div>}
        {error && <div className="text-center p-12 text-[rgb(var(--color-danger))]">{error}</div>}
        {!isLoading && !error && <AnimeGrid animeList={listToDisplay} onAnimeSelect={handleSelectAnime} title={getGridTitle()} filters={filters} />}
      </>
    );
  };

  return (
    <div className="bg-gradient-to-b from-[rgb(var(--bg-gradient-start))] via-[rgb(var(--bg-gradient-via))] to-[rgb(var(--bg-gradient-end))] min-h-screen text-[rgb(var(--text-primary))] font-sans">
      <Header 
        onMenuClick={toggleSidebar} 
        onLoginClick={() => setIsAuthModalOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        onShowWatchLater={handleShowWatchLater}
        onLogoClick={handleGoHome}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        onShowWatchLater={handleShowWatchLater}
        onLogoClick={handleGoHome}
      />
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onAnimeSelect={handleSelectAnime} onSearchSubmit={handleSearchSubmit} />}
      {isWatchlistOpen && <WatchlistOverlay onClose={() => setIsWatchlistOpen(false)} onSelectAnime={handleSelectAnime}/>}

      <main className="pt-20">
        {renderContent()}
      </main>
      <Footer />

       <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
       `}</style>
    </div>
  );
};

export default App;