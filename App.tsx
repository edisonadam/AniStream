import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FeaturedSlideshow from './components/FeaturedSlideshow';
import AnimeGrid from './components/AnimeGrid';
import Footer from './components/Footer';
import Player from './components/Player';
import type { Anime } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  }

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime(anime);
    window.scrollTo(0, 0);
  };

  const handleGoBack = () => {
    setSelectedAnime(null);
  };

  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isSidebarOpen) {
        closeSidebar();
      }
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [handleEscKey]);

  return (
    <div className="bg-gradient-to-b from-purple-900 via-slate-900 to-black min-h-screen text-gray-100 font-sans">
      <Header onMenuClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <main className="pt-20">
        {selectedAnime ? (
          <Player anime={selectedAnime} onGoBack={handleGoBack} onSelectRelated={handleSelectAnime} />
        ) : (
          <>
            <FeaturedSlideshow />
            <AnimeGrid onAnimeSelect={handleSelectAnime} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
