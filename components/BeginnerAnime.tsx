
import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { mapJikanToAnime } from '../api';
import AnimeCard from './AnimeCard';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import { BEGINNER_ANIME_IDS } from '../constants';

interface BeginnerAnimeProps {
  onAnimeSelect: (anime: Anime) => void;
}

const BeginnerAnime: React.FC<BeginnerAnimeProps> = ({ onAnimeSelect }) => {
    const [animeList, setAnimeList] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBeginnerAnime = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchPromises = BEGINNER_ANIME_IDS.map(id =>
                    fetch(`https://api.jikan.moe/v4/anime/${id}`)
                        .then(res => {
                            if (res.status === 429) { // Basic retry for rate limit
                                return new Promise(resolve => setTimeout(resolve, 1000))
                                    .then(() => fetch(`https://api.jikan.moe/v4/anime/${id}`));
                            }
                            return res;
                        })
                        .then(res => res.ok ? res.json() : Promise.reject(`Failed for ID ${id} with status ${res.status}`))
                );

                const results = await Promise.allSettled(fetchPromises);

                const successfulAnime = results
                    .filter(result => result.status === 'fulfilled' && result.value.data)
                    .map(result => mapJikanToAnime((result as PromiseFulfilledResult<any>).value.data))
                    .filter((anime): anime is Anime => anime !== null);

                setAnimeList(successfulAnime);

            } catch (e) {
                setError("Could not load beginner-friendly anime list.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBeginnerAnime();
    }, []);

    if (error) return null;
    if (!isLoading && animeList.length === 0) return null;

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] mb-6" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Perfect for Beginners
            </h2>
             <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="flex-shrink-0 w-48">
                            <AnimeCardSkeleton />
                        </div>
                    ))
                ) : (
                    animeList.map((anime, index) => (
                        <div key={anime.id} className="flex-shrink-0 w-48 animate-subtle-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                            <AnimeCard anime={anime} onSelect={onAnimeSelect} />
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default BeginnerAnime;
