
import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { fetchWithRetry, mapJikanToAnime } from '../api';
import AnimeCard from './AnimeCard';
import { ChevronLeftIcon } from './icons/Icons';
import AnimeCardSkeleton from './AnimeCardSkeleton';

interface NewEpisodesPageProps {
  onSelectAnime: (anime: Anime) => void;
  onGoBack: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const NewEpisodesPage: React.FC<NewEpisodesPageProps> = ({ onSelectAnime, onGoBack, getEpisodeStatus, onLoginRequest }) => {
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNewEpisodes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchWithRetry('https://api.jikan.moe/v4/watch/episodes?limit=25');
                if (!res.ok) {
                    throw new Error(`Failed to fetch New Episodes from Jikan API. Status: ${res.status}`);
                }
                const data = await res.json();
                const mapped = (data.data || []).map((item: any) => mapJikanToAnime(item.entry)).filter(Boolean);
                
                const uniqueAnime = Array.from(new Map(mapped.map((a: Anime) => [a.id, a])).values());

                setAnimeList(uniqueAnime);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNewEpisodes();
    }, []);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6" />
                <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                New Episodes
            </h1>
            
            {error ? (
                <div className="text-center py-12 text-red-400">{error}</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {isLoading ? (
                         Array.from({ length: 18 }).map((_, i) => (
                            <AnimeCardSkeleton key={`skel-${i}`} />
                        ))
                    ) : (
                        animeList.map((anime, index) => (
                            <div key={anime.id} className="animate-subtle-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                                <AnimeCard 
                                    anime={anime} 
                                    onSelect={onSelectAnime} 
                                    episodeStatus={getEpisodeStatus(anime.id)} 
                                    onLoginRequest={onLoginRequest}
                                    // Removed hideNewEpisodeBadge prop
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NewEpisodesPage;
