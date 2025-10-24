
import React from 'react';
import { CloseIcon } from './icons/Icons';
import { GENRES, POPULAR_TITLES, RECENTLY_ADDED } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-full sm:w-80 bg-gradient-to-b from-purple-900 to-slate-900 shadow-2xl shadow-purple-900/50 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-purple-400 transition-colors" aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-65px)]">
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Filters</h3>
            <div className="flex space-x-2">
              <button className="flex-1 bg-slate-700/50 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300">Sub</button>
              <button className="flex-1 bg-slate-700/50 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300">Dub</button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Genres</h3>
            <ul className="space-y-1">
              {GENRES.map(genre => (
                <li key={genre}>
                  <a href="#" className="block p-2 rounded-md text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">{genre}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Popular</h3>
            <ul className="space-y-1">
              {POPULAR_TITLES.map(title => (
                <li key={title}>
                  <a href="#" className="block p-2 rounded-md text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">{title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Recently Added</h3>
            <ul className="space-y-1">
              {RECENTLY_ADDED.map(title => (
                <li key={title}>
                  <a href="#" className="block p-2 rounded-md text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">{title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
