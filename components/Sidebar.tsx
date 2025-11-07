import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Filter, Settings, Page } from '../types';
import { CloseIcon, UsersIcon, BookOpenIcon, GiftIcon, MoonIcon, SunIcon, HomeIcon, TrendingUpIcon, CalendarIcon, HistoryIcon, InfoIcon, AcademicCapIcon, EyeIcon, EyeOffIcon, MessageCircleIcon, LevelUpIcon, ChevronDownIcon, ClipboardIcon, ShieldCheckIcon, HeartIcon, NewspaperIcon, StarIcon, MailIcon, QuestionMarkCircleIcon, FilmIcon } from './icons/Icons';
import Logo from './Logo';
import { ANIME_TYPES, ANIME_STATUSES, YEAR_OPTIONS, LANGUAGE_OPTIONS, STUDIO_OPTIONS, GENRES, TAG_OPTIONS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filter;
  onFilterChange: (newFilters: Partial<Filter>) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onNavigate: (page: Page) => void;
  onGoHome: () => void;
  onSurpriseMe: () => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoggedIn: boolean;
  onLoginClick: (reason: string) => void;
}

const SideButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
);

const FilterSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; sectionRef: React.Ref<HTMLDivElement>; }> = ({ title, children, isOpen, onToggle, sectionRef }) => (
    <div ref={sectionRef} className="py-2 border-b border-white/10">
      <button onClick={onToggle} className="w-full flex justify-between items-center font-semibold text-lg text-[rgb(var(--text-primary))] px-4 py-2 hover:bg-[rgb(var(--surface-3))/0.5] transition-colors rounded-md">
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
            <div className="px-4 pt-2 pb-4">{children}</div>
        </div>
      </div>
    </div>
);


const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, onClose, filters, onFilterChange, onApplyFilters, onResetFilters, 
    onNavigate, onGoHome, onSurpriseMe, 
    settings, updateSettings, isLoggedIn, onLoginClick
}) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['Genres', 'Type']));
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({}); // Store refs

  const handleNavigation = (page: Page) => {
    onClose();
    onNavigate(page);
  };

  const handleGoHome = () => {
    onClose();
    onGoHome();
  };

  const handleSurprise = () => {
    onClose();
    onSurpriseMe();
  };

  const toggleSection = (title: string) => {
      setOpenSections(prev => {
          const newSet = new Set(prev);
          const willOpen = !newSet.has(title);

          if (willOpen) {
              newSet.add(title);
          } else {
              newSet.delete(title);
          }
          
          if (willOpen) {
            // Give DOM a moment to render the expanded content before scrolling
            setTimeout(() => {
              const element = sectionRefs.current[title];
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 350); // Match or slightly exceed the CSS transition duration
          }
          return newSet;
      });
  };

  const handleMultiSelect = (key: keyof Filter, value: string) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    onFilterChange({ [key]: newValues });
  };
  
  const handleSfwToggle = () => {
    updateSettings({ restrictAdultContent: !settings.restrictAdultContent });
  };

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
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 w-72 sm:w-80 bg-[rgb(var(--surface-1))/0.7] backdrop-blur-2xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen flex flex-col`}
      >
        <div className="lg:hidden flex-shrink-0 flex justify-between items-center p-4 border-b border-white/10">
          <Logo onClick={onGoHome} />
          <button onClick={onClose} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))]">
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scroll-fade-container" style={{ scrollbarWidth: 'thin' }}>
            <div className="p-4 space-y-2 border-b border-white/10">
              <SideButton icon={<HomeIcon />} label="Home" onClick={handleGoHome} />
              <SideButton icon={<TrendingUpIcon />} label="Trending" onClick={() => handleNavigation('trending')} />
              <SideButton icon={<StarIcon />} label="Top 100" onClick={() => handleNavigation('top-100')} />
              <SideButton icon={<CalendarIcon />} label="Schedule" onClick={() => handleNavigation('schedule')} />
              <SideButton icon={<HistoryIcon />} label="History" onClick={() => handleNavigation('history')} />
              <SideButton icon={<InfoIcon />} label="Updates & Logs" onClick={() => handleNavigation('news')} />
              <SideButton icon={<FilmIcon />} label="Trailers & Intros/Outros" onClick={() => handleNavigation('videos')} />
            </div>

            <div className="p-4 space-y-2 border-b border-white/10">
              <SideButton icon={<BookOpenIcon />} label="Manga" onClick={() => handleNavigation('manga')} />
              <SideButton icon={<AcademicCapIcon />} label="For Beginners" onClick={() => handleNavigation('beginners')} />
              <SideButton icon={<GiftIcon />} label="Surprise Me!" onClick={handleSurprise} />
              <SideButton icon={<MessageCircleIcon />} label="Community Hub" onClick={() => handleNavigation('community')} />
              <SideButton icon={<UsersIcon />} label="Watch2Gether" onClick={() => { window.open('https://w2g.tv/', '_blank', 'noopener,noreferrer'); onClose(); }} />
              {isLoggedIn && <SideButton icon={<LevelUpIcon />} label="Level Up" onClick={() => handleNavigation('comment-meter')} />}
              <SideButton icon={<NewspaperIcon />} label="Magazines" onClick={() => handleNavigation('magazines')} />
            </div>
            
            <div className="p-4 space-y-2 border-b border-white/10">
              <SideButton icon={<InfoIcon />} label="About Us" onClick={() => handleNavigation('about')} />
              <SideButton icon={<ClipboardIcon />} label="Rules" onClick={() => handleNavigation('rules')} />
              <SideButton icon={<QuestionMarkCircleIcon />} label="How to Use" onClick={() => handleNavigation('how-to-use')} />
              <SideButton icon={<MailIcon />} label="Feedback" onClick={() => { window.location.href = 'mailto:edisonadam160@gmail.com?subject=ANISTREAM Feedback'; onClose(); }} />
              <SideButton icon={<HeartIcon />} label="Donation" onClick={() => handleNavigation('donation')} />
            </div>
       
          <FilterSection title="Genres" isOpen={openSections.has('Genres')} onToggle={() => toggleSection('Genres')} sectionRef={(el) => { sectionRefs.current['Genres'] = el; }}>
            <div className="flex flex-wrap gap-2">{GENRES.map(g => <FilterButton key={g} name={g} isSelected={filters.genres.includes(g)} onClick={() => handleMultiSelect('genres', g)} />)}</div>
          </FilterSection>
          <FilterSection title="Type" isOpen={openSections.has('Type')} onToggle={() => toggleSection('Type')} sectionRef={(el) => { sectionRefs.current['Type'] = el; }}>
            <div className="flex flex-wrap gap-2">{ANIME_TYPES.map(t => <FilterButton key={t} name={t} isSelected={filters.types.includes(t)} onClick={() => handleMultiSelect('types', t)} />)}</div>
          </FilterSection>
          <FilterSection title="Status" isOpen={openSections.has('Status')} onToggle={() => toggleSection('Status')} sectionRef={(el) => { sectionRefs.current['Status'] = el; }}>
            <div className="flex flex-wrap gap-2">{ANIME_STATUSES.map(s => <FilterButton key={s} name={s} isSelected={filters.statuses.includes(s)} onClick={() => handleMultiSelect('statuses', s)} />)}</div>
          </FilterSection>
          <FilterSection title="Tags" isOpen={openSections.has('Tags')} onToggle={() => toggleSection('Tags')} sectionRef={(el) => { sectionRefs.current['Tags'] = el; }}>
            <div className="flex flex-wrap gap-2">{TAG_OPTIONS.map(t => <FilterButton key={t} name={t} isSelected={filters.tags.includes(t)} onClick={() => handleMultiSelect('tags', t)} />)}</div>
          </FilterSection>
          <FilterSection title="Year" isOpen={openSections.has('Year')} onToggle={() => toggleSection('Year')} sectionRef={(el) => { sectionRefs.current['Year'] = el; }}>
            <div className="flex flex-wrap gap-2">{YEAR_OPTIONS.map(y => <FilterButton key={y} name={y} isSelected={filters.years.includes(y)} onClick={() => handleMultiSelect('years', y)} />)}</div>
          </FilterSection>
          <FilterSection title="Language" isOpen={openSections.has('Language')} onToggle={() => toggleSection('Language')} sectionRef={(el) => { sectionRefs.current['Language'] = el; }}>
            <div className="flex flex-wrap gap-2">{LANGUAGE_OPTIONS.map(l => <FilterButton key={l} name={l} isSelected={filters.languages.includes(l)} onClick={() => handleMultiSelect('languages', l)} />)}</div>
          </FilterSection>
          <FilterSection title="Studio" isOpen={openSections.has('Studio')} onToggle={() => toggleSection('Studio')} sectionRef={(el) => { sectionRefs.current['Studio'] = el; }}>
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

                    {isLoggedIn && (
                      <button 
                          onClick={handleSfwToggle} 
                          title={`Turn ${settings.restrictAdultContent ? 'Off' : 'On'} Adult Content Restriction`} 
                          aria-label={`Turn ${settings.restrictAdultContent ? 'Off' : 'On'} Adult Content Restriction`}
                          className="p-2.5 rounded-full bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      >
                          {settings.restrictAdultContent ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    )}
                </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 border-t border-white/5">
                <button onClick={() => { onResetFilters(); onClose(); }} className="w-full py-2.5 bg-[rgb(var(--surface-3))] rounded-lg font-semibold hover:bg-[rgb(var(--surface-4))] text-[rgb(var(--text-primary))]">
                    Reset
                </button>
                <button onClick={() => { onApplyFilters(); onClose(); }} className="w-full py-2.5 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
                    Apply Filters
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;