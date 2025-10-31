import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useProfileData } from '../hooks/useProfileData';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useWatchlist } from '../hooks/useWatchlist';
import { ChevronLeftIcon, CloseIcon } from './icons/Icons';
import type { Anime, WatchProgressInfo, Rating, User } from '../types';
import AnimeCard from './AnimeCard';
import SettingsPage from './SettingsPage'; // Import the new settings page component

interface ProfilePageProps {
    onGoBack: () => void;
    allAnime: Anime[];
    onSelectAnime: (anime: Anime) => void;
}

type Tab = 'profile-settings' | 'friends';

const ProfilePage: React.FC<ProfilePageProps> = ({ onGoBack, allAnime, onSelectAnime }) => {
    const { user, updateUser, logout } = useAuth();
    const { ratings, friends, removeFriend } = useProfileData();
    const { watchProgressList } = useWatchProgress();
    const { watchlist } = useWatchlist();

    const [activeTab, setActiveTab] = useState<Tab>('profile-settings');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
    
    const animeMap = useMemo(() => {
        const map = new Map<number, Anime>();
        allAnime.forEach(anime => map.set(anime.id, anime));
        // Add anime from lists that might not be in the initial `allAnime` prop
        watchProgressList.forEach(item => { if (!map.has(item.animeId)) map.set(item.animeId, { id: item.animeId, title: 'Loading...' } as Anime); });
        watchlist.forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
        return map;
    }, [allAnime, watchProgressList, watchlist]);

    const userStats = useMemo(() => {
        const totalAnime = watchProgressList.length;
        
        // A more accurate calculation would need total episodes per anime, but this is a good estimation.
        const totalMinutesWatched = watchProgressList.reduce((acc, progress) => {
            const anime = animeMap.get(progress.animeId);
            const avgDuration = anime?.avgEpisodeDuration || 24;
            const episodeCount = (progress.progress / 100) * (anime?.totalEpisodes || 1);
            return acc + (episodeCount * avgDuration);
        }, 0);

        const daysWatched = totalMinutesWatched / 60 / 24;

        const averageScore = ratings.length > 0
            ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
            : 0;

        return {
            totalAnime,
            daysWatched: daysWatched.toFixed(1),
            averageScore: averageScore.toFixed(2),
        };
    }, [watchProgressList, ratings, animeMap]);


    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({ username: editUsername, avatar: editAvatar });
        setIsEditingProfile(false);
    };

    const continueWatchingList = useMemo(() => {
        return watchProgressList.filter(item => item.progress > 0 && item.progress < 100);
    }, [watchProgressList]);

    const ProfileTabContent = () => (
      <div className="space-y-12">
        {/* Profile Header */}
        <div className="text-center">
            {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="max-w-sm mx-auto space-y-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-bold">Edit Profile</h3>
                    <div>
                        <label className="block text-sm text-left font-medium text-[rgb(var(--text-secondary))] mb-1">Username</label>
                        <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                    </div>
                     <div>
                        <label className="block text-sm text-left font-medium text-[rgb(var(--text-secondary))] mb-1">Avatar URL</label>
                        <input type="text" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 bg-white/10 rounded-full font-semibold hover:bg-white/20">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[rgb(var(--color-primary))] rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Save</button>
                    </div>
                </form>
            ) : (
                <>
                    <img src={user?.avatar} alt={user?.username} className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-[rgb(var(--color-primary))]/50" />
                    <h2 className="text-3xl font-bold">{user?.username}</h2>
                    <p className="text-sm text-[rgb(var(--text-muted))]">Joined: {new Date(user?.joinedDate || Date.now()).toLocaleDateString()}</p>
                    <div className="mt-6 flex justify-center gap-4 text-center">
                        <div><p className="text-2xl font-bold">{userStats.totalAnime}</p><p className="text-xs text-[rgb(var(--text-muted))]">Total Anime</p></div>
                        <div><p className="text-2xl font-bold">{userStats.daysWatched}</p><p className="text-xs text-[rgb(var(--text-muted))]">Days Watched</p></div>
                        <div><p className="text-2xl font-bold">{userStats.averageScore}</p><p className="text-xs text-[rgb(var(--text-muted))]">Mean Score</p></div>
                    </div>
                    <div className="mt-6 flex gap-2 justify-center">
                        <button onClick={() => setIsEditingProfile(true)} className="px-4 py-2 bg-white/10 rounded-full font-semibold hover:bg-white/20">Edit Profile</button>
                        <button onClick={logout} className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-full font-semibold hover:bg-[rgb(var(--color-danger))]/40">Logout</button>
                    </div>
                </>
            )}
        </div>
        
        <DataSection title="Continue Watching" data={continueWatchingList} renderItem={(item: WatchProgressInfo) => animeMap.get(item.animeId) && <AnimeCard anime={animeMap.get(item.animeId)!} onSelect={onSelectAnime} />} />
        <DataSection title="My Watchlist" data={watchlist} renderItem={(item: Anime) => <AnimeCard anime={item} onSelect={onSelectAnime} />} />
        <DataSection title="Viewing History" data={watchProgressList} renderItem={(item: WatchProgressInfo) => animeMap.get(item.animeId) && <AnimeCard anime={animeMap.get(item.animeId)!} onSelect={onSelectAnime} />} />
        <DataSection title="My Ratings" data={ratings} renderItem={(item: Rating) => animeMap.get(item.animeId) && <AnimeCard anime={animeMap.get(item.animeId)!} onSelect={onSelectAnime} />} />
      </div>
    );
    
    const FriendsTabContent = () => (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">My Friends ({friends.length})</h2>
            {friends.length > 0 ? (
                <div className="space-y-3">
                    {friends.map(friend => (
                        <div key={friend.username} className="flex items-center justify-between bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-3 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <img src={friend.avatar} alt={friend.username} className="w-12 h-12 rounded-full" />
                                <span className="font-bold text-[rgb(var(--text-primary))]">{friend.username}</span>
                            </div>
                            <button onClick={() => removeFriend(friend.username)} className="p-2 rounded-full bg-white/10 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--color-danger))]/80 hover:text-white transition-colors">
                                <CloseIcon/>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl rounded-2xl border border-white/10">
                    <p className="text-lg text-[rgb(var(--text-muted))]">You haven't added any friends yet.</p>
                    <p className="text-sm text-[rgb(var(--text-muted))] mt-2">You can add friends from the comments section on any anime!</p>
                </div>
            )}
        </div>
    );
    
    const renderActiveTab = () => {
        switch(activeTab) {
            case 'profile-settings': return (
                <>
                    <ProfileTabContent />
                    <div className="my-12 border-t border-white/10"></div>
                    <SettingsPage />
                </>
            );
            case 'friends': return <FriendsTabContent />;
            default: return (
                <>
                    <ProfileTabContent />
                    <div className="my-12 border-t border-white/10"></div>
                    <SettingsPage />
                </>
            );
        }
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Browse</span>
            </button>
            
            <div className="flex justify-center border-b border-white/10 mb-8">
                <button onClick={() => setActiveTab('profile-settings')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'profile-settings' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>{`Profile & Settings`}</button>
                <button onClick={() => setActiveTab('friends')} className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'friends' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>{`Friends`}</button>
            </div>

            {renderActiveTab()}
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
