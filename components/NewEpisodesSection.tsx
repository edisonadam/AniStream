import React from 'react';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import AnimeCard from './AnimeCard';
import { ChevronRightIcon } from './icons/Icons';

interface NewEpisodesSectionProps {
  onAnimeSelect: (anime: Anime) => void;
  newEpisodeAnime: (Anime & { episodeNumber: number })[];
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
  isLoading: boolean;
  onViewAll: () => void;
  onLoginRequest: (reason: string) => void;
}

const NewEpisodesSection: React.FC<NewEpisodesSectionProps> = ({ onAnimeSelect, newEpisodeAnime, getEpisodeStatus, isLoading, onViewAll, onLoginRequest }) => {
    const { settings } = useSettings();

    if (!settings.showNewEpisodeBadges) return null;

    if (isLoading && newEpisodeAnime.length === 0) {
        return (
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-8 bg-[rgb(var(--surface-3))] rounded-md w-1/3 mb-6 animate-pulse"></div>
                <div className="flex gap-4 md:gap-6 overflow-x-hidden">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-48 animate-pulse">
                            <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-xl"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
    
    if(newEpisodeAnime.length === 0) return null;

    return (
         <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    New Episodes
                </h2>
                <button onClick={onViewAll} className="flex items-center gap-1 px-4 py-2 bg-[rgb(var(--surface-2))/0.7] rounded-lg text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-[rgb(var(--surface-3))] transition-colors">
                    View All <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>
             <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {newEpisodeAnime.map(anime => (
                    <div key={anime.id} className="flex-shrink-0 w-48">
                        <AnimeCard 
                            anime={anime} 
                            onSelect={onAnimeSelect} 
                            episodeStatus={getEpisodeStatus(anime.id)}
                            onLoginRequest={onLoginRequest}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default NewEpisodesSection;