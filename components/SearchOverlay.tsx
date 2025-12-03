
import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { SearchIcon } from './icons/Icons';
import { DEFAULT_SEARCH_SUGGESTIONS } from '../constants';
import { useSettings } from '../hooks/useSettings';
import { mapJikanToAnime } from '../api';
import { getDisplayTitle } from '../utils';

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
                const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
                const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=7${sfwQuery}`);
                if (!response.ok) throw new Error('Failed to fetch suggestions.');
                const data = await response.json();
                
                const mappedData: Anime[] = data.data
                  .map(mapJikanToAnime)
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
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex justify-center items-start pt-24 sm:pt-32 animate-cinematic-fade-in" 
      onClick={onClose}
    >
      <div 
        className="relative bg-[rgb(var(--surface-2))/0.6] backdrop-blur-2xl border border-white/10 rounded-[2rem] w-[90%] max-w-2xl shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] animate-modal-pop-in" 
        onClick={e => e.stopPropagation()}
      >
        {/* Close button removed */}
        <div className="relative p-4">
          <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon /></div>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for an anime..."
            className="w-full bg-[rgb(var(--surface-input))/0.2] border-2 border-white/10 rounded-full py-3 pl-12 pr-6 text-lg text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:shadow-[0_0_15px_rgb(var(--shadow-color)/0.8)] truncate"
          />
        </div>
        
        <div className="p-4 pt-0 max-h-[60vh] overflow-y-auto">
          <ul>
            {!query && (
              <>
                <li className="px-3 pt-2 pb-1 text-sm text-[rgb(var(--text-muted))] font-semibold">Trending Searches</li>
                {DEFAULT_SEARCH_SUGGESTIONS.map(title => (
                   <li key={title} onClick={() => onSearchSubmit(title)} className="p-3 rounded-2xl cursor-pointer hover:bg-[rgb(var(--color-primary))/0.3] transition-colors text-[rgb(var(--text-secondary))] font-medium">
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
                    <li key={anime.id} onClick={() => handleSelect(anime)} className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-[rgb(var(--color-primary))/0.3] transition-colors">
                        <div className="relative flex-shrink-0 w-12 h-16 bg-[rgb(var(--surface-3))] rounded-lg overflow-hidden">
                            <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[rgb(var(--text-primary))] truncate">{getDisplayTitle(anime, settings)}</p>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[rgb(var(--text-muted))] mt-1">
                                {anime.releaseYear && <span>{anime.releaseYear}</span>}
                                {anime.type && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-sm bg-black/50 text-white backdrop-blur-md">{anime.type.toUpperCase()}</span>}
                                
                                {(() => {
                                    const subDubPart = 
                                        anime.hasSub && anime.hasDub ? 'SUB / DUB' :
                                        anime.hasSub ? 'SUB' :
                                        anime.hasDub ? 'DUB' : null;

                                    const seasonEpParts: string[] = [];
                                    if (anime.seasons_count != null) seasonEpParts.push(`S${anime.seasons_count}`);
                                    if (anime.episodes_count != null) seasonEpParts.push(`${anime.episodes_count} ep`);
                                    
                                    const allParts = [subDubPart, ...seasonEpParts].filter(Boolean);

                                    if (allParts.length === 0) return null;

                                    const tooltipText = `Sub: ${anime.hasSub ? 'Yes' : 'No'}, Dub: ${anime.hasDub ? 'Yes' : 'No'}, Seasons: ${anime.seasons_count ?? 'Unknown'}, Episodes: ${anime.episodes_count ?? 'Unknown'}`;

                                    return (
                                        <span 
                                            className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white bg-black/60 backdrop-blur-md"
                                            title={tooltipText}
                                            aria-label={tooltipText}
                                        >
                                            {allParts.join(' • ')}
                                        </span>
                                    );
                                })()}
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
