import React, { useState, useMemo, useEffect } from 'react';
import { useProfileData } from '../hooks/useProfileData';
import { useSettings } from '../hooks/useSettings';
import type { Anime, Notification, NotificationType, Page } from '../types';
import { formatRelativeTime } from '../utils';
import { BellIcon, BookmarkIcon, ChevronLeftIcon, HeartIcon, RefreshCwIcon, SearchIcon, SettingsIcon } from './icons/Icons';

interface NotificationsPageProps {
  onGoBack: () => void;
  onSelectAnime: (anime: Anime) => void;
}

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch (type) {
        case 'watchlist': return <BookmarkIcon className="w-5 h-5 text-blue-400" />;
        case 'favorites': return <HeartIcon className="w-5 h-5 text-pink-400" />;
        case 'mal_sync': return <RefreshCwIcon className="w-5 h-5 text-teal-400" />;
        case 'system': return <SettingsIcon className="w-5 h-5 text-gray-400" />;
        default: return <BellIcon className="w-5 h-5 text-purple-400" />;
    }
}

const NOTIFICATION_TYPES: NotificationType[] = ['watchlist', 'favorites', 'mal_sync', 'system', 'general', 'reply', 'share', 'friend_request'];

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onGoBack, onSelectAnime }) => {
    const { notifications, markNotificationsAsRead, markSingleNotificationAsRead, clearAllNotifications } = useProfileData();
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const typeMatch = filterType === 'all' || n.type === filterType;
            const statusMatch = filterStatus === 'all' || (filterStatus === 'read' && n.read) || (filterStatus === 'unread' && !n.read);
            const queryMatch = searchQuery === '' || n.text.toLowerCase().includes(searchQuery.toLowerCase()) || n.animeTitle?.toLowerCase().includes(searchQuery.toLowerCase());
            return typeMatch && statusMatch && queryMatch;
        });
    }, [notifications, filterType, filterStatus, searchQuery]);

    const handleItemClick = (notification: Notification) => {
        markSingleNotificationAsRead(notification.id);
        if (notification.animeId) {
            const animeStub: Anime = {
                id: notification.animeId, title: notification.animeTitle || 'Loading...', thumbnail: '', bannerImage: '', synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: false, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, title_english: null, title_japanese: '', themes: [],
                seasons_count: null,
                episodes_count: null,
            };
            onSelectAnime(animeStub);
        }
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6" />
                <span>Back</span>
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">Your Notifications</h1>
                <p className="text-[rgb(var(--text-muted))]">{notifications.length} Total, {unreadCount} Unread</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters */}
                <aside className="lg:col-span-1 space-y-6">
                    <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                        <h3 className="font-bold mb-3">Filters</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-semibold text-[rgb(var(--text-muted))]">Status</label>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full mt-1 bg-[rgb(var(--surface-3))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))]">
                                    <option value="all">All</option>
                                    <option value="unread">Unread</option>
                                    <option value="read">Read</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[rgb(var(--text-muted))]">Type</label>
                                <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full mt-1 bg-[rgb(var(--surface-3))] border border-[rgb(var(--border-color))] rounded-lg px-3 py-2 text-sm text-[rgb(var(--text-primary))]">
                                    <option value="all">All Types</option>
                                    {NOTIFICATION_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <label className="text-sm font-semibold text-[rgb(var(--text-muted))]">Search</label>
                                <SearchIcon className="absolute top-10 left-3 w-4 h-4 text-[rgb(var(--text-muted))]" />
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notifications..." className="w-full mt-1 bg-[rgb(var(--surface-3))] border border-[rgb(var(--border-color))] rounded-lg py-2 pl-9 pr-3 text-sm" />
                            </div>
                        </div>
                    </div>
                     <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-4 rounded-2xl border border-white/10 space-y-2">
                        <button onClick={markNotificationsAsRead} className="w-full px-4 py-2 bg-white/5 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors">Mark All as Read</button>
                        <button onClick={() => { if(window.confirm('Are you sure you want to clear all notifications?')) clearAllNotifications() }} className="w-full px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors">Clear All</button>
                    </div>
                </aside>

                {/* List */}
                <main className="lg:col-span-3">
                    {filteredNotifications.length > 0 ? (
                        <div className="space-y-3">
                            {filteredNotifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                        n.read
                                        ? 'bg-[rgb(var(--surface-2))/0.4] border-transparent hover:bg-[rgb(var(--surface-2))]'
                                        : 'bg-[rgb(var(--color-primary))/0.1] border-[rgb(var(--color-primary))/0.3] hover:bg-[rgb(var(--color-primary))/0.2]'
                                    }`}
                                >
                                    {!n.read && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[rgb(var(--color-primary-accent))]"></div>}
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 pt-1"><NotificationIcon type={n.type} /></div>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-[rgb(var(--text-primary))] transition-opacity ${n.read ? 'opacity-70' : ''}`}>{n.text}</p>
                                            <p className={`text-sm text-[rgb(var(--text-muted))] transition-opacity ${n.read ? 'opacity-60' : ''}`}>{n.animeTitle}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className={`text-xs text-[rgb(var(--text-muted))] transition-opacity ${n.read ? 'opacity-60' : ''}`}>{formatRelativeTime(n.timestamp)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-[rgb(var(--surface-2))/0.5] rounded-2xl">
                            <BellIcon className="w-12 h-12 mx-auto mb-2 text-[rgb(var(--text-muted))]/50" />
                            <p className="font-semibold text-lg text-[rgb(var(--text-primary))]">No notifications found</p>
                            <p className="text-[rgb(var(--text-muted))]">Try adjusting your filters.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default NotificationsPage;