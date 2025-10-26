

import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Filter } from '../types';
// FIX: Removed a stale comment about an unused icon.
import { CloseIcon, SettingsIcon, ChevronDownIcon, TvIcon, ClockIcon, CalendarIcon, SortAscIcon, LanguageIcon, SunIcon, MoonIcon, SparklesIcon } from './icons/Icons';
import { GENRES, ANIME_TYPES, ANIME_STATUSES, YEAR_OPTIONS, LANGUAGE_OPTIONS, COLOR_PRESETS } from '../constants';
import Logo from './Logo';
import { useSettings } from '../hooks/useSettings';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Filter) => void;
  currentFilters: Filter;
  onShowWatchLater: () => void;
  onShowProfile: () => void;
  onLogoClick: () => void;
  onSurpriseMe: () => void;
}

const initialFilters: Filter = {
  query: '',
  genres: [],
  types: [],
  status: '',
  year: '',
  sort: 'popularity',
  language: '',
};

const FilterAccordion: React.FC<{ title: string; icon: ReactNode; children: ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[rgb(var(--border-color))/0.5]">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))/0.5] transition-colors">
                <span className="flex items-center gap-3 font-semibold">
                    {icon}
                    {title}
                </span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-3 bg-[rgb(var(--surface-1))/0.3]">
                    {children}
                </div>
            </div>
        </div>
    )
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onApplyFilters, currentFilters, onShowWatchLater, onShowProfile, onLogoClick, onSurpriseMe }) => {
  const { user, logout } = useAuth();
  const [draftFilters, setDraftFilters] = useState<Filter>({ ...initialFilters, ...currentFilters });
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
      const savedFilters = sessionStorage.getItem('anistream-filters');
      if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          setDraftFilters({ ...initialFilters, ...parsed });
      }
  }, []);

  useEffect(() => {
    setDraftFilters(prev => ({ ...prev, ...currentFilters }));
  }, [currentFilters]);

  const handleFilterChange = <K extends keyof Filter>(key: K, value: Filter[K]) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleGenreToggle = (genre: string) => {
    const currentGenres = draftFilters.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    handleFilterChange('genres', newGenres);
  };

  const handleTypeToggle = (type: string) => {
    const currentTypes = draftFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    handleFilterChange('types', newTypes);
  }

  const handleApply = () => {
    sessionStorage.setItem('anistream-filters', JSON.stringify(draftFilters));
    onApplyFilters(draftFilters);
    onClose();
  };

  const handleClear = () => {
    setDraftFilters(initialFilters);
    sessionStorage.removeItem('anistream-filters');
    onApplyFilters(initialFilters); 
    onClose();
  };
  
  const handleLinkClick = (action: () => void) => {
      action();
      onClose();
  }

  const handleSurpriseClick = () => {
    onSurpriseMe();
    onClose();
  };
  
  const handleLogout = () => {
    logout();
    onClose();
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-[85vw] sm:w-96 bg-gradient-to-b from-[rgb(var(--bg-gradient-start))/0.95] via-[rgb(var(--bg-gradient-via))/0.95] to-[rgb(var(--bg-gradient-end))/0.95] backdrop-blur-lg shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-shrink-0 p-4 border-b border-[rgb(var(--border-color))/0.5] space-y-4">
          <div className="flex justify-between items-center">
            <Logo onClick={() => handleLinkClick(onLogoClick)} />
            <button onClick={onClose} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors" aria-label="Close menu"><CloseIcon /></button>
          </div>
          {user && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-[rgb(var(--surface-2))/0.5]">
              <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="font-semibold text-[rgb(var(--text-primary))]">{user.username}</p>
                <p className="text-xs text-[rgb(var(--text-muted))]">Welcome back!</p>
              </div>
              <button onClick={() => handleLinkClick(onShowProfile)} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><SettingsIcon /></button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <button
            onClick={handleSurpriseClick}
            className="w-full flex items-center justify-center gap-3 py-3 text-center bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]"
          >
            <SparklesIcon />
            <span>Surprise Me!</span>
          </button>
          
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3 px-2">Genres</h3>
            <div className="grid grid-cols-2 gap-2">
                {GENRES.map(genre => (
                    <button 
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`px-3 py-2 text-sm text-center rounded-lg transition-all duration-200 ${draftFilters.genres?.includes(genre) ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] font-bold shadow-lg shadow-[rgb(var(--shadow-color))/0.3]' : 'bg-[rgb(var(--surface-2))/0.7] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))]'}`}>
                        {genre}
                    </button>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-2 px-2">Filters</h3>
            <div className="rounded-lg bg-[rgb(var(--surface-2))/0.5] overflow-hidden">
                <FilterAccordion title="Type" icon={<TvIcon/>}>
                    <div className="grid grid-cols-2 gap-2">
                        {ANIME_TYPES.map(type => ( <button key={type} onClick={() => handleTypeToggle(type)} className={`px-2 py-1.5 text-sm rounded-md ${draftFilters.types?.includes(type) ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]' : 'bg-[rgb(var(--surface-3))/0.5] hover:bg-[rgb(var(--surface-4))]'}`}> {type} </button> ))}
                    </div>
                </FilterAccordion>
                <FilterAccordion title="Language" icon={<LanguageIcon/>}>
                    <div className="flex flex-col gap-2">
                        {LANGUAGE_OPTIONS.map(lang => ( <button key={lang} onClick={() => handleFilterChange('language', draftFilters.language === lang ? '' : lang as 'Sub' | 'Dub' | 'Raw')} className={`px-2 py-1.5 text-sm rounded-md text-left ${draftFilters.language === lang ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]' : 'bg-[rgb(var(--surface-3))/0.5] hover:bg-[rgb(var(--surface-4))]'}`}>{lang}</button>))}
                    </div>
                </FilterAccordion>
                 <FilterAccordion title="Status" icon={<ClockIcon/>}>
                    <div className="flex flex-col gap-2">
                        {ANIME_STATUSES.map(status => ( <button key={status} onClick={() => handleFilterChange('status', draftFilters.status === status ? '' : status as 'Ongoing' | 'Completed' | 'Upcoming')} className={`px-2 py-1.5 text-sm rounded-md text-left ${draftFilters.status === status ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]' : 'bg-[rgb(var(--surface-3))/0.5] hover:bg-[rgb(var(--surface-4))]'}`}>{status}</button>))}
                    </div>
                </FilterAccordion>
                <FilterAccordion title="Year" icon={<CalendarIcon/>}>
                     <div className="grid grid-cols-2 gap-2">
                        {YEAR_OPTIONS.map(year => (<button key={year} onClick={() => handleFilterChange('year', draftFilters.year === year ? '' : year)} className={`px-2 py-1.5 text-sm rounded-md ${draftFilters.year === year ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]' : 'bg-[rgb(var(--surface-3))/0.5] hover:bg-[rgb(var(--surface-4))]'}`}>{year}</button>))}
                    </div>
                </FilterAccordion>
                <FilterAccordion title="Sort By" icon={<SortAscIcon/>}>
                    <select value={draftFilters.sort} onChange={(e) => handleFilterChange('sort', e.target.value as Filter['sort'])} className="w-full bg-[rgb(var(--surface-input))/0.6] border border-[rgb(var(--border-color))] rounded-lg p-2 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))]">
                      <option value="popularity">Popularity</option>
                      <option value="release_date">Newest</option>
                      <option value="alphabetical">A-Z</option>
                    </select>
                </FilterAccordion>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 space-y-3 border-t border-[rgb(var(--border-color))/0.5]">
            <div className="grid grid-cols-2 gap-3">
                <button onClick={handleClear} className="w-full py-3 text-center bg-[rgb(var(--surface-3))/0.8] rounded-lg font-semibold hover:bg-[rgb(var(--surface-4))] transition-colors">Clear All</button>
                <button onClick={handleApply} className="w-full py-3 text-center bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">Apply Filters</button>
            </div>
             {user && (
                <div className="grid grid-cols-2 gap-2 text-sm text-center">
                    <button onClick={() => handleLinkClick(onShowWatchLater)} className="p-2 text-[rgb(var(--text-secondary))] bg-[rgb(var(--surface-2))/0.5] rounded-md hover:text-[rgb(var(--color-primary-accent))]">Watch Later</button>
                    <button onClick={handleLogout} className="p-2 text-[rgb(var(--text-secondary))] bg-[rgb(var(--surface-2))/0.5] rounded-md hover:text-[rgb(var(--color-primary-accent))]">Logout</button>
                </div>
             )}
            <div className="flex justify-between items-center p-2 bg-[rgb(var(--surface-2))/0.5] rounded-md">
                <span className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Disable Ads</span>
                <button
                    onClick={() => updateSettings({ adsDisabled: !settings.adsDisabled })}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.adsDisabled ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`}
                    aria-label={`Ads are currently ${settings.adsDisabled ? 'disabled' : 'enabled'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.adsDisabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div className="flex justify-between items-center p-2 bg-[rgb(var(--surface-2))/0.5] rounded-md">
                <span className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Theme</span>
                <button
                    onClick={() => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
                    className="p-2 rounded-full bg-[rgb(var(--surface-3))] text-[rgb(var(--text-primary))] relative w-9 h-9 flex items-center justify-center overflow-hidden"
                    aria-label={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} theme`}
                >
                    <SunIcon className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${settings.theme === 'light' ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform -rotate-90 scale-50'}`} />
                    <MoonIcon className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${settings.theme === 'dark' ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform rotate-90 scale-50'}`} />
                </button>
            </div>
            <p className="text-xs text-center text-[rgb(var(--text-muted))] pt-2">© {new Date().getFullYear()} ANISTREAM</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;