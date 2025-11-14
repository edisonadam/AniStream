import React, { useState, useEffect, useRef } from 'react';
import { useQueue } from '../hooks/useQueue';
import { CloseIcon, HamburgerIcon, ViewListIcon } from './icons/Icons';
import type { Anime } from '../types';

interface QueueManagerModalProps {
    onClose: () => void;
}

const QueueManagerModal: React.FC<QueueManagerModalProps> = ({ onClose }) => {
    const { queue, setQueue, removeFromQueue } = useQueue();
    const [localQueue, setLocalQueue] = useState(queue);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setLocalQueue(queue);
    }, [queue]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragOverItem.current = index;
        const list = [...localQueue];
        const dragItemContent = list[dragItem.current!];
        list.splice(dragItem.current!, 1);
        list.splice(dragOverItem.current!, 0, dragItemContent);
        dragItem.current = dragOverItem.current;
        dragOverItem.current = null;
        setLocalQueue(list);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setQueue(localQueue); // Persist final order
        e.currentTarget.classList.remove('dragging');
        dragItem.current = null;
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <div 
                className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md m-4 p-6 relative flex flex-col max-h-[80vh] animate-modal-pop-in"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                    <CloseIcon />
                </button>
                <div className="text-center mb-4">
                    <ViewListIcon className="mx-auto w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                    <h2 className="text-2xl font-bold mt-2">Edit Queue</h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                    {localQueue.map((anime, index) => (
                        <div 
                            key={anime.id} 
                            className="flex items-center gap-3 p-2 bg-[rgb(var(--surface-3))] rounded-lg"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="cursor-grab text-[rgb(var(--text-muted))]"><HamburgerIcon className="w-5 h-5"/></div>
                            <img src={anime.thumbnail} alt={anime.title} className="w-10 h-14 object-cover rounded-md" />
                            <p className="flex-1 font-semibold truncate">{anime.title}</p>
                            <button onClick={() => removeFromQueue(anime.id)} className="p-2 text-[rgb(var(--text-muted))] hover:text-red-400"><CloseIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                    {localQueue.length === 0 && <p className="text-center text-[rgb(var(--text-muted))] py-8">Your queue is empty.</p>}
                </div>
                
                <style>{`.dragging { opacity: 0.5; }`}</style>
            </div>
        </div>
    );
};

export default QueueManagerModal;