import React from 'react';
import type { Anime } from '../types';
import AnimeCard from './AnimeCard';
import { BEGINNER_ANIME_LIST } from '../constants';

interface BeginnerAnimeProps {
  onAnimeSelect: (anime: Anime) => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const BeginnerAnime: React.FC<BeginnerAnimeProps> = ({ onAnimeSelect, getEpisodeStatus, onLoginRequest }) => {
    const animeList = BEGINNER_ANIME_LIST;

    if (animeList.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] mb-6" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                For Beginners
            </h2>
             <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 horizontal-scroll-fade">
                {animeList.map((anime, index) => (
                    <div key={anime.id} className="flex-shrink-0 w-48 animate-subtle-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        <AnimeCard anime={anime} onSelect={onAnimeSelect} episodeStatus={getEpisodeStatus(anime.id)} onLoginRequest={onLoginRequest} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default BeginnerAnime;