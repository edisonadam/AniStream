import React from 'react';
import type { Filter, Settings, Page } from '../types';
import { CloseIcon, UsersIcon, BookOpenIcon, GiftIcon, MoonIcon, SunIcon, HomeIcon, TrendingUpIcon, CalendarIcon, HistoryIcon, InfoIcon, AcademicCapIcon } from './icons/Icons';
import Logo from './Logo';
import { ANIME_TYPES, ANIME_STATUSES, YEAR_OPTIONS, LANGUAGE_OPTIONS, STUDIO_OPTIONS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filter;
  onFilterChange: (newFilters: Partial<Filter>) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onNavigate: (page: Page) => void;
  onSurpriseMe: () => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SideButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-primary))] transition-colors">
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, onClose, filters, onFilterChange, onApplyFilters, onResetFilters, 
    onNavigate, onSurpriseMe, 
    settings, updateSettings 
}) => {
  const handleMultiSelect = (key: keyof Filter, value: string) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    onFilterChange({ [key]: newValues });
  };
  
  const handleNavigation = (page: Page) => {
    onNavigate(page);
    onClose();
  }

  const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="py-4 border-b border-white/10">
      <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))] px-4 mb-2">{title}</h3>
      <div className="px-4">{children}</div>
    </div>
  );

  const FilterButton: React.FC<{ name: string; isSelected: boolean; onClick: () => void }> = ({ name, isSelected, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full transition-colors font-medium ${
        isSelected
          ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]'
          : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]'
      }`}
    >
      {name}
    </button>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-72 sm:w-80 bg-[rgb(var(--surface-1))/0.7] backdrop-blur-2xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10 h-[65px]">
          <Logo onClick={() => handleNavigation('home')} />
          <button onClick={onClose} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))]">
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="p-4 space-y-2 border-b border-white/10">
            <SideButton icon={<HomeIcon />} label="Home" onClick={() => handleNavigation('home')} />
            <SideButton icon={<TrendingUpIcon />} label="Trending" onClick={() => handleNavigation('trending')} />
            <SideButton icon={<CalendarIcon />} label="Schedule" onClick={() => handleNavigation('schedule')} />
            <SideButton icon={<HistoryIcon />} label="History" onClick={() => handleNavigation('history')} />
            <SideButton icon={<InfoIcon />} label="Updates" onClick={() => handleNavigation('news')} />
          </div>

          <div className="p-4 space-y-2 border-b border-white/10">
            <SideButton icon={<BookOpenIcon />} label="Manga" onClick={() => handleNavigation('manga')} />
            <SideButton icon={<AcademicCapIcon />} label="For Beginners" onClick={() => handleNavigation('beginners')} />
            <SideButton icon={<GiftIcon />} label="Surprise Me!" onClick={onSurpriseMe} />
            <SideButton icon={<UsersIcon />} label="Clubs" onClick={() => handleNavigation('clubs')} />
            <SideButton icon={<BookOpenIcon />} label="Magazines" onClick={() => handleNavigation('magazines')} />
          </div>

          <FilterSection title="Type">
            <div className="flex flex-wrap gap-2">{ANIME_TYPES.map(t => <FilterButton key={t} name={t} isSelected={filters.types.includes(t)} onClick={() => handleMultiSelect('types', t)} />)}</div>
          </FilterSection>
          <FilterSection title="Status">
            <div className="flex flex-wrap gap-2">{ANIME_STATUSES.map(s => <FilterButton key={s} name={s} isSelected={filters.statuses.includes(s)} onClick={() => handleMultiSelect('statuses', s)} />)}</div>
          </FilterSection>
          <FilterSection title="Year">
            <div className="flex flex-wrap gap-2">{YEAR_OPTIONS.map(y => <FilterButton key={y} name={y} isSelected={filters.years.includes(y)} onClick={() => handleMultiSelect('years', y)} />)}</div>
          </FilterSection>
          <FilterSection title="Language">
            <div className="flex flex-wrap gap-2">{LANGUAGE_OPTIONS.map(l => <FilterButton key={l} name={l} isSelected={filters.languages.includes(l)} onClick={() => handleMultiSelect('languages', l)} />)}</div>
          </FilterSection>
          <FilterSection title="Studio">
            <div className="flex flex-wrap gap-2">{STUDIO_OPTIONS.map(s => <FilterButton key={s} name={s} isSelected={filters.studios.includes(s)} onClick={() => handleMultiSelect('studios', s)} />)}</div>
          </FilterSection>
        </div>

        <div className="flex-shrink-0 border-t border-white/10 bg-gradient-to-t from-[rgb(var(--surface-1))] to-[rgb(var(--surface-1))/0.8] backdrop-blur-sm">
            <div className="p-4">
               <div className="flex justify-center items-center gap-2">
                    <button 
                        onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })} 
                        title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Theme`} 
                        aria-label={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Theme`}
                        className="p-2.5 rounded-full bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                        {settings.theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>
                    
                    <button 
                        onClick={() => updateSettings({ displayTitleLanguage: settings.displayTitleLanguage === 'english' ? 'japanese' : 'english' })} 
                        title={`Switch to ${settings.displayTitleLanguage === 'english' ? 'Japanese' : 'English'} Titles`} 
                        aria-label={`Switch to ${settings.displayTitleLanguage === 'english' ? 'Japanese' : 'English'} Titles`}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))] hover:text-[rgb(var(--text-primary))] font-semibold text-sm transition-colors"
                    >
                        {settings.displayTitleLanguage === 'english' ? 'EN' : 'JP'}
                    </button>
                </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 border-t border-white/5">
                <button onClick={() => { onResetFilters(); onNavigate('home'); onClose(); }} className="w-full py-2.5 bg-[rgb(var(--surface-3))] rounded-lg font-semibold hover:bg-[rgb(var(--surface-4))] text-[rgb(var(--text-primary))]">
                    Reset
                </button>
                <button onClick={onApplyFilters} className="w-full py-2.5 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
                    Apply Filters
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
