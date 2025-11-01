
import React, { useState, useEffect } from 'react';
import type { Anime, NewsPromo } from '../types';
import { fetchNewsPromos, mapJikanToAnime } from '../api';
import { PlayIcon } from './icons/Icons';

interface NewsPageProps {
  onAnimeSelect: (anime: Anime) => void;
}

const NewsPage: React.FC<NewsPageProps> = ({ onAnimeSelect }) => {
  const [promos, setPromos] = useState<NewsPromo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingPromo, setPlayingPromo] = useState<string | null>(null); // Store youtube video ID

  useEffect(() => {
    const getNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchNewsPromos();
        setPromos(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    getNews();
  }, []);

  const handleAnimeClick = (promo: NewsPromo) => {
    // We need to create a minimal Anime object from the promo data
    const anime: Anime = {
        id: promo.entry.mal_id,
        title: promo.entry.title,
        title_english: promo.entry.title,
        title_japanese: '',
        thumbnail: promo.entry.images.jpg.image_url,
        bannerImage: promo.entry.images.jpg.image_url,
        // Fill other required fields with defaults
        synopsis: 'No synopsis available from promo.',
        genres: [],
        releaseYear: null,
        status: 'Upcoming',
        totalEpisodes: null,
        rating: null,
        type: null,
        studio: 'Unknown',
        hasSub: true,
        hasDub: false,
        runtime: null,
        avgEpisodeDuration: null,
        isAdult: false,
    };
    onAnimeSelect(anime);
  };
  
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-[rgb(var(--surface-2))] rounded-2xl animate-pulse">
          <div className="aspect-video w-full bg-[rgb(var(--surface-3))] rounded-t-2xl"></div>
          <div className="p-4">
            <div className="h-5 bg-[rgb(var(--surface-4))] rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-1/2"></div>
          </div>
        </div>
      ));
    }
    if (error) {
      return <p className="col-span-full text-center text-red-500">{error}</p>;
    }
    return promos.map(promo => {
        const youtubeId = promo.title.includes('YouTube') ? extractYouTubeId(promo.entry.url) : null;
        return (
            <div key={promo.entry.mal_id + promo.title} className="group bg-[rgb(var(--surface-2))] rounded-2xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:-translate-y-1">
                <div className="aspect-video w-full relative">
                    {playingPromo === youtubeId ? (
                        <iframe 
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                            title={promo.title}
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    ) : (
                        <>
                            <img loading="lazy" src={promo.entry.images.jpg.image_url} alt={promo.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            {youtubeId && (
                                <button onClick={() => setPlayingPromo(youtubeId)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                    <PlayIcon className="w-12 h-12 text-white" />
                                </button>
                            )}
                        </>
                    )}
                </div>
                <div className="p-4">
                    <p className="text-sm text-[rgb(var(--text-muted))] mb-1">{promo.title}</p>
                    <button onClick={() => handleAnimeClick(promo)} className="font-bold text-[rgb(var(--text-primary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors text-left">
                        {promo.entry.title}
                    </button>
                </div>
            </div>
        );
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
        Latest Updates & Promos
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default NewsPage;