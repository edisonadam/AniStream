
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Filter, Settings, Page } from '../types';
import { CloseIcon, UsersIcon, BookOpenIcon, GiftIcon, MoonIcon, SunIcon, HomeIcon, TrendingUpIcon, CalendarIcon, HistoryIcon, InfoIcon, AcademicCapIcon, EyeIcon, EyeOffIcon, MessageCircleIcon, TrophyIcon, ChevronDownIcon, ClipboardIcon, ShieldCheckIcon, HeartIcon, NewspaperIcon, StarIcon, MailIcon, QuestionMarkCircleIcon, FilmIcon, DownloadIcon, ShoppingCartIcon, MicrophoneIcon, RefreshCwIcon, DevicePhoneMobileIcon } from './icons/Icons';
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
  installPrompt: Event | null;
  onInstallClick: () => void;
}

const SidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 space-y-2 border-b border-white/10">
        <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">{title}</h3>
        {children}
    </div>
);

const SideButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }> = ({ icon, label, onClick, disabled = false }) => (
    <button onClick={onClick} disabled={disabled} title={disabled ? `${label} (Coming Soon)` : label} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${disabled ? 'text-[rgb(var(--text-muted))] opacity-60 cursor-not-allowed' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--color-primary-accent))]'}`}>
        {icon}
        <span className="font-semibold">{label}</span>
        {disabled && <span className="ml-auto text-xs font-bold text-[rgb(var(--text-muted))]">(Coming Soon)</span>}
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
    settings, updateSettings, isLoggedIn, onLoginClick,
    installPrompt, onInstallClick
}) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['Genres', 'Type']));
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const asideRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const listTouchStartRef = useRef<{ x: number, y: number, scrollTop: number } | null>(null);

  // Horizontal Swipe to Close (Sidebar)
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      // Logic handled in End
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const diffX = touchEndX - touchStartRef.current.x;
      const diffY = touchEndY - touchStartRef.current.y;
      
      // Only close if horizontal swipe is dominant (to avoid accidental closes when scrolling vertically)
      // and significant enough (> 50px)
      if (Math.abs(diffX) > Math.abs(diffY) && diffX < -50) { 
          onClose();
      }
      touchStartRef.current = null;
  };

  // Backdrop Touch (Scroll away to close)
  const handleBackdropTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleBackdropTouchMove = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.targetTouches[0].clientX - touchStartRef.current.x;
      const dy = e.targetTouches[0].clientY - touchStartRef.current.y;
      
      // Close on significant movement
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          onClose();
          touchStartRef.current = null;
      }
  };

  // List Touch (Overscroll to close - Strict Mode)
  const handleListTouchStart = (e: React.TouchEvent) => {
      const el = e.currentTarget;
      // Only track if we are strictly at the top or bottom
      if (el.scrollTop === 0 || Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 2) {
          listTouchStartRef.current = { 
              x: e.targetTouches[0].clientX, 
              y: e.targetTouches[0].clientY,
              scrollTop: el.scrollTop
          };
      } else {
          listTouchStartRef.current = null;
      }
  };

  const handleListTouchMove = (e: React.TouchEvent) => {
      // We don't trigger close during move to prevent jitter
  };

  const handleListTouchEnd = (e: React.TouchEvent) => {
      if (!listTouchStartRef.current || !scrollContainerRef.current) return;
      
      const el = scrollContainerRef.current;
      const y = e.changedTouches[0].clientY;
      const dy = y - listTouchStartRef.current.y;
      
      // Significant pull threshold
      const THRESHOLD = 120;

      // Top Overscroll (Pull Down)
      // Must have started at top (scrollTop 0) AND pulled down significantly
      if (listTouchStartRef.current.scrollTop === 0 && dy > THRESHOLD) {
          onClose();
      }
      
      // Bottom Overscroll (Pull Up)
      // Must have started at bottom AND pulled up significantly
      const isAtBottom = Math.abs(el.scrollHeight - listTouchStartRef.current.scrollTop - el.clientHeight) < 2;
      if (isAtBottom && dy < -THRESHOLD) {
          onClose();
      }

      listTouchStartRef.current = null;
  };

  // Wheel Overscroll (Desktop)
  const handleOverscroll = (e: React.WheelEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      // Bottom overscroll
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 5 && e.deltaY > 0) {
          onClose();
      }
      // Top overscroll
      if (el.scrollTop === 0 && e.deltaY < -10) {
          onClose();
      }
  };

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

  const handleInstall = () => {
    onClose();
    onInstallClick();
  };

  const toggleSection = (title: string) => {
      setOpenSections(prev => {
          const newSet = new Set(prev);
          if (!newSet.has(title)) {
              newSet.add(title);
              setTimeout(() => {
                const element = sectionRefs.current[title];
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }, 350);
          } else {
              newSet.delete(title);
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
        onWheel={onClose}
        onTouchStart={handleBackdropTouchStart}
        onTouchMove={handleBackdropTouchMove}
      />
      <aside
        ref={asideRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 left-0 w-80 bg-[rgb(var(--surface-1))/0.95] backdrop-blur-2xl border-r border-white/10 z-50 transform transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1) ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 h-screen flex flex-col shadow-2xl`}
      >
        <div className="flex-shrink-0 flex justify-between items-center px-6 h-16 border-b border-white/10 bg-[rgb(var(--surface-1))/0.8] backdrop-blur-md">
          <div className="transform scale-90 origin-left">
            <Logo onClick={handleGoHome} />
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] hover:bg-white/5 rounded-full transition-colors lg:hidden">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-fade-container overscroll-contain" 
            style={{ scrollbarWidth: 'thin' }}
            onWheel={handleOverscroll}
            onTouchStart={handleListTouchStart}
            onTouchMove={handleListTouchMove}
            onTouchEnd={handleListTouchEnd}
        >
            <SidebarSection title="Menu">
              <SideButton icon={<HomeIcon />} label="Home" onClick={handleGoHome} />
              <SideButton icon={<TrendingUpIcon />} label="Trending" onClick={() => handleNavigation('trending')} />
              <SideButton icon={<StarIcon />} label="Top 100" onClick={() => handleNavigation('top-100')} />
              <SideButton icon={<CalendarIcon />} label="Schedule" onClick={() => handleNavigation('schedule')} />
              <SideButton icon={<NewspaperIcon />} label="New Episodes" onClick={() => handleNavigation('new-episodes')} />
            </SidebarSection>
            
            <SidebarSection title="Explore">
              <SideButton icon={<BookOpenIcon />} label="Manga & Mags" onClick={() => handleNavigation('manga')} />
              <SideButton icon={<MessageCircleIcon />} label="Community Hub" onClick={() => handleNavigation('community')} />
              <SideButton icon={<UsersIcon />} label="Watch2Gether" onClick={() => handleNavigation('watch-together')} />
              <SideButton icon={<MicrophoneIcon />} label="Voice Actors" onClick={() => handleNavigation('voice-actor')} />
              <SideButton icon={<TrophyIcon />} label="Leaderboards" onClick={() => handleNavigation('leaderboards')} />
            </SidebarSection>
            
            <SidebarSection title="Library">
                <SideButton icon={<HistoryIcon />} label="History" onClick={() => handleNavigation('history')} />
                <SideButton icon={<DownloadIcon />} label="Downloads" onClick={() => handleNavigation('downloads')} />
                <SideButton icon={<ShoppingCartIcon />} label="Shop" onClick={() => handleNavigation('shop')} />
            </SidebarSection>

            <SidebarSection title="Tools & Info">
                <SideButton icon={<FilmIcon />} label="Trailers & Intros" onClick={() => handleNavigation('videos')} />
                <SideButton icon={<AcademicCapIcon />} label="For Beginners" onClick={() => handleNavigation('beginners')} />
                <SideButton icon={<GiftIcon />} label="Surprise Me!" onClick={handleSurprise} />
                <SideButton icon={<ClipboardIcon />} label="Updates & Logs" onClick={() => handleNavigation('news')} />
            </SidebarSection>

            <SidebarSection title="App">
                <SideButton icon={<InfoIcon />} label="About Us" onClick={() => handleNavigation('about')} />
                <SideButton icon={<ShieldCheckIcon />} label="Rules" onClick={() => handleNavigation('rules')} />
                <SideButton icon={<QuestionMarkCircleIcon />} label="How to Use" onClick={() => handleNavigation('how-to-use')} />
                <SideButton icon={<MailIcon />} label="Feedback" onClick={() => { window.location.href = 'mailto:edisonadam160@gmail.com?subject=ANISTREAM Feedback'; onClose(); }} />
                <SideButton icon={<HeartIcon />} label="Donation" onClick={() => handleNavigation('donation')} />
                {installPrompt && <SideButton icon={<DevicePhoneMobileIcon />} label="Install App" onClick={handleInstall} />}
            </SidebarSection>
       
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
                        className="p-2.5 rounded-full bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                        {settings.theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>
                    
                    <button 
                        onClick={() => updateSettings({ displayTitleLanguage: settings.displayTitleLanguage === 'english' ? 'japanese' : 'english' })} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))] hover:text-[rgb(var(--text-primary))] font-semibold text-sm transition-colors"
                    >
                        {settings.displayTitleLanguage === 'english' ? 'EN' : 'JP'}
                    </button>

                    {isLoggedIn && (
                      <button 
                          onClick={handleSfwToggle} 
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
                    Apply
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
