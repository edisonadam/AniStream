import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useProfileData } from '../hooks/useProfileData';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useWatchLater } from '../hooks/useWatchLater';
import { ChevronLeftIcon, MoonIcon, SunIcon } from './icons/Icons';
import { COLOR_PRESETS, VIDEO_SERVERS, VIDSRC_DOMAINS, SUBTITLE_LANGUAGES } from '../constants';
import type { Anime, ContinueWatchingInfo, ViewingHistoryItem, Rating } from '../types';
import AnimeCard from './AnimeCard';

interface ProfilePageProps {
    onGoBack: () => void;
    allAnime: Anime[];
    onSelectAnime: (anime: Anime) => void;
}

type Tab = 'profile' | 'settings';

const ProfilePage: React.FC<ProfilePageProps> = ({ onGoBack, allAnime, onSelectAnime }) => {
    const { user, updateUser, logout } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { history, ratings, getRating, clearHistory } = useProfileData();
    const { continueWatchingList } = useContinueWatching();
    const { watchLaterList } = useWatchLater();

    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editAvatar, setEditAvatar] = useState(user?.avatar || '');

    const animeMap = useMemo(() => {
        return allAnime.reduce((acc, anime) => {
            acc[anime.id] = anime;
            return acc;
        }, {} as Record<number, Anime>);
    }, [allAnime]);

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({ username: editUsername, avatar: editAvatar });
        setIsEditingProfile(false);
    };
    
    const handleClearData = () => {
        if (window.confirm("Are you sure you want to clear all your data? This will clear your history and ratings.")) {
            clearHistory();
            // In a real app, you'd also clear ratings here.
        }
    }

    const ProfileTabContent = () => (
      <div className="space-y-12">
        {/* Profile Header */}
        <div className="text-center">
            {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="max-w-sm mx-auto space-y-4 bg-[rgb(var(--surface-3))] p-6 rounded-xl">
                    <h3 className="text-lg font-bold">Edit Profile</h3>
                    <div>
                        <label className="block text-sm text-left font-medium text-[rgb(var(--text-secondary))] mb-1">Username</label>
                        <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-[rgb(var(--surface-input))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                    </div>
                     <div>
                        <label className="block text-sm text-left font-medium text-[rgb(var(--text-secondary))] mb-1">Avatar URL</label>
                        <input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="w-full bg-[rgb(var(--surface-input))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 bg-[rgb(var(--surface-4))] rounded-lg font-semibold hover:bg-[rgb(var(--surface-3))]">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[rgb(var(--color-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Save</button>
                    </div>
                </form>
            ) : (
                <>
                    <img src={user?.avatar} alt={user?.username} className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-[rgb(var(--color-primary))]/50" />
                    <h2 className="text-3xl font-bold">{user?.username}</h2>
                    <div className="mt-4 flex gap-2 justify-center">
                        <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 bg-[rgb(var(--surface-3))] rounded-lg font-semibold hover:bg-[rgb(var(--surface-4))]">Edit Profile</button>
                        <button onClick={logout} className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-lg font-semibold hover:bg-[rgb(var(--color-danger))]/40">Logout</button>
                    </div>
                </>
            )}
        </div>
        
        <DataSection title="Continue Watching" data={continueWatchingList} renderItem={(item: ContinueWatchingInfo) => animeMap[item.animeId] && <AnimeCard anime={animeMap[item.animeId]} onSelect={onSelectAnime} />} />
        <DataSection title="My Watchlist" data={watchLaterList} renderItem={(item: Anime) => <AnimeCard anime={item} onSelect={onSelectAnime} />} />
        <DataSection title="Viewing History" data={history} renderItem={(item: ViewingHistoryItem) => animeMap[item.animeId] && <AnimeCard anime={animeMap[item.animeId]} onSelect={onSelectAnime} />} />
        <DataSection title="My Ratings" data={ratings} renderItem={(item: Rating) => animeMap[item.animeId] && <AnimeCard anime={animeMap[item.animeId]} onSelect={onSelectAnime} />} />
      </div>
    );
    
    const SettingsTabContent = () => (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Appearance Settings */}
        <div className="bg-[rgb(var(--surface-2))] p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-[rgb(var(--color-primary-accent))]">Appearance</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <label className="font-semibold text-[rgb(var(--text-secondary))]">Theme</label>
                <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                    <button onClick={() => updateSettings({ theme: 'light' })} className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${settings.theme === 'light' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'}`}><SunIcon className="w-4 h-4" /> Light</button>
                    <button onClick={() => updateSettings({ theme: 'dark' })} className={`px-3 py-1 text-sm rounded-full flex items-center gap-2 ${settings.theme === 'dark' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-muted))]'}`}><MoonIcon className="w-4 h-4"/> Dark</button>
                </div>
            </div>
             <div className="space-y-2">
                <label className="font-semibold text-[rgb(var(--text-secondary))]">Color Preset</label>
                <div className="grid grid-cols-2 gap-2">
                    {COLOR_PRESETS.map(preset => (
                        <button key={preset.id} onClick={() => updateSettings({ colorPreset: preset.id })} className={`w-full p-2 rounded-lg text-left font-semibold transition-colors ${settings.colorPreset === preset.id ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] ring-2 ring-offset-2 ring-offset-[rgb(var(--surface-2))] ring-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-3))] hover:bg-[rgb(var(--surface-4))]'}`}>{preset.name}</button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Playback Settings */}
        <div className="bg-[rgb(var(--surface-2))] p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-[rgb(var(--color-primary-accent))]">Playback</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center">
                <label className="font-semibold text-[rgb(var(--text-secondary))]">Autoplay Next Episode</label>
                <button onClick={() => updateSettings({ autoplay: !settings.autoplay })} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.autoplay ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.autoplay ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[rgb(var(--border-color))]/50">
               <label className="font-semibold text-[rgb(var(--text-secondary))]">Prefer Dubbed Audio</label>
               <button onClick={() => updateSettings({ preferDub: !settings.preferDub })} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.preferDub ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`}>
                   <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.preferDub ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
           </div>
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-[rgb(var(--border-color))]/50">
                <label className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">Video Server</label>
                <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                    {VIDEO_SERVERS.map(server => (
                        <button key={server.id} onClick={() => updateSettings({ videoServer: server.id })} className={`px-4 py-1.5 text-sm rounded-full transition-all ${settings.videoServer === server.id ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{server.name}</button>
                    ))}
                </div>
            </div>
            {settings.videoServer === 'vidsrc' && (
                <>
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-[rgb(var(--border-color))]/50">
                    <label htmlFor="vidsrc-domain-select" className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">Vidsrc Domain</label>
                    <select
                        id="vidsrc-domain-select"
                        value={settings.vidsrcDomain}
                        onChange={(e) => updateSettings({ vidsrcDomain: e.target.value })}
                        className="w-full sm:w-auto bg-[rgb(var(--surface-input))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
                    >
                        {VIDSRC_DOMAINS.map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-[rgb(var(--border-color))]/50">
                    <label htmlFor="subtitle-lang-select" className="font-semibold text-[rgb(var(--text-secondary))] mb-2 sm:mb-0">Default Subtitle Language</label>
                    <select
                        id="subtitle-lang-select"
                        value={settings.subtitleLanguage}
                        onChange={(e) => updateSettings({ subtitleLanguage: e.target.value })}
                        className="w-full sm:w-auto bg-[rgb(var(--surface-input))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
                    >
                        {SUBTITLE_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
                </>
            )}
          </div>
        </div>
        
        {/* Data Management */}
         <div className="bg-[rgb(var(--surface-2))] p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-4 text-[rgb(var(--color-danger))]">Data Management</h3>
            <div className="space-y-2">
                <p className="text-sm text-[rgb(var(--text-muted))]">This will permanently delete your viewing history and ratings.</p>
                <button onClick={handleClearData} className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-lg font-semibold hover:bg-[rgb(var(--color-danger))]/40">Clear My Data</button>
            </div>
         </div>
      </div>
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Browse</span>
            </button>
            
            <div className="flex justify-center border-b border-[rgb(var(--border-color))] mb-8">
                <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'profile' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Profile</button>
                <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'settings' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Settings</button>
            </div>

            {activeTab === 'profile' ? <ProfileTabContent /> : <SettingsTabContent />}
        </div>
    );
};

interface DataSectionProps<T> {
    title: string;
    data: T[];
    renderItem: (item: T) => React.ReactNode;
}

const DataSection = <T extends { animeId: number } | { id: number }>({ title, data, renderItem }: DataSectionProps<T>) => {
    if (data.length === 0) return null;
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {data.slice(0, 6).map((item, index) => (
                    <div key={('animeId' in item ? item.animeId : item.id) + '-' + index}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
            {data.length === 0 && <p className="text-[rgb(var(--text-muted))]">Nothing here yet!</p>}
        </div>
    );
};

export default ProfilePage;