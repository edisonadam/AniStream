import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Anime } from '../types';

interface FloatingPlayerState {
    isVisible: boolean;
    anime: Anime | null;
    season: number;
    episode: number;
    currentTime: number;
    isPlaying: boolean;
}

interface FloatingPlayerContextType extends FloatingPlayerState {
    showPlayer: (data: { anime: Anime; season: number; episode: number; currentTime: number, isPlaying: boolean }) => void;
    hidePlayer: () => void;
    updateTime: (time: number) => void;
    setIsPlaying: (playing: boolean) => void;
}

const SESSION_STORAGE_KEY = 'anistream-floating-player';

const defaultState: FloatingPlayerState = {
    isVisible: false,
    anime: null,
    season: 1,
    episode: 1,
    currentTime: 0,
    isPlaying: false,
};

export const FloatingPlayerContext = createContext<FloatingPlayerContextType | undefined>(undefined);

export const FloatingPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<FloatingPlayerState>(() => {
        try {
            const storedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
            return storedState ? JSON.parse(storedState) : defaultState;
        } catch (error) {
            console.error("Failed to load floating player state:", error);
            return defaultState;
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save floating player state:", error);
        }
    }, [state]);

    const showPlayer = useCallback((data: { anime: Anime; season: number; episode: number; currentTime: number, isPlaying: boolean }) => {
        setState(prev => ({ ...prev, isVisible: true, ...data }));
    }, []);

    const hidePlayer = useCallback(() => {
        setState(prev => ({ ...prev, isVisible: false, isPlaying: false, anime: null }));
    }, []);

    const updateTime = useCallback((time: number) => {
        setState(prev => ({ ...prev, currentTime: time }));
    }, []);

    const setIsPlaying = useCallback((playing: boolean) => {
        setState(prev => ({ ...prev, isPlaying: playing }));
    }, []);

    const value = {
        ...state,
        showPlayer,
        hidePlayer,
        updateTime,
        setIsPlaying,
    };

    return (
        <FloatingPlayerContext.Provider value={value}>
            {children}
        </FloatingPlayerContext.Provider>
    );
};