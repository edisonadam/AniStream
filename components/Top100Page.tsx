
import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { ChevronLeftIcon, StarIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';
import { fetchWithRetry, mapJikanToAnime } from '../api';

interface Top100PageProps {
  onSelectAnime: (anime: Anime) => void;
  onGoBack: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const Top100Page: React.FC<Top100PageProps> = ({ onSelectAnime, onGoBack, getEpisodeStatus, onLoginRequest }) => {
    const { settings } = useSettings();
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTop100 = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Jikan API limits items per page (usually 25). Fetching 100 directly might fail or return truncated results.
                // We fetch 4 pages of 25 sequentially to ensure we get the full top 100 reliably.
                let collectedData: any[] = [];
                
                for (let page = 1; page <= 4; page++) {
                    const res = await fetchWithRetry(`https://api.jikan.moe/v4/top/anime?page=${page}&limit=25`);
                    if (!res.ok) {
                        throw new Error(`Failed to fetch Top 100 data (Page ${page}). Status: ${res.status}`);
                    }
                    const data = await res.json();
                    if (data.data) {
                        collectedData = [...collectedData, ...data.data];
                    }
                    // Small delay to respect rate limits
                    await new Promise(resolve => setTimeout(resolve, 350));
                }

                let mapped = collectedData.map(mapJikanToAnime).filter((a): a is Anime => a !== null);
                
                if (settings.restrictAdultContent) {
                    mapped = mapped.filter((a: Anime) => !a.isAdult);
                }
                
                // Deduplicate just in case the API returns overlapping data during updates
                const uniqueAnime = Array.from(new Map(mapped.map(a => [a.id, a])).values());
                
                setAnimeList(uniqueAnime);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTop100();
    }, [settings.restrictAdultContent]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Top 100 Anime
            </h1>
            
            {error ? (
                <div className="text-center py-12 text-red-400">{error}</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {isLoading ? (
                         Array.from({ length: 18 }).map((_, i) => (
                            <div key={`skel-${i}`} className="animate-pulse">
                                <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-xl"></div>
                                <div className="h-4 mt-2 bg-[rgb(var(--surface-4))] rounded w-3/4 mx-auto"></div>
                            </div>
                        ))
                    ) : (
                        animeList.map((anime, index) => (
                            <div key={anime.id} className="relative group animate-subtle-fade-in-up" style={{ animationDelay: `${index * 20}ms` }}>
                                <span 
                                    className="absolute -top-4 -left-2 text-6xl font-black text-[rgb(var(--surface-3))] transition-colors duration-300 group-hover:text-[rgb(var(--color-primary-accent))] z-0 pointer-events-none select-none"
                                    style={{ textShadow: `0 2px 4px rgba(0,0,0,0.5)` }}
                                >
                                    {index + 1}
                                </span>
                                <div className="relative z-10">
                                    <AnimeCard 
                                        anime={anime} 
                                        onSelect={onSelectAnime} 
                                        episodeStatus={getEpisodeStatus(anime.id)} 
                                        onLoginRequest={onLoginRequest}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Top100Page;
