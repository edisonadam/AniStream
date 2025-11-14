import React, { useState } from 'react';
import { useQueue } from '../hooks/useQueue';
import { CloseIcon, PlayIcon, StarIcon, CogIcon } from './icons/Icons';
import type { Anime } from '../types';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import QueueManagerModal from './QueueManagerModal';

interface QueueOverlayProps {
    onClose: () => void;
    onSelectAnime: (anime: Anime, source?: string) => void;
}

const QueueOverlay: React.FC<QueueOverlayProps> = ({ onClose, onSelectAnime }) => {
    const { queue, removeFromQueue, clearQueue, playNextInQueue } = useQueue();
    const { settings } = useSettings();
    const [isEditing, setIsEditing] = useState(false);

    const handlePlayNext = () => {
        playNextInQueue(anime => onSelectAnime(anime, 'Queue'));
        if (queue.length <= 1) {
            onClose();
        }
    };

    return (
        <>
            {isEditing && <QueueManagerModal onClose={() => setIsEditing(false)} />}
            <div className="fixed inset-0 bg-[rgb(var(--surface-1))/0.95] backdrop-blur-lg z-50 animate-cinematic-fade-in flex flex-col">
                <div className="flex-shrink-0 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]">My Queue ({queue.length})</h2>
                        <button onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                    </div>
                    {queue.length > 0 && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <button onClick={handlePlayNext} className="flex-1 px-5 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Play Next</button>
                            <button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-initial px-5 py-2.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 flex items-center justify-center gap-2">
                                <CogIcon className="w-5 h-5"/> Edit Queue
                            </button>
                            <button onClick={clearQueue} className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-500/20 text-red-400 rounded-full font-semibold hover:bg-red-500/30">Clear Queue</button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        {queue.length > 0 ? (
                            <div className="space-y-4">
                                {queue.map((anime, index) => (
                                    <div key={anime.id} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${index === 0 ? 'bg-[rgb(var(--surface-3))]' : 'bg-[rgb(var(--surface-2))/0.5]'}`}>
                                        <span className="w-8 text-center text-xl font-bold text-[rgb(var(--text-muted))]">{index + 1}</span>
                                        <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[rgb(var(--text-primary))] truncate">{getDisplayTitle(anime, settings)}</h3>
                                            <p className="text-sm text-[rgb(var(--text-muted))] truncate">{anime.genres.join(', ')}</p>
                                            {anime.rating && (
                                                <div className="flex items-center gap-1 mt-1 text-sm text-[rgb(var(--color-warning))]">
                                                    <StarIcon className="w-4 h-4" />
                                                    <span>{anime.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => removeFromQueue(anime.id)} className="p-2.5 bg-[rgb(var(--surface-3))] rounded-full hover:bg-[rgb(var(--color-danger))] transition-colors" aria-label="Remove from queue">
                                                <CloseIcon/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[rgb(var(--text-muted))] p-12 text-lg">Your queue is empty.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default QueueOverlay;