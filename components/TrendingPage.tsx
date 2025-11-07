import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { mapJikanToAnime, fetchWithRetry } from '../api';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import AnimeCard from './AnimeCard';
import { useSettings } from '../hooks/useSettings';

interface TrendingPageProps {
  onAnimeSelect: (anime: Anime) => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
}

const TrendingPage: React.FC<TrendingPageProps> = ({ onAnimeSelect, getEpisodeStatus }) => {
    const [trending, setTrending] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { settings } = useSettings();

    useEffect(() => {
        const fetchTrending = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
                const res = await fetchWithRetry(`https://api.jikan.moe/v4/seasons/now?limit=25${sfwQuery}`);
                if (!res.ok) throw new Error('Failed to fetch trending anime for the current season.');
                const data = await res.json();
                let mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                if (settings.restrictAdultContent) {
                    mapped = mapped.filter((a: Anime) => !a.isAdult);
                }
                setTrending(mapped);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrending();
    }, [settings.restrictAdultContent]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Trending This Season
            </h1>
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 12 }).map((_, index) => <AnimeCardSkeleton key={index} />)}
                </div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {trending.map((anime, index) => (
                        <div key={anime.id} className="animate-subtle-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                            <AnimeCard anime={anime} onSelect={onAnimeSelect} episodeStatus={getEpisodeStatus(anime.id)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrendingPage;
