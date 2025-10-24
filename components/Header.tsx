
import React, { useState, useRef, useEffect } from 'react';
import { HamburgerIcon, SearchIcon, BellIcon, UserIcon } from './icons/Icons';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
      setIsNotificationOpen(false);
    }
    if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
      setIsProfileOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-purple-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <a href="#" className="text-2xl font-bold tracking-wider text-white uppercase" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.8)' }}>
              AniStream
            </a>
          </div>

          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-md w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search anime
              </label>
              <div className="relative text-gray-400 focus-within:text-gray-100 group">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <SearchIcon />
                </div>
                <input
                  id="search"
                  className="block w-full bg-slate-800/60 border border-slate-700 rounded-full py-2 pl-10 pr-3 leading-5 text-gray-300 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300 group-focus-within:shadow-lg group-focus-within:shadow-purple-500/30"
                  placeholder="Search anime..."
                  type="search"
                  name="search"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-4">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-full text-gray-300 hover:text-purple-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 transition-all duration-300"
                aria-label="View notifications"
              >
                <BellIcon />
              </button>
              {isNotificationOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-300 ease-out transform opacity-100 scale-100">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">New Episode Added</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Ongoing Anime Updated</a>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-1 rounded-full text-gray-300 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 transition-colors duration-300"
                aria-label="User profile"
              >
                <div className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center">
                  <UserIcon />
                </div>
              </button>
              {isProfileOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-300 ease-out transform opacity-100 scale-100">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Profile</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Watch History</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Settings</a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700">Logout</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
