import React, { useEffect } from 'react';
import { useWatchLater } from '../hooks/useWatchLater';
import { CloseIcon, PlayIcon, StarIcon } from './icons/Icons';
import type { Anime } from '../types';

interface WatchlistOverlayProps {
    onClose: () => void;
    onSelectAnime: (anime: Anime) => void;
}

const WatchlistOverlay: React.FC<WatchlistOverlayProps> = ({ onClose, onSelectAnime }) => {
    const { watchLaterList, removeFromWatchLater } = useWatchLater();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleResume = (anime: Anime) => {
        onSelectAnime(anime);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-lg z-50 animate-fade-in-fast flex flex-col">
            <div className="flex-shrink-0 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-white">My Watchlist</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-purple-400"><CloseIcon /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {watchLaterList.length > 0 ? (
                        <div className="space-y-4">
                            {watchLaterList.map(anime => (
                                <div key={anime.id} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-xl hover:bg-slate-800 transition-colors">
                                    <img src={anime.thumbnail} alt={anime.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{anime.title}</h3>
                                        <p className="text-sm text-gray-400 truncate">{anime.genres.join(', ')}</p>
                                        {anime.rating && (
                                            <div className="flex items-center gap-1 mt-1 text-sm text-yellow-400">
                                                <StarIcon className="w-4 h-4" />
                                                <span>{anime.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleResume(anime)} className="p-2.5 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors" aria-label="Resume">
                                            <PlayIcon />
                                        </button>
                                         <button onClick={() => removeFromWatchLater(anime.id)} className="p-2.5 bg-slate-700 rounded-full hover:bg-red-500 transition-colors" aria-label="Remove">
                                            <CloseIcon/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 p-12 text-lg">Your watchlist is empty.</p>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.3s ease-out forwards; }
             `}</style>
        </div>
    );
};

export default WatchlistOverlay;
