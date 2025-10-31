import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { mapJikanToAnime } from '../api';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import AnimeCard from './AnimeCard';
import { BEGINNER_ANIME_IDS } from '../constants';
import { ChevronLeftIcon } from './icons/Icons';

interface BeginnerAnimePageProps {
  onAnimeSelect: (anime: Anime) => void;
  onGoBack: () => void;
}

const BeginnerAnimePage: React.FC<BeginnerAnimePageProps> = ({ onAnimeSelect, onGoBack }) => {
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

                // Sort the anime list to match the order in BEGINNER_ANIME_IDS for consistency
                const animeMap = new Map(successfulAnime.map(a => [a.id, a]));
                const sortedList = BEGINNER_ANIME_IDS.map(id => animeMap.get(id)).filter((a): a is Anime => a !== undefined);

                setAnimeList(sortedList);

            } catch (e) {
                setError("Could not load beginner-friendly anime list.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBeginnerAnime();
    }, []);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Perfect for Beginners
            </h1>
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {Array.from({ length: 12 }).map((_, index) => <AnimeCardSkeleton key={index} />)}
                </div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {animeList.map((anime, index) => (
                        <div key={anime.id} className="animate-subtle-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                            <AnimeCard anime={anime} onSelect={onAnimeSelect} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BeginnerAnimePage;
