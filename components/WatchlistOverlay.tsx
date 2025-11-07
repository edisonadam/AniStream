import React, { useEffect, useState, useMemo } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { CloseIcon, PlayIcon, StarIcon } from './icons/Icons';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';

interface WatchlistOverlayProps {
    onClose: () => void;
    onSelectAnime: (anime: Anime, source?: string) => void;
    newEpisodeAnime: (Anime & { episodeNumber: number })[];
}

type Tab = 'all' | 'new';

const WatchlistOverlay: React.FC<WatchlistOverlayProps> = ({ onClose, onSelectAnime, newEpisodeAnime }) => {
    const { watchlist, removeFromWatchlist } = useWatchlist();
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState<Tab>('all');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleResume = (anime: Anime) => {
        onSelectAnime(anime, 'Watchlist');
        onClose();
    };

    const newInWatchlist = useMemo(() => {
        const watchlistIds = new Set(watchlist.map(a => a.id));
        return newEpisodeAnime.filter(a => watchlistIds.has(a.id));
    }, [newEpisodeAnime, watchlist]);

    const listToDisplay = activeTab === 'new' ? newInWatchlist : watchlist;

    return (
        <div className="fixed inset-0 bg-[rgb(var(--surface-1))/0.95] backdrop-blur-lg z-50 animate-cinematic-fade-in flex flex-col">
            <div className="flex-shrink-0 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]">My Watchlist</h2>
                    <button onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                </div>
                 <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1 mt-4 max-w-xs">
                    <button onClick={() => setActiveTab('all')} className={`flex-1 px-3 py-1 text-sm rounded-full transition-all ${activeTab === 'all' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>All ({watchlist.length})</button>
                    {settings.showNewEpisodeBadges && (
                        <button onClick={() => setActiveTab('new')} className={`flex-1 px-3 py-1 text-sm rounded-full transition-all ${activeTab === 'new' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>New Episodes ({newInWatchlist.length})</button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {listToDisplay.length > 0 ? (
                        <div className="space-y-4">
                            {listToDisplay.map(anime => (
                                <div key={anime.id} className="flex items-center gap-4 bg-[rgb(var(--surface-2))/0.5] p-3 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
                                    <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[rgb(var(--text-primary))] truncate">{getDisplayTitle(anime, settings)}</h3>
                                        <p className="text-sm text-[rgb(var(--text-muted))] truncate">
                                            {anime.type && <span className="font-semibold">{anime.type}</span>}
                                            {anime.type && anime.genres.length > 0 && <span> &bull; </span>}
                                            {anime.genres.join(', ')}
                                        </p>
                                        {anime.rating && (
                                            <div className="flex items-center gap-1 mt-1 text-sm text-[rgb(var(--color-warning))]">
                                                <StarIcon className="w-4 h-4" />
                                                <span>{anime.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleResume(anime)} className="p-2.5 bg-[rgb(var(--color-primary))] rounded-full hover:bg-[rgb(var(--color-primary-hover))] transition-colors" aria-label="Resume">
                                            <PlayIcon />
                                        </button>
                                         <button onClick={() => removeFromWatchlist(anime.id)} className="p-2.5 bg-[rgb(var(--surface-3))] rounded-full hover:bg-[rgb(var(--color-danger))] transition-colors" aria-label="Remove">
                                            <CloseIcon/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-[rgb(var(--text-muted))] p-12 text-lg">{activeTab === 'all' ? 'Your watchlist is empty.' : 'No new episodes from your watchlist.'}</p>
                    )}
                </div>
            </div>
             <style>{`
                /* Removed old animation, now using global styles */
             `}</style>
        </div>
    );
};

export default WatchlistOverlay;