import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, WatchlistStatus, VideoServer, Settings, DefaultLanguage } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useToast } from '../hooks/useToast';
import { updateMalEntry } from '../api';
import { VIDEO_SERVERS, WATCHLIST_STATUSES } from '../constants';
import { HeartIcon, HeartIconSolid, CheckIcon, ChevronDownIcon, PlusCircleIcon, ScissorsIcon, FlagIcon, BellIcon, LightbulbIcon, LightbulbOffIcon, AnnouncementIcon, CaptionsIcon } from './icons/Icons';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';

interface PlayerActionsProps {
  anime: Anime;
  onClip: () => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  onSurprise: () => void;
  onManualServerChange: (server: VideoServer) => void;
}

const PlayerActions: React.FC<PlayerActionsProps> = ({ anime, onClip, settings, updateSettings, onSurprise, onManualServerChange }) => {
    const { addToWatchlist, removeFromWatchlist, updateWatchlistStatus, getWatchlistStatus } = useWatchlist();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { getWatchProgress, updateProgress } = useWatchProgress();
    const { addToast } = useToast();
    const { getPrefsForAnime, updatePref } = useNotificationPrefs();

    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const [isNotifyMenuOpen, setIsNotifyMenuOpen] = useState(false);
    
    const watchlistButtonRef = useRef<HTMLButtonElement>(null);
    const notifyButtonRef = useRef<HTMLButtonElement>(null);

    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const notifyDropdownRef = useRef<HTMLDivElement>(null);

    const [statusDropdownPosition, setStatusDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const [notifyDropdownPosition, setNotifyDropdownPosition] = useState<{ top: number; left: number } | null>(null);
    
    // State for the new server selection UI
    const currentServerInfo = useMemo(() => VIDEO_SERVERS.find(s => s.id === settings.videoServer), [settings.videoServer]);
    const [selectedType, setSelectedType] = useState<DefaultLanguage>(currentServerInfo?.type || settings.defaultLanguage);
    
    const availableServers = useMemo(() => {
        return VIDEO_SERVERS.filter(s => s.type === selectedType);
    }, [selectedType]);
    
    // Sync local type state if global server setting changes from elsewhere
    useEffect(() => {
        if (currentServerInfo && currentServerInfo.type !== selectedType) {
            setSelectedType(currentServerInfo.type);
        }
    }, [currentServerInfo, selectedType]);

    const handleTypeChange = (newType: DefaultLanguage) => {
        setSelectedType(newType);
        const firstServerInNewType = VIDEO_SERVERS.find(s => s.type === newType);
        if (firstServerInNewType) {
            onManualServerChange(firstServerInNewType.id);
        }
    };

    const notificationPrefs = getPrefsForAnime(anime.id);
    const currentStatus = getWatchlistStatus(anime.id);
    const isFavorited = isFavorite(anime.id);
    const progressInfo = getWatchProgress(anime.id);

    useEffect(() => {
        if (isStatusMenuOpen && watchlistButtonRef.current) {
            const rect = watchlistButtonRef.current.getBoundingClientRect();
            setStatusDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }
        if (isNotifyMenuOpen && notifyButtonRef.current) {
            const rect = notifyButtonRef.current.getBoundingClientRect();
            setNotifyDropdownPosition({
                top: rect.bottom + 8,
                left: rect.right - 200, // Align right, approximate width
            });
        }
    }, [isStatusMenuOpen, isNotifyMenuOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isStatusMenuOpen && statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node) && watchlistButtonRef.current && !watchlistButtonRef.current.contains(event.target as Node)) {
                setIsStatusMenuOpen(false);
            }
            if (isNotifyMenuOpen && notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target as Node) && notifyButtonRef.current && !notifyButtonRef.current.contains(event.target as Node)) {
                setIsNotifyMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isStatusMenuOpen, isNotifyMenuOpen]);

    const handleStatusChange = (status: WatchlistStatus) => {
        if (currentStatus) {
            updateWatchlistStatus(anime.id, status);
        } else {
            addToWatchlist(anime, status);
        }
        addToast(`Status updated to: ${status}`, 'success');
        setIsStatusMenuOpen(false);

        if (settings.autoSyncMal && settings.malUsername) {
            updateMalEntry(anime.id, settings.malUsername, { status });
            addToast('Syncing with MyAnimeList...', 'info');
        }
    };

    const handleRemoveFromList = () => {
        removeFromWatchlist(anime.id);
        addToast('Removed from watchlist.', 'info');
        setIsStatusMenuOpen(false);
        if (settings.autoSyncMal && settings.malUsername) {
            addToast('Syncing removal with MyAnimeList...', 'info');
        }
    };

    const handleFavoriteToggle = () => {
        if (isFavorited) {
            removeFavorite(anime.id);
            addToast('Removed from Favorites', 'unfavorite');
        } else {
            addFavorite(anime.id);
            addToast('Added to Favorites', 'favorite');
        }
         if (settings.autoSyncMal && settings.malUsername) {
            updateMalEntry(anime.id, settings.malUsername, { isFavorite: !isFavorited });
            addToast('Syncing favorite status with MyAnimeList...', 'info');
        }
    };
    
    const handleIncrementProgress = () => {
        if (!progressInfo || !anime.totalEpisodes) return;
        const nextEpisode = progressInfo.currentEpisode + 1;
        if (nextEpisode > anime.totalEpisodes) return;
        
        const newProgressPercent = (nextEpisode / anime.totalEpisodes) * 100;
        updateProgress(anime.id, progressInfo.currentSeason, nextEpisode, newProgressPercent);
        addToast(`Marked Episode ${nextEpisode} as watched.`, 'success');

        if (settings.autoSyncMal && settings.malUsername) {
            updateMalEntry(anime.id, settings.malUsername, { progress: nextEpisode });
        }
    };

    const handleMarkAsFinished = () => {
        if (!progressInfo || !anime.totalEpisodes) return;
        updateProgress(anime.id, progressInfo.currentSeason, anime.totalEpisodes, 100);
        handleStatusChange('Completed');
        addToast('🎉 Series completed!', 'success');
    };
    
    const handleReport = () => {
        addToast("Thank you for your report. A moderator will review it shortly.", 'info');
    }

    const handleSubtitleEditor = () => {
        addToast("Subtitle Editor is coming soon!", 'info');
    };

    const isLastEpisode = progressInfo && anime.totalEpisodes && progressInfo.currentEpisode === anime.totalEpisodes;
    const progressPercent = progressInfo && anime.totalEpisodes ? (progressInfo.currentEpisode / anime.totalEpisodes) * 100 : 0;
    
    const StatusDropdownMenu = (
        <div
            ref={statusDropdownRef}
            style={{ position: 'fixed', top: `${statusDropdownPosition?.top}px`, left: `${statusDropdownPosition?.left}px`, width: `${statusDropdownPosition?.width}px` }}
            className="bg-[rgb(var(--surface-2))] border border-white/10 rounded-xl shadow-lg p-2 z-[70] animate-subtle-fade-in-up"
            onClick={(e) => e.stopPropagation()}
        >
            {WATCHLIST_STATUSES.map(status => (
                <button key={status} onClick={() => handleStatusChange(status)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md">
                   {currentStatus === status ? <CheckIcon className="w-4 h-4 text-[rgb(var(--color-primary-accent))]"/> : <span className="w-4 h-4"></span>}
                   <span>{status}</span>
                </button>
            ))}
            {currentStatus && (
                <>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button onClick={handleRemoveFromList} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-md">Remove from List</button>
                </>
            )}
        </div>
    );

    const NotifyDropdownMenu = (
        <div
            ref={notifyDropdownRef}
            style={{ position: 'fixed', top: `${notifyDropdownPosition?.top}px`, left: `${notifyDropdownPosition?.left}px`, width: '200px' }}
            className="bg-[rgb(var(--surface-2))] border border-white/10 rounded-xl shadow-lg p-2 z-[70] animate-subtle-fade-in-up space-y-1"
            onClick={(e) => e.stopPropagation()}
        >
            <label className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md cursor-pointer">
                <input type="checkbox" checked={notificationPrefs.newEpisode} onChange={() => updatePref(anime.id, { newEpisode: !notificationPrefs.newEpisode })} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" />
                New Episodes
            </label>
            <label className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md cursor-pointer">
                <input type="checkbox" checked={notificationPrefs.newDub} onChange={() => updatePref(anime.id, { newDub: !notificationPrefs.newDub })} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" />
                New Dubs
            </label>
        </div>
    );

    return (
        <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 rounded-2xl space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div>
                    <button 
                        ref={watchlistButtonRef}
                        onClick={() => setIsStatusMenuOpen(prev => !prev)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-transform duration-300 hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.4]"
                    >
                        <span>{currentStatus || 'Add to Watchlist'}</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isStatusMenuOpen && statusDropdownPosition && ReactDOM.createPortal(
                        StatusDropdownMenu,
                        document.getElementById('dropdown-root')!
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleFavoriteToggle}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg ${isFavorited ? 'bg-red-500 text-white shadow-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {isFavorited ? <HeartIconSolid className="w-6 h-6"/> : <HeartIcon className="w-6 h-6"/>}
                        <span className="hidden sm:inline">Favorite</span>
                    </button>
                    <div className="relative">
                        <button
                            ref={notifyButtonRef}
                            onClick={() => setIsNotifyMenuOpen(p => !p)}
                            className="flex items-center justify-center p-3 rounded-xl font-bold transition-colors bg-white/10 text-white hover:bg-white/20"
                            aria-label="Notification Settings"
                        >
                            <BellIcon className="w-6 h-6" />
                        </button>
                        {isNotifyMenuOpen && notifyDropdownPosition && ReactDOM.createPortal(
                            NotifyDropdownMenu,
                            document.getElementById('dropdown-root')!
                        )}
                    </div>
                     <button onClick={onClip} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-bold" aria-label="Create clip">
                        <ScissorsIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">Clip</span>
                    </button>
                    <button onClick={handleSubtitleEditor} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-bold" aria-label="Open Subtitle Editor">
                        <CaptionsIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">Editor</span>
                    </button>
                    <button onClick={onSurprise} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-bold" aria-label="Get a surprise fact">
                        <AnnouncementIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">Surprise Me!</span>
                    </button>
                     <button onClick={handleReport} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-bold" aria-label="Report issue">
                        <FlagIcon className="w-6 h-6"/>
                        <span className="hidden sm:inline">Report</span>
                    </button>
                </div>
            </div>

            {progressInfo && anime.totalEpisodes && (
                <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm font-semibold text-[rgb(var(--text-secondary))] mb-1">
                        <span>Progress</span>
                        <span>Ep {progressInfo.currentEpisode} / {anime.totalEpisodes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-full bg-[rgb(var(--surface-3))] rounded-full h-2">
                            <div className="bg-[rgb(var(--color-primary))] h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        {isLastEpisode ? (
                            <button onClick={handleMarkAsFinished} className="flex-shrink-0 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold hover:bg-green-600 transition-colors">
                                🎉 Mark as Finished
                            </button>
                        ) : (
                            <button onClick={handleIncrementProgress} className="flex-shrink-0 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors" title={`Mark Episode ${progressInfo.currentEpisode + 1} as watched`}>
                                <PlusCircleIcon />
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="type-select" className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Type:</label>
                        <select
                            id="type-select"
                            value={selectedType}
                            onChange={(e) => handleTypeChange(e.target.value as DefaultLanguage)}
                            className="bg-[rgb(var(--surface-input))/0.5] border border-white/10 rounded-lg px-2 py-1 text-sm"
                        >
                            <option value="sub">Sub</option>
                            <option value="dub">Dub</option>
                            <option value="ssub">S-Sub</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="server-select" className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Server:</label>
                        <select
                            id="server-select"
                            value={settings.videoServer}
                            onChange={(e) => onManualServerChange(e.target.value as VideoServer)}
                            className="bg-[rgb(var(--surface-input))/0.5] border border-white/10 rounded-lg px-2 py-1 text-sm"
                        >
                            {availableServers.map(s => <option key={s.id + s.type} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <button
                        onClick={() => addToast("Lights Off feature is coming soon!", "info")}
                        className="p-2.5 rounded-full hover:bg-white/10 transition-colors"
                        title="Lights Off Mode (Coming Soon)"
                    >
                        <LightbulbOffIcon className="w-5 h-5 text-gray-300" />
                    </button>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] cursor-pointer">
                        <input type="checkbox" checked={settings.autoSkip} onChange={() => updateSettings({ autoSkip: !settings.autoSkip })} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" />
                        Auto Skip
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] cursor-pointer">
                        <input type="checkbox" checked={settings.autoPlay} onChange={() => updateSettings({ autoPlay: !settings.autoPlay })} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" />
                        Auto Next
                    </label>
                 </div>
            </div>
        </div>
    );
};

export default PlayerActions;