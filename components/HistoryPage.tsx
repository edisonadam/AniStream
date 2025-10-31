import React, { useMemo } from 'react';
import type { Anime } from '../types';
import { useProfileData } from '../hooks/useProfileData';
import AnimeCard from './AnimeCard';
import { ChevronLeftIcon } from './icons/Icons';

interface HistoryPageProps {
  onAnimeSelect: (anime: Anime) => void;
  allAnime: Anime[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onAnimeSelect, allAnime }) => {
    const { history, clearHistory } = useProfileData();
    
    const historyWithDetails = useMemo(() => {
        const animeMap = new Map(allAnime.map(a => [a.id, a]));
        return history
            .map(h => animeMap.get(h.animeId))
            .filter((a): a is Anime => a !== undefined);
    }, [history, allAnime]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Viewing History
                </h1>
                {history.length > 0 && (
                     <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear your entire viewing history? This cannot be undone.")) {
                                clearHistory();
                            }
                        }}
                        className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-xl font-semibold hover:bg-[rgb(var(--color-danger))]/40"
                    >
                        Clear History
                    </button>
                )}
            </div>

            {historyWithDetails.length > 0 ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {historyWithDetails.map((anime, index) => (
                        <div key={anime.id} className="animate-subtle-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                            <AnimeCard anime={anime} onSelect={onAnimeSelect} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[rgb(var(--surface-2))/0.5] rounded-2xl">
                    <p className="text-2xl mb-2">🤔</p>
                    <p className="font-semibold text-[rgb(var(--text-primary))] text-lg">Your history is empty.</p>
                    <p className="text-[rgb(var(--text-muted))]">Anime you watch will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;