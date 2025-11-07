import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import Artplayer from 'artplayer';
import { useFloatingPlayer } from '../hooks/useFloatingPlayer';
import type { Anime } from '../types';
import { CloseIcon, PauseIcon, PlayIcon, ArrowTopRightOnSquareIcon } from './icons/Icons';
import { getDisplayTitle } from '../utils';
import { useSettings } from '../hooks/useSettings';

interface FloatingPlayerProps {
    onDock: (anime: Anime) => void;
}

const DraggableFloatingPlayer: React.FC<FloatingPlayerProps> = ({ onDock }) => {
    const { isVisible, anime, season, episode, currentTime, isPlaying, hidePlayer, updateTime, setIsPlaying } = useFloatingPlayer();
    const { settings } = useSettings();
    const artplayerRef = useRef<HTMLDivElement>(null);
    const artplayerInstance = useRef<Artplayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isInteracting, setIsInteracting] = useState(false);
    const [isPausedForOverlay, setIsPausedForOverlay] = useState(false);
    const posRef = useRef({ x: 0, y: 0 });
    const dragStateRef = useRef({ isDragging: false, initialX: 0, initialY: 0, startX: 0, startY: 0 });

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
        }
    });

    const dispatchEvent = (name: string, detail?: any) => document.dispatchEvent(new CustomEvent(name, { detail }));

    const isMostlyOnScreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return false;
        const rect = container.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const visibleWidth = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
        const visibleHeight = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
        const visibleArea = visibleWidth * visibleHeight;
        return visibleArea >= (rect.width * rect.height) / 2;
    }, []);

    const setPosition = useCallback((x: number, y: number) => {
        const container = containerRef.current;
        if (!container) return { x, y };

        const minVisible = 28;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        const minX = -w + minVisible;
        const maxX = vw - minVisible;
        const minY = -h + minVisible;
        const maxY = vh - minVisible;

        const clampedX = Math.max(minX, Math.min(x, maxX));
        const clampedY = Math.max(minY, Math.min(y, maxY));
        
        container.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
        posRef.current = { x: clampedX, y: clampedY };
        return { x: clampedX, y: clampedY };
    }, []);

    const snapToCorner = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const { x: currentX, y: currentY } = posRef.current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const snapMargin = 20;
        const w = container.offsetWidth;
        const h = container.offsetHeight;

        const centerX = currentX + w / 2;
        const centerY = currentY + h / 2;

        const isLeft = centerX < vw / 2;
        const isTop = centerY < vh / 2;

        const finalX = isLeft ? snapMargin : vw - w - snapMargin;
        const finalY = isTop ? snapMargin : vh - h - snapMargin;
        
        const finalPos = setPosition(finalX, finalY);
        sessionStorage.setItem('pip-position', JSON.stringify(finalPos));
        dispatchEvent('pip:position-changed', finalPos);
    }, [setPosition]);

    useEffect(() => {
        if (isVisible) {
            dispatchEvent('pip:opened', posRef.current);
        }
    }, [isVisible]);

    useEffect(() => {
        if (isVisible && anime && artplayerRef.current && !artplayerInstance.current) {
            // FIX: Cast options to 'any' to bypass incorrect type definitions for properties like 'isPlaying'.
            const art = new Artplayer({
                container: artplayerRef.current,
                url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                poster: anime.thumbnail,
                theme: 'rgb(var(--color-primary))',
                volume: 0.5,
                isPlaying: isPlaying && !isPausedForOverlay,
                playsinline: true,
                autoMini: false, screenshot: false, setting: false, pip: false, hotkey: false,
                controls: [],
            } as any);

            art.on('ready', () => {
                art.seek = currentTime;
                if (isPlaying && !isPausedForOverlay) art.play();
            });
            art.on('timeupdate', () => updateTime(art.currentTime));
            art.on('play', () => setIsPlaying(true));
            art.on('pause', () => setIsPlaying(false));

            artplayerInstance.current = art;
        }

        return () => {
            if (artplayerInstance.current && !isVisible) {
                artplayerInstance.current.destroy(true);
                artplayerInstance.current = null;
            }
        };
    }, [isVisible, anime, isPlaying, isPausedForOverlay, currentTime, setIsPlaying, updateTime]);

    useEffect(() => {
        const checkOverlayPause = () => {
            const overlayOpen = document.documentElement.getAttribute('data-overlay-open') === 'true';
            if (overlayOpen && !isPausedForOverlay && isVisible) {
                if (isMostlyOnScreen()) {
                    setIsPausedForOverlay(true);
                    dispatchEvent('pip:paused', { paused: true });
                }
            } else if (!overlayOpen && isPausedForOverlay) {
                setIsPausedForOverlay(false);
                dispatchEvent('pip:paused', { paused: false });
            }
        };
        const observer = new MutationObserver(checkOverlayPause);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-overlay-open'] });
        checkOverlayPause();
        return () => observer.disconnect();
    }, [isPausedForOverlay, isVisible, isMostlyOnScreen]);

    useEffect(() => {
        const art = artplayerInstance.current;
        if (!art) return;
        const shouldPlay = isPlaying && !isPausedForOverlay;
        if (shouldPlay && !art.playing) art.play().catch(console.error);
        else if (!shouldPlay && art.playing) art.pause();
    }, [isPlaying, isPausedForOverlay]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            const dragState = dragStateRef.current;
            dragState.isDragging = true;
            document.body.classList.add('pip-dragging');
            container.style.transition = 'none';
            container.style.cursor = 'grabbing';
            dragState.initialX = posRef.current.x;
            dragState.initialY = posRef.current.y;
            dragState.startX = e.clientX;
            dragState.startY = e.clientY;
        };

        const onPointerMove = (e: PointerEvent) => {
            const dragState = dragStateRef.current;
            if (!dragState.isDragging) return;
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            setPosition(dragState.initialX + dx, dragState.initialY + dy);
        };

        const onPointerUp = () => {
            const dragState = dragStateRef.current;
            if (!dragState.isDragging) return;
            dragState.isDragging = false;
            document.body.classList.remove('pip-dragging');
            if(container) {
                container.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
                container.style.cursor = 'grab';
            }
            snapToCorner();
        };

        container.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        
        try {
            const savedPos = sessionStorage.getItem('pip-position');
            if (savedPos) {
                const { x, y } = JSON.parse(savedPos);
                setPosition(x, y);
            } else {
                snapToCorner();
            }
        } catch {}

        return () => {
            container.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.body.classList.remove('pip-dragging');
        };
    }, [setPosition, snapToCorner]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!container.contains(e.target as Node)) return;
            const step = 20;
            let moved = false;
            let { x: newX, y: newY } = posRef.current;

            switch (e.key) {
                case 'ArrowLeft': newX -= step; moved = true; break;
                case 'ArrowRight': newX += step; moved = true; break;
                case 'ArrowUp': newY -= step; moved = true; break;
                case 'ArrowDown': newY += step; moved = true; break;
                case 'Enter': case ' ':
                    if (document.activeElement === container || container.contains(document.activeElement)) {
                        snapToCorner();
                        e.preventDefault();
                    }
                    break;
            }

            if (moved) {
                e.preventDefault();
                const finalPos = setPosition(newX, newY);
                sessionStorage.setItem('pip-position', JSON.stringify(finalPos));
                dispatchEvent('pip:position-changed', finalPos);
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [setPosition, snapToCorner]);

    if (!isVisible || !anime) return null;

    const handleClose = () => {
        hidePlayer();
        dispatchEvent('pip:closed');
    }

    const handleDock = (animeToDock: Anime) => {
        onDock(animeToDock);
        dispatchEvent('pip:closed');
    }

    return (
        <div 
            ref={containerRef}
            className="fixed top-0 left-0 z-[9999] bg-black rounded-xl shadow-2xl shadow-black/50 overflow-hidden cursor-grab touch-action-none animate-subtle-fade-in-up pointer-events-all"
            style={{
                width: '320px',
                height: '180px',
                willChange: 'transform'
            }}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
            tabIndex={0}
            role="dialog"
            aria-label="Picture-in-Picture Player"
        >
            <div className="w-full h-full" ref={artplayerRef}></div>
            <div className="pip-handle" role="button" aria-label="Drag PiP"></div>

            <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${isInteracting ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={() => artplayerInstance.current?.toggle()} className="p-2 text-white floating-player-button">
                    {isPlaying && !isPausedForOverlay ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                </button>
            </div>
            
            <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${isInteracting ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <p className="text-white text-sm font-bold truncate">{getDisplayTitle(anime, settings)}</p>
                <p className="text-xs text-gray-400">S{season} E{episode}</p>
            </div>

            <div className={`absolute top-1 right-1 flex flex-col gap-1 transition-opacity duration-300 ${isInteracting ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={() => handleDock(anime)} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-[rgb(var(--color-primary))] floating-player-button" aria-label="Dock player"><ArrowTopRightOnSquareIcon className="w-4 h-4"/></button>
                <button onClick={handleClose} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600 floating-player-button" aria-label="Close PiP"><CloseIcon className="w-4 h-4"/></button>
            </div>
        </div>
    );
};

export default DraggableFloatingPlayer;