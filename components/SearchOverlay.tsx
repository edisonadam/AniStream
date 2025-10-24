
import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { CloseIcon, SearchIcon } from './icons/Icons';
import { DEFAULT_SEARCH_SUGGESTIONS } from '../constants';

interface SearchOverlayProps {
  onClose: () => void;
  onAnimeSelect: (anime: Anime) => void;
  onSearchSubmit: (query: string) => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose, onAnimeSelect, onSearchSubmit }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
                
                const mappedData: Anime[] = data.data.map((item: any) => ({
                  id: item.mal_id,
                  title: item.title_english || item.title,
                  thumbnail: item.images.jpg.image_url,
                  bannerImage: item.images.jpg.large_image_url,
                  synopsis: item.synopsis || 'No synopsis available.',
                  genres: item.genres.map((g: any) => g.name),
                  releaseYear: item.year,
                  status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming',
                  totalEpisodes: item.episodes,
                  rating: item.score,
                  type: item.type,
                  studio: item.studios.length > 0 ? item.studios[0].name : 'Unknown',
                  hasSub: true,
                  hasDub: false,
                }));

                setSuggestions(mappedData);
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
  }, [query]);

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
        className="relative bg-slate-800/80 border border-slate-700 rounded-2xl w-[90%] max-w-2xl transform transition-all shadow-2xl shadow-purple-900/50" 
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
            className="w-full bg-slate-700/60 border-2 border-slate-600 rounded-full py-3 pl-12 pr-12 text-lg text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
          />
          <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
          <button onClick={onClose} className="absolute inset-y-0 right-0 pr-8 flex items-center text-gray-400 hover:text-purple-400"><CloseIcon/></button>
        </div>
        
        <div className="p-4 pt-0 max-h-[60vh] overflow-y-auto">
          <ul>
            {!query && (
              <>
                <li className="px-3 pt-2 pb-1 text-sm text-gray-400 font-semibold">Trending Searches</li>
                {DEFAULT_SEARCH_SUGGESTIONS.map(title => (
                   <li key={title} onClick={() => onSearchSubmit(title)} className="p-3 rounded-lg cursor-pointer hover:bg-purple-600/30 transition-colors text-gray-200 font-medium">
                       {title}
                   </li>
                ))}
              </>
            )}

            {query && isSearching && (
              <li className="p-8 text-center text-gray-400">Searching...</li>
            )}

            {query && !isSearching && suggestions.length > 0 && (
                <>
                    <li className="px-3 pt-2 pb-1 text-sm text-gray-400 font-semibold">Suggestions</li>
                    {suggestions.map(anime => (
                    <li key={anime.id} onClick={() => handleSelect(anime)} className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-purple-600/30 transition-colors">
                        <img src={anime.thumbnail} alt={anime.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{anime.title}</p>
                            <p className="text-xs text-gray-400">{anime.type} &bull; {anime.releaseYear}</p>
                        </div>
                    </li>
                    ))}
                </>
            )}

            {query && !isSearching && suggestions.length === 0 && (
              <li className="p-8 text-center text-gray-400">No results found for "{query}".</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;