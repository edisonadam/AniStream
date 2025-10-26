
import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { CloseIcon, SearchIcon } from './icons/Icons';
import { DEFAULT_SEARCH_SUGGESTIONS } from '../constants';
import { useSettings } from '../hooks/useSettings';

interface SearchOverlayProps {
  onClose: () => void;
  onAnimeSelect: (anime: Anime) => void;
  onSearchSubmit: (query: string) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose, onAnimeSelect, onSearchSubmit }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
        setSuggestions([]);
        setIsSearching(false);
        return;
    }

    setIsSearching(true);

    const debounceTimer = setTimeout(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=7`);
                if (!response.ok) throw new Error('Failed to fetch suggestions.');
                const data = await response.json();
                
                const mappedData: Anime[] = data.data
                  .map((item: any): Anime | null => {
                    if (!item || !item.mal_id || !item.title) return null;
                    return {
                        id: item.mal_id,
                        title: item.title_english || item.title,
                        thumbnail: item.images.jpg.image_url,
                        bannerImage: item.images.jpg.large_image_url,
                        synopsis: item.synopsis || 'No synopsis available.',
                        genres: (item.genres || []).map((g: any) => g.name),
                        releaseYear: item.year,
                        status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming',
                        totalEpisodes: item.episodes,
                        rating: item.score,
                        type: item.type,
                        studio: (item.studios || []).length > 0 ? item.studios[0].name : 'Unknown',
                        hasSub: true,
                        hasDub: !!item.title_english,
                        isAdult: item.rating === 'Rx - Hentai',
                        runtime: null,
                        avgEpisodeDuration: null,
                    };
                  })
                  .filter((anime): anime is Anime => anime !== null);
                
                const filteredData = mappedData.filter(anime => !(settings.restrictAdultContent && anime.isAdult));
                setSuggestions(filteredData);

            } catch (error) {
                console.error(error);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        };
        fetchSuggestions();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [query, settings.restrictAdultContent]);

  const handleSelect = (anime: Anime) => {
    onAnimeSelect(anime);
    onClose();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearchSubmit(query.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-center items-start pt-24 sm:pt-32 animate-fade-in-fast" 
      onClick={onClose}
    >
      <div 
        className="relative bg-[rgb(var(--surface-2))/0.8] border border-[rgb(var(--border-color))] rounded-2xl w-[90%] max-w-2xl transform transition-all shadow-2xl shadow-[rgb(var(--shadow-color))/0.5]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-4">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for an anime..."
            className="w-full bg-[rgb(var(--surface-input))/0.6] border-2 border-[rgb(var(--border-color))] rounded-full py-3 pl-12 pr-12 text-lg text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))]"
          />
          <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon /></div>
          <button onClick={onClose} className="absolute inset-y-0 right-0 pr-8 flex items-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon/></button>
        </div>
        
        <div className="p-4 pt-0 max-h-[60vh] overflow-y-auto">
          <ul>
            {!query && (
              <>
                <li className="px-3 pt-2 pb-1 text-sm text-[rgb(var(--text-muted))] font-semibold">Trending Searches</li>
                {DEFAULT_SEARCH_SUGGESTIONS.map(title => (
                   <li key={title} onClick={() => onSearchSubmit(title)} className="p-3 rounded-lg cursor-pointer hover:bg-[rgb(var(--color-primary))/0.3] transition-colors text-[rgb(var(--text-secondary))] font-medium">
                       {title}
                   </li>
                ))}
              </>
            )}

            {query && isSearching && (
              <li className="p-8 text-center text-[rgb(var(--text-muted))]">Searching...</li>
            )}

            {query && !isSearching && suggestions.length > 0 && (
                <>
                    <li className="px-3 pt-2 pb-1 text-sm text-[rgb(var(--text-muted))] font-semibold">Suggestions</li>
                    {suggestions.map(anime => (
                    <li key={anime.id} onClick={() => handleSelect(anime)} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-[rgb(var(--color-primary))/0.3] transition-colors">
                        <div className="relative flex-shrink-0 w-12 h-16 bg-[rgb(var(--surface-3))] rounded-md overflow-hidden">
                            <img src={anime.thumbnail} alt={anime.title} className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 flex flex-col items-start gap-1 z-10">
                                {anime.isAdult && <span className="px-1 py-0.5 text-[9px] font-bold rounded-sm bg-black/50 text-white backdrop-blur-md">+18</span>}
                                {anime.type && <span className="px-1 py-0.5 text-[9px] font-bold rounded-sm bg-black/50 text-white backdrop-blur-md">{anime.type.toUpperCase()}</span>}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[rgb(var(--text-primary))] truncate">{anime.title}</p>
                            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))] mt-1">
                                {anime.releaseYear && <span>{anime.releaseYear}</span>}
                                {anime.hasSub && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[rgb(var(--color-primary))/0.6] text-white">SUB</span>}
                                {anime.hasDub && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[rgb(var(--color-tertiary-accent))/0.6] text-white">DUB</span>}
                            </div>
                        </div>
                    </li>
                    ))}
                </>
            )}

            {query && !isSearching && suggestions.length === 0 && (
              <li className="p-8 text-center text-[rgb(var(--text-muted))]">No results found for "{query}".</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
