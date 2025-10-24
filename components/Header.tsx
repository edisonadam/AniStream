import React, { useState, useRef, useEffect } from 'react';
import { HamburgerIcon, SearchIcon, BellIcon, UserIcon, CloseIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import type { Notification } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onLoginClick: () => void;
  onSearchClick: () => void;
  onShowWatchLater: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onLoginClick, onSearchClick, onShowWatchLater, onLogoClick }) => {
  const { isLoggedIn, user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock notifications
    const mockNotifs: Notification[] = [
      { id: '1', text: 'New Episode of Void Scrambler is out!', timestamp: Date.now() - 3600000, read: false },
      { id: '2', text: 'Chronicles of Valoria was added to your Watch Later list.', timestamp: Date.now() - 86400000, read: false },
      { id: '3', text: 'Welcome to AniStream!', timestamp: Date.now() - 172800000, read: true },
    ];
    setNotifications(mockNotifs);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClickOutside = (event: MouseEvent) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-purple-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <button onClick={onMenuClick} className="text-gray-300 hover:text-purple-400 transition-colors" aria-label="Open menu"><HamburgerIcon /></button>
            <button onClick={onLogoClick} className="text-2xl font-bold tracking-wider text-white uppercase" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.8)' }}>AniStream</button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
            <button onClick={onSearchClick} className="p-2 rounded-full text-gray-300 hover:text-purple-400 hover:bg-slate-800 transition-all" aria-label="Search"><SearchIcon /></button>
            
            {isLoggedIn && user ? (
              <>
                <div className="relative" ref={notificationRef}>
                  <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2 rounded-full text-gray-300 hover:text-purple-400 hover:bg-slate-800 transition-all" aria-label="View notifications">
                    <BellIcon />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-purple-500 ring-2 ring-slate-900"></span>}
                  </button>
                  {isNotificationOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-72 sm:w-80 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5">
                      <div className="p-2 font-semibold text-white border-b border-slate-700">Notifications</div>
                      <div className="py-1 max-h-80 overflow-y-auto">
                        {notifications.map(n => (
                          <a key={n.id} href="#" className={`block px-4 py-3 text-sm text-gray-300 hover:bg-slate-700 ${!n.read ? 'font-bold' : ''}`}>
                            {n.text}
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleDateString()}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileRef}>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-1 rounded-full text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500">
                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full bg-purple-800" />
                  </button>
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu">
                        <div className="px-4 py-2 text-sm text-white font-semibold border-b border-slate-700">{user.username}</div>
                        <button onClick={onShowWatchLater} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Watch Later</button>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Settings</a>
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Logout</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={onLoginClick} className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">Login</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
