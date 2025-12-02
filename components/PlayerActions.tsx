
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, WatchlistStatus, VideoServer, Settings, DefaultLanguage } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';
import { updateMalEntry } from '../api';
import { VIDEO_SERVERS, WATCHLIST_STATUSES } from '../constants';
import { HeartIcon, HeartIconSolid, CheckIcon, ChevronDownIcon, ScissorsIcon, FlagIcon, BellIcon, SparklesIcon, MessageCircleIcon, BookmarkIcon, CloseIcon, LightbulbIcon, LightbulbOffIcon, ViewListIcon, HistoryIcon } from './icons/Icons';
import { useNotificationPrefs } from '../hooks/useNotificationPrefs';
import { useQueue } from '../hooks/useQueue';

interface PlayerActionsProps {
  anime: Anime;
  onClip: () => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  onSurprise: () => void;
  onManualServerChange: (server: VideoServer) => void;
  selectedLanguage: DefaultLanguage;
  onLanguageChange: (lang: DefaultLanguage) => void;
  isLoggedIn: boolean;
  onLoginRequest: (reason: string) => void;
  onAddTimestamp: () => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: (e: React.MouseEvent) => void, buttonRef?: React.Ref<HTMLButtonElement>, isActive?: boolean, isDanger?: boolean }> = ({ icon, label, onClick, buttonRef, isActive, isDanger }) => (
    <button
        ref={buttonRef}
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`p-3 rounded-full transition-colors ${isActive ? 'bg-[rgb(var(--color-primary))] text-white' : isDanger ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
    >
        {icon}
    </button>
);

const Toggle: React.FC<{ label: string, icon?: React.ReactNode, checked: boolean, onChange: () => void }> = ({ label, icon, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer font-semibold text-[rgb(var(--text-secondary))]">
        {icon}
        <span>{label}</span>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))] focus:ring-2 focus:ring-offset-0 focus:ring-offset-[rgb(var(--surface-3))] focus:ring-[rgb(var(--color-primary))]"
        />
    </label>
);

const PlayerActions: React.FC<PlayerActionsProps> = ({ anime, onClip, settings, updateSettings, onSurprise, onManualServerChange, selectedLanguage, onLanguageChange, isLoggedIn, onLoginRequest, onAddTimestamp }) => {
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { addToWatchlist, removeFromWatchlist, updateWatchlistStatus, isInWatchlist, getWatchlistStatus } = useWatchlist();
    const { addToast } = useToast();
    const { getPrefsForAnime, updatePref } = useNotificationPrefs();
    const { addToQueue, removeFromQueue, isInQueue } = useQueue();

    const [isNotifyMenuOpen, setIsNotifyMenuOpen] = useState(false);
    const [isWatchlistMenuOpen, setIsWatchlistMenuOpen] = useState(false);
    
    const notifyButtonRef = useRef<HTMLButtonElement>(null);
    const watchlistButtonRef = useRef<HTMLButtonElement>(null);

    const notificationPrefs = getPrefsForAnime(anime.id);
    const isFavorited = isFavorite(anime.id);
    const inWatchlist = isInWatchlist(anime.id);
    const currentStatus = getWatchlistStatus(anime.id);
    const inQueue = isInQueue(anime.id);

    const availableServers = useMemo(() => {
        return VIDEO_SERVERS.filter(s => s.type === selectedLanguage);
    }, [selectedLanguage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (isNotifyMenuOpen && notifyButtonRef.current && !notifyButtonRef.current.contains(target)) setIsNotifyMenuOpen(false);
            if (isWatchlistMenuOpen && watchlistButtonRef.current && !watchlistButtonRef.current.contains(target)) setIsWatchlistMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotifyMenuOpen, isWatchlistMenuOpen]);

    const handleAuthenticatedAction = (action: () => void, reason: string) => {
        if (!isLoggedIn) {
            onLoginRequest(reason);
        } else {
            action();
        }
    };

    const handleFavoriteToggle = () => handleAuthenticatedAction(() => isFavorited ? removeFavorite(anime.id, anime.title) : addFavorite(anime.id, anime.title), "Please log in to manage your favorites.");
    
    const handleWatchlistAction = (status: WatchlistStatus) => handleAuthenticatedAction(() => {
        if (inWatchlist) {
            updateWatchlistStatus(anime.id, status, anime.title);
        } else {
            addToWatchlist(anime, status);
        }
        setIsWatchlistMenuOpen(false);
    }, "Please log in to manage your watchlist.");

    const handleRemoveFromWatchlist = () => handleAuthenticatedAction(() => {
        removeFromWatchlist(anime.id, anime.title);
        setIsWatchlistMenuOpen(false);
    }, "Please log in to manage your watchlist.");
    
    const handleQueueToggle = () => handleAuthenticatedAction(() => {
        inQueue ? removeFromQueue(anime.id) : addToQueue(anime);
    }, "Please log in to manage your queue.");

    const handleNotificationToggle = (key: keyof typeof notificationPrefs) => {
        const newValue = !notificationPrefs[key];
        updatePref(anime.id, { [key]: newValue });
        addToast(`Notifications for ${key === 'newEpisode' ? 'New Episodes' : 'New Dubs'} ${newValue ? 'enabled' : 'disabled'}`, 'info');
    };

    const handleReport = () => { addToast("Thank you for your report. A moderator will review it shortly.", 'info'); };
    const scrollToComments = () => { document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' }); };

    const NotifyDropdownMenu = (
        <div className="absolute top-full right-0 mt-2 bg-[rgb(var(--surface-2))] border border-white/10 rounded-xl shadow-lg p-2 z-[70] w-48 animate-subtle-fade-in-up space-y-1">
            <label className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md cursor-pointer">
                <input type="checkbox" checked={notificationPrefs.newEpisode} onChange={() => handleNotificationToggle('newEpisode')} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" /> New Episodes
            </label>
            <label className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md cursor-pointer">
                <input type="checkbox" checked={notificationPrefs.newDub} onChange={() => handleNotificationToggle('newDub')} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" /> New Dubs
            </label>
        </div>
    );
    
    const WatchlistDropdownMenu = (
        <div className="absolute top-full right-0 mt-2 bg-[rgb(var(--surface-2))] border border-white/10 rounded-xl shadow-lg p-2 z-[70] w-56 animate-subtle-fade-in-up space-y-1">
            {WATCHLIST_STATUSES.map(status => (
                <button key={status} onClick={() => handleWatchlistAction(status)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] rounded-md">
                   {currentStatus === status ? <CheckIcon className="w-4 h-4 text-[rgb(var(--color-primary-accent))]"/> : <span className="w-4 h-4"></span>}
                   <span>{status}</span>
                </button>
            ))}
            {inWatchlist && (
                <>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button onClick={handleRemoveFromWatchlist} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/20 rounded-md">
                        <CloseIcon className="w-4 h-4"/>
                        <span>Remove from List</span>
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 rounded-2xl space-y-4 mt-4">
            
            <div className="relative w-full max-w-xs mx-auto">
                <button ref={watchlistButtonRef} onClick={() => handleAuthenticatedAction(() => setIsWatchlistMenuOpen(p => !p), "Log in to manage your watchlist")} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.4]">
                    <span>{currentStatus || 'Add to Watchlist'}</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isWatchlistMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isWatchlistMenuOpen && WatchlistDropdownMenu}
            </div>
            
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                <ActionButton icon={isFavorited ? <HeartIconSolid className="text-red-400" /> : <HeartIcon />} label={isFavorited ? "Unfavorite" : "Favorite"} onClick={handleFavoriteToggle} />
                <div className="relative">
                    <ActionButton buttonRef={notifyButtonRef} icon={<BellIcon />} label="Notify" onClick={() => handleAuthenticatedAction(() => setIsNotifyMenuOpen(p => !p), "Log in to manage notifications")} />
                    {isNotifyMenuOpen && NotifyDropdownMenu}
                </div>
                <ActionButton icon={<HistoryIcon />} label="Add Timestamp" onClick={onAddTimestamp} />
                <ActionButton icon={<ScissorsIcon />} label="Clip" onClick={onClip} />
                <ActionButton icon={<MessageCircleIcon />} label="Comments" onClick={scrollToComments} />
                <ActionButton icon={<SparklesIcon />} label="Surprise Me!" onClick={onSurprise} />
                <ActionButton icon={<FlagIcon />} label="Report" onClick={handleReport} isDanger />
            </div>

            <button onClick={handleQueueToggle} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--surface-4))] text-[rgb(var(--text-secondary))] rounded-xl font-bold hover:bg-[rgb(var(--surface-3))]">
                <ViewListIcon className="w-6 h-6"/> {inQueue ? 'In Queue' : 'Add to Queue'}
            </button>
            
            <div className="pt-3 border-t border-white/10 space-y-4">
                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[rgb(var(--text-secondary))]">Type:</span>
                         <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                            <button onClick={() => onLanguageChange('sub')} className={`px-3 py-1 text-xs rounded-full ${selectedLanguage === 'sub' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}>SUB</button>
                            <button onClick={() => onLanguageChange('dub')} className={`px-3 py-1 text-xs rounded-full ${selectedLanguage === 'dub' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}>DUB</button>
                            <button onClick={() => onLanguageChange('ssub')} className={`px-3 py-1 text-xs rounded-full ${selectedLanguage === 'ssub' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}>S-SUB</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[rgb(var(--text-secondary))]">Server:</span>
                        <select value={settings.videoServer} onChange={e => onManualServerChange(e.target.value as VideoServer)} className="bg-[rgb(var(--surface-input))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-1.5 text-xs text-[rgb(var(--text-primary))]">
                            {availableServers.map(server => (<option key={server.id} value={server.id}>{server.name}</option>))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm">
                     <ActionButton
                        icon={settings.lightsOffMode ? <LightbulbOffIcon /> : <LightbulbIcon />}
                        label="Lights Off"
                        onClick={() => updateSettings({ lightsOffMode: !settings.lightsOffMode })}
                        isActive={settings.lightsOffMode}
                    />
                    <Toggle label="Auto Skip" checked={settings.autoSkip} onChange={() => updateSettings({ autoSkip: !settings.autoSkip })} />
                    <Toggle label="Auto Next" checked={settings.autoPlay} onChange={() => updateSettings({ autoPlay: !settings.autoPlay })} />
                </div>
            </div>
        </div>
    );
};

export default PlayerActions;
