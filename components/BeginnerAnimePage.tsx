import React from 'react';
import type { Anime } from '../types';
import AnimeCard from './AnimeCard';
import { BEGINNER_ANIME_LIST } from '../constants';
import { ChevronLeftIcon } from './icons/Icons';
import { useSettings } from '../hooks/useSettings';

interface BeginnerAnimePageProps {
  onAnimeSelect: (anime: Anime) => void;
  onGoBack: () => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  onLoginRequest: (reason: string) => void;
}

const BeginnerAnimePage: React.FC<BeginnerAnimePageProps> = ({ onAnimeSelect, onGoBack, getEpisodeStatus, onLoginRequest }) => {
    const { settings } = useSettings();

    // Filter list based on SFW setting from the static list
    const animeList = settings.restrictAdultContent
        ? BEGINNER_ANIME_LIST.filter(anime => !anime.isAdult)
        : BEGINNER_ANIME_LIST;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                For Beginners
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {animeList.map((anime, index) => (
                    <div key={anime.id} className="animate-subtle-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                        <AnimeCard anime={anime} onSelect={onAnimeSelect} episodeStatus={getEpisodeStatus(anime.id)} onLoginRequest={onLoginRequest} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BeginnerAnimePage;