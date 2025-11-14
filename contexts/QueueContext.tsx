import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Anime } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface QueueContextType {
  queue: Anime[];
  addToQueue: (anime: Anime) => void;
  removeFromQueue: (animeId: number) => void;
  clearQueue: () => void;
  isInQueue: (animeId: number) => boolean;
  playNextInQueue: (onSelectAnime: (anime: Anime) => void) => void;
  setQueue: React.Dispatch<React.SetStateAction<Anime[]>>; // Allow direct state setting for reordering
}

export const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Anime[]>([]);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      try {
        const storedQueue = localStorage.getItem(`queue-${user.uid}`);
        if (storedQueue) {
          setQueue(JSON.parse(storedQueue));
        } else {
          setQueue([]);
        }
      } catch (error) {
        console.error("Failed to load queue from localStorage", error);
        setQueue([]);
      }
    } else {
      setQueue([]);
    }
  }, [user]);

  const persistQueue = useCallback((currentQueue: Anime[]) => {
    if (user) {
      localStorage.setItem(`queue-${user.uid}`, JSON.stringify(currentQueue));
    }
  }, [user]);

  // Persist queue whenever it changes from any source (add, remove, reorder)
  useEffect(() => {
    persistQueue(queue);
  }, [queue, persistQueue]);

  const addToQueue = useCallback((anime: Anime) => {
    setQueue(prev => {
      if (prev.some(item => item.id === anime.id)) {
        addToast(`"${anime.title}" is already in the queue.`, 'info');
        return prev;
      }
      const newQueue = [...prev, anime];
      addToast(`Added "${anime.title}" to queue.`, 'success');
      return newQueue;
    });
  }, [addToast]);

  const removeFromQueue = useCallback((animeId: number) => {
    setQueue(prev => {
        const animeToRemove = prev.find(item => item.id === animeId);
        if (animeToRemove) {
            addToast(`Removed "${animeToRemove.title}" from queue.`, 'info');
        }
        return prev.filter(item => item.id !== animeId);
    });
  }, [addToast]);

  const clearQueue = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire queue?")) {
        setQueue([]);
        addToast('Queue cleared.', 'info');
    }
  }, [addToast]);

  const isInQueue = useCallback((animeId: number) => {
    return queue.some(item => item.id === animeId);
  }, [queue]);
  
  const playNextInQueue = useCallback((onSelectAnime: (anime: Anime) => void) => {
    if (queue.length > 0) {
        const nextAnime = queue[0];
        onSelectAnime(nextAnime);
        // The selection will likely lead to a re-render; removing from queue is now handled in player logic or should be
        // to avoid race conditions. For now, we assume playing it means 'consuming' it from the queue.
        setQueue(prev => prev.slice(1));
        addToast(`Now playing from queue: "${nextAnime.title}"`, 'info');
    }
  }, [queue, addToast]);


  const value = { queue, addToQueue, removeFromQueue, clearQueue, isInQueue, playNextInQueue, setQueue };

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
};