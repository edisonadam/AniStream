import React, { useState, useEffect, useCallback } from 'react';
import type { Anime } from '../types';
import { mapJikanToAnime, fetchWithRetry } from '../api';
import AnimeGrid from './AnimeGrid';
import { useSettings } from '../hooks/useSettings';

interface SchedulePageProps {
  onAnimeSelect: (anime: Anime) => void;
}

const getCurrentSeason = (): { year: number; season: string } => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let season: string;
    if (month >= 0 && month <= 2) season = 'winter';
    else if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else season = 'fall';
    return { year, season };
};

const SEASONS_ORDER = ['winter', 'spring', 'summer', 'fall'];

const SchedulePage: React.FC<SchedulePageProps> = ({ onAnimeSelect }) => {
    const [seasonsList, setSeasonsList] = useState<{ year: number }[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(getCurrentSeason().year);
    const [selectedSeason, setSelectedSeason] = useState<string>(getCurrentSeason().season);
    const [mode, setMode] = useState<'archive' | 'upcoming'>('archive');
    
    const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { settings } = useSettings();

    useEffect(() => {
        const fetchSeasonsList = async () => {
            try {
                const res = await fetchWithRetry(`https://api.jikan.moe/v4/seasons`);
                if (!res.ok) throw new Error('Failed to fetch seasons list.');
                const data = await res.json();
                setSeasonsList(data.data.sort((a: any, b: any) => b.year - a.year));
            } catch (e) {
                console.error(e);
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 20 }, (_, i) => ({ year: currentYear - i }));
                setSeasonsList(years);
            }
        };
        fetchSeasonsList();
    }, []);

    const fetchSeasonalData = useCallback(async (isNewSearch: boolean) => {
        const pageNum = isNewSearch ? 1 : currentPage + 1;
        if (isNewSearch) setIsLoading(true); else setIsLoadingMore(true);
        setError(null);
        
        const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
        let url = '';
        if (mode === 'upcoming') {
            url = `https://api.jikan.moe/v4/seasons/upcoming?page=${pageNum}&limit=25${sfwQuery}`;
        } else {
            if (!selectedYear || !selectedSeason) return;
            url = `https://api.jikan.moe/v4/seasons/${selectedYear}/${selectedSeason}?page=${pageNum}&limit=25${sfwQuery}`;
        }

        try {
            const res = await fetchWithRetry(url);
            if (!res.ok) throw new Error(`Failed to fetch anime for ${mode === 'upcoming' ? 'upcoming season' : `${selectedSeason} ${selectedYear}`}.`);
            
            const data = await res.json();
            let mapped = data.data.map(mapJikanToAnime).filter(Boolean);
            if (settings.restrictAdultContent) {
                mapped = mapped.filter((a: Anime) => !a.isAdult);
            }

            setSeasonalAnime(prev => isNewSearch ? mapped : [...prev, ...mapped]);
            setHasMore(data.pagination?.has_next_page ?? false);
            setCurrentPage(pageNum);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred.');
            setSeasonalAnime([]);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [currentPage, mode, selectedSeason, selectedYear, settings.restrictAdultContent]);

    useEffect(() => {
        fetchSeasonalData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, selectedYear, selectedSeason, settings.restrictAdultContent]);

    const handleModeChange = (newMode: 'archive' | 'upcoming') => {
        setMode(newMode);
        if (newMode === 'archive') {
            const { year, season } = getCurrentSeason();
            setSelectedYear(year);
            setSelectedSeason(season);
        }
    };
    
    const handleSetToCurrent = () => {
        const { year, season } = getCurrentSeason();
        setMode('archive');
        setSelectedYear(year);
        setSelectedSeason(season);
    }
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Seasonal Anime
            </h1>

            <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-4 rounded-2xl mb-8 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                    <button onClick={handleSetToCurrent} className={`px-4 py-1.5 text-sm rounded-full transition-all ${mode === 'archive' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Airing / Archive</button>
                    <button onClick={() => handleModeChange('upcoming')} className={`px-4 py-1.5 text-sm rounded-full transition-all ${mode === 'upcoming' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Upcoming</button>
                </div>
                {mode === 'archive' && (
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
                        >
                            {seasonsList.map(s => <option key={s.year} value={s.year}>{s.year}</option>)}
                        </select>
                        <select
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            className="bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
                        >
                            {SEASONS_ORDER.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                )}
            </div>
            
            {error ? (
                <p className="text-center text-red-500 py-12">{error}</p>
            ) : (
                <AnimeGrid
                    title={
                        mode === 'upcoming' ? 'Upcoming Anime' : 
                        `${selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)} ${selectedYear}`
                    }
                    animeList={seasonalAnime}
                    onAnimeSelect={onAnimeSelect}
                    isLoading={isLoading && seasonalAnime.length === 0}
                    onLoadMore={() => fetchSeasonalData(false)}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    filters={{ query: '', genres: [], types: [], statuses: [], years: [], languages: [], studios: [], sort: 'popularity', tags: [] }}
                    sortValue='popularity'
                    loadMoreMode={settings.loadMoreMode}
                />
            )}
        </div>
    );
};

export default SchedulePage;