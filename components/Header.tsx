

import React, { useState, useRef, useEffect } from 'react';
import { HamburgerIcon, SearchIcon, BellIcon, UserIcon, CloseIcon, BookmarkIcon, LogoutIcon, UsersIcon, MessageCircleIcon, LevelUpIcon, HeartIcon, RefreshCwIcon, SettingsIcon, FilmIcon, ViewListIcon, NewspaperIcon, VerifiedIcon, SunIcon, MoonIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import type { Notification, Anime, Page, NotificationType } from '../types';
import Logo from './Logo';
import { useProfileData } from '../hooks/useProfileData';
import { useSettings } from '../hooks/useSettings';
import { getDisplayTitle } from '../utils';
import { formatRelativeTime } from '../utils';

interface HeaderProps {
  onMenuClick: () => void;
  onLoginClick: () => void;
  onSearchClick: () => void;
  onShowWatchlist: () => void;
  onShowQueue: () => void;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
  onNotificationClick: (notification: Notification) => void;
  trendingAnime?: Anime[];
  onTrendingAnimeClick?: (query: string) => void;
}

const NavLink: React.FC<{ page: Page; onNavigate: (page: Page) => void; children: React.ReactNode }> = ({ page, onNavigate, children }) => (
    <button onClick={() => onNavigate(page)} className="flex items-center gap-2 font-bold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300">
        <span className="tracking-wide">{children}</span>
    </button>
);

const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
    switch (type) {
        case 'new_episode': return <FilmIcon className="w-5 h-5 text-red-400" />;
        case 'watchlist': return <BookmarkIcon className="w-5 h-5 text-blue-400" />;
        case 'favorites': return <HeartIcon className="w-5 h-5 text-pink-400" />;
        case 'mal_sync': return <RefreshCwIcon className="w-5 h-5 text-teal-400" />;
        case 'system': return <SettingsIcon className="w-5 h-5 text-gray-400" />;
        case 'general': return <BellIcon className="w-5 h-5 text-purple-400" />;
        case 'reply': return <MessageCircleIcon className="w-5 h-5 text-green-400" />;
        case 'share': return <UsersIcon className="w-5 h-5 text-cyan-400" />;
        case 'friend_request': return <UserIcon className="w-5 h-5 text-orange-400" />;
        default: return <BellIcon className="w-5 h-5 text-gray-400" />;
    }
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onLoginClick, onSearchClick, onShowWatchlist, onShowQueue, onNavigate, onGoHome, onNotificationClick, trendingAnime = [], onTrendingAnimeClick = (_) => {} }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const { notifications, markNotificationsAsRead, clearAllNotifications, aniTokens } = useProfileData();
  const { settings, updateSettings } = useSettings();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClickOutside = (event: MouseEvent) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
  };
  
  const handleNotificationToggle = () => setIsNotificationOpen(prev => !prev);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const handleProfileLink = (page: Page) => {
    onNavigate(page);
    setIsProfileOpen(false);
  }
  
  const handleWatchlistLink = () => {
    onShowWatchlist();
    setIsProfileOpen(false);
  }

  const handleQueueLink = () => {
    onShowQueue();
    setIsProfileOpen(false);
  }

  const handleNotificationItemClick = (notification: Notification) => {
    if (notification.animeId) {
        onNotificationClick(notification);
    }
    setIsNotificationOpen(false);
  }

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[rgb(var(--surface-1))/0.9] backdrop-blur-xl border-b border-[rgb(var(--border-color))] shadow-lg transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-20 lg:h-24 transition-all duration-300">
          {/* Left Section */}
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={(e) => { e.currentTarget.blur(); onMenuClick(); }} 
              title="Menu" 
              className="lg:hidden text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors" 
              aria-label="Open menu"
            >
                <HamburgerIcon />
            </button>
            <Logo onClick={onGoHome} />
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 ml-4">
                <NavLink page="watch-together" onNavigate={onNavigate}>Watch2Gether</NavLink>
                <NavLink page="new-episodes" onNavigate={onNavigate}>New Episodes</NavLink>
                <NavLink page="manga" onNavigate={onNavigate}>Manga</NavLink>
                <NavLink page="community" onNavigate={onNavigate}>Community</NavLink>
            </nav>
          </div>
          
          {/* Center Section: Search Bar (Desktop) */}
          <div className="hidden sm:flex flex-1 justify-center px-8 lg:px-16 min-w-0">
             <div
                onClick={onSearchClick}
                className="relative w-full max-w-md lg:max-w-xl group cursor-text transition-all duration-300"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--color-primary-accent))] transition-colors z-10">
                  <SearchIcon className="w-4 h-4" />
                </div>
                <div className="w-full h-10 flex items-center bg-[rgb(var(--surface-2))] border border-[rgb(var(--border-color))] rounded-full pl-10 pr-4 text-[rgb(var(--text-muted))] text-sm lg:text-base group-hover:border-[rgb(var(--border-focus))] transition-all shadow-sm group-hover:shadow-md overflow-hidden">
                    <span className="truncate w-full text-left block">Search anime, characters, users...</span>
                </div>
              </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <button 
              onClick={toggleTheme} 
              title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2.5 rounded-full text-[rgb(var(--text-secondary))] bg-white/5 hover:text-[rgb(var(--color-primary-accent))] hover:bg-white/10 transition-all"
              aria-label="Toggle theme"
            >
              {settings.theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            <button onClick={onSearchClick} title="Search" className="sm:hidden p-2.5 rounded-full text-[rgb(var(--text-secondary))] bg-white/5 hover:text-[rgb(var(--color-primary-accent))] hover:bg-white/10 transition-all" aria-label="Search"><SearchIcon /></button>
            
            {isLoggedIn && user ? (
              <>
                <button onClick={onShowQueue} title="Queue" className="p-2.5 rounded-full text-[rgb(var(--text-secondary))] bg-white/5 hover:text-[rgb(var(--color-primary-accent))] hover:bg-white/10 transition-all" aria-label="View queue">
                    <ViewListIcon />
                </button>
                <div className="relative" ref={notificationRef}>
                  <button onClick={handleNotificationToggle} title="Notifications" className="p-2.5 rounded-full text-[rgb(var(--text-secondary))] bg-white/5 hover:text-[rgb(var(--color-primary-accent))] hover:bg-white/10 transition-all" aria-label="View notifications">
                    <BellIcon />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-[rgb(var(--color-primary))] ring-2 ring-[rgb(var(--surface-1))] animate-throb"></span>}
                  </button>
                  <div className={`origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-lg shadow-[rgb(var(--shadow-color))/0.3] bg-[rgb(var(--surface-2))] border border-white/10 transition-all duration-300 ease-out transform ${isNotificationOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <div className="p-3 flex justify-between items-center font-semibold text-[rgb(var(--text-primary))] border-b border-white/10">
                        <span>Notifications</span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => { onNavigate('notifications'); setIsNotificationOpen(false); }} className="text-xs font-semibold text-[rgb(var(--color-primary-accent))] hover:underline">
                                View All
                            </button>
                            <button onClick={() => { if(window.confirm('Are you sure you want to clear all notifications?')) clearAllNotifications() }} className="text-xs font-semibold text-red-400/80 hover:underline">
                                Clear All
                            </button>
                        </div>
                      </div>
                      <div className="py-1 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.slice(0, 5).map(n => (
                          <button key={n.id} onClick={() => handleNotificationItemClick(n)} className={`block w-full text-left px-4 py-3 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] transition-colors ${!n.read ? 'bg-[rgb(var(--color-primary))/0.1]' : ''}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 pt-0.5"><NotificationIcon type={n.type} /></div>
                                <div className="flex-1">
                                    <p>
                                        {n.relatedUser && <span className="font-bold text-[rgb(var(--color-primary-accent))]">{n.relatedUser.username} </span>}
                                        {n.text}
                                    </p>
                                    <p className="text-xs text-[rgb(var(--text-muted))] mt-1">{formatRelativeTime(n.timestamp)}</p>
                                </div>
                            </div>
                          </button>
                        )) : (
                            <p className="text-center p-8 text-sm text-[rgb(var(--text-muted))]">No notifications to display.</p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="p-2 border-t border-white/10">
                            <button onClick={() => { markNotificationsAsRead(); }} className="w-full text-center text-xs font-semibold text-[rgb(var(--color-primary-accent))] hover:underline p-2 rounded-lg hover:bg-white/5 transition-colors">
                                Mark all as read
                            </button>
                        </div>
                      )}
                  </div>
                </div>

                <div className="relative" ref={profileRef}>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} title={user.username} className="p-1 rounded-full text-[rgb(var(--text-secondary))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-1))] focus:ring-[rgb(var(--color-primary))]">
                    <img loading="lazy" src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary)/0.5)] object-cover ring-2 ring-white/10" />
                  </button>
                  <div className={`origin-top-right absolute right-0 mt-4 w-64 rounded-2xl shadow-lg shadow-[rgb(var(--shadow-color))/0.3] bg-[rgb(var(--surface-2))] border border-white/10 transition-all duration-300 ease-out transform ${isProfileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <div className="p-2 space-y-1" role="menu">
                        <div className="flex flex-col px-3 py-3 text-sm text-[rgb(var(--text-primary))] font-semibold border-b border-white/10 mb-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">{user.username}</span>
                            {user.isVip && <VerifiedIcon className="w-5 h-5 text-yellow-400" title="VIP Member" />}
                          </div>
                          <button onClick={() => handleProfileLink('currency')} className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md hover:bg-yellow-400/20 transition-colors w-fit">
                            💎
                            <span>{aniTokens.toLocaleString()} AniTK</span>
                          </button>
                        </div>
                        <button onClick={() => handleProfileLink('profile')} className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-primary))] rounded-lg transition-colors">
                            <UserIcon className="w-5 h-5"/>
                            <span>Profile & Settings</span>
                        </button>
                        <button onClick={handleWatchlistLink} className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-primary))] rounded-lg transition-colors">
                            <BookmarkIcon className="w-5 h-5"/>
                            <span>Watchlist</span>
                        </button>
                         <button onClick={() => handleProfileLink('comment-meter')} className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-primary))] rounded-lg transition-colors">
                            <LevelUpIcon className="w-5 h-5"/>
                            <span>Level Up</span>
                        </button>
                        <div className="h-px bg-white/10 my-1"></div>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-primary))] rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-400">
                            <LogoutIcon className="w-5 h-5"/>
                            <span>Logout</span>
                        </button>
                      </div>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={onLoginClick} className="px-6 py-2.5 bg-[rgb(var(--color-primary))] rounded-full text-sm font-bold hover:bg-[rgb(var(--color-primary-hover))] text-[rgb(var(--text-on-primary))] transition-all shadow-lg shadow-[rgb(var(--shadow-color))/0.3] hover:scale-105">
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;