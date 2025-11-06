import React, { useState, useEffect, useRef } from 'react';
import type { Anime, Character } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from '../hooks/useToast';
import { getDisplayTitle } from '../utils';
import { fetchWithRetry, mapJikanToCharacter } from '../api';
import { CloseIcon, StarIcon, PlayIcon, BookmarkIcon, HeartIcon, HeartIconSolid, DotsVerticalIcon, FilmIcon, UsersIcon, ExternalLinkIcon, FlagIcon, ShareIcon, DownloadIcon } from './icons/Icons';

interface AnimeDetailModalProps {
    anime: Anime;
    onClose: () => void;
    onWatchNow: () => void;
    onGenreSelect: (genre: string) => void;
}

const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({ anime, onClose, onWatchNow, onGenreSelect }) => {
    const { settings } = useSettings();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { addToast } = useToast();

    const [details, setDetails] = useState<Partial<Anime> & { characters: Character[], trailerKey: string | null }>({ characters: [], trailerKey: null });
    const [isLoading, setIsLoading] = useState(true);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    
    const modalRef = useRef<HTMLDivElement>(null);
    const firstFocusableElementRef = useRef<HTMLButtonElement>(null);
    const lastFocusableElementRef = useRef<HTMLButtonElement>(null);

    const isFavorited = isFavorite(anime.id);
    const inWatchlist = isInWatchlist(anime.id);

    // Fetch detailed data
    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const [charactersRes, videosRes] = await Promise.all([
                    fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/characters`),
                    fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/videos`)
                ]);

                const charactersData = charactersRes.ok ? (await charactersRes.json()).data : [];
                const videosData = videosRes.ok ? (await videosRes.json()).data : {};

                const promoTrailer = videosData.promo?.find((p: any) => p.trailer?.youtube_id);
                const musicVideo = videosData.music_videos?.[0];

                let trailerKey = null;
                if (promoTrailer) {
                    trailerKey = promoTrailer.trailer.youtube_id;
                } else if (musicVideo) {
                    trailerKey = musicVideo.video?.youtube_id;
                }

                setDetails({
                    characters: charactersData.map(mapJikanToCharacter).filter((c: Character | null) => c && c.role === 'Main').slice(0, 6),
                    trailerKey: trailerKey,
                });

            } catch (error) {
                console.error("Failed to fetch modal details", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [anime.id]);

    // Handle ESC key and focus trap
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = Array.from(modalRef.current.querySelectorAll(
                    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
                )) as HTMLElement[];
                
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        firstFocusableElementRef.current?.focus();

        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleFavoriteToggle = () => {
        if (isFavorited) {
            removeFavorite(anime.id);
            addToast('Removed from Favorites', 'unfavorite');
        } else {
            addFavorite(anime.id);
            addToast('Added to Favorites', 'favorite');
        }
    };

    const handleWatchlistToggle = () => {
        if (inWatchlist) {
            removeFromWatchlist(anime.id);
            addToast('Removed from watchlist', 'info');
        } else {
            addToWatchlist(anime, 'Plan to Watch'); // Default status
            addToast("Added to watchlist as 'Plan to Watch'", 'success');
        }
    };

    const synopsis = anime.synopsis || '';
    const canExpandSynopsis = synopsis.length > 250;
    const displaySynopsis = canExpandSynopsis && !isSynopsisExpanded ? `${synopsis.substring(0, 250)}...` : synopsis;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center animate-cinematic-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="anime-detail-title"
        >
            <div
                ref={modalRef}
                onClick={e => e.stopPropagation()}
                className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col animate-modal-pop-in"
            >
                <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-white/10">
                    <h2 id="anime-detail-title" className="text-lg font-bold text-[rgb(var(--text-primary))] sr-only">{getDisplayTitle(anime, settings)} Details</h2>
                    <div/>
                    <button ref={firstFocusableElementRef} onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                        <div className="w-full md:w-1/3 flex-shrink-0">
                            <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-3xl lg:text-4xl font-bold text-white">{getDisplayTitle(anime, settings)}</h3>
                            {anime.title_english && anime.title_english.toLowerCase() !== anime.title.toLowerCase() && (
                                <h4 className="text-lg text-[rgb(var(--text-muted))]">{anime.title}</h4>
                            )}
                            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-[rgb(var(--text-muted))] mt-2">
                                {anime.rating && <div className="flex items-center gap-1.5 font-bold text-[rgb(var(--color-warning))]"><StarIcon className="w-4 h-4" /><span>{anime.rating.toFixed(1)}</span></div>}
                                {anime.releaseYear && <span>{anime.releaseYear}</span>}
                                {anime.type && <span>{anime.type}</span>}
                                {anime.totalEpisodes && <span>{anime.totalEpisodes} episodes</span>}
                                {anime.avgEpisodeDuration && <span>~{formatDuration(anime.avgEpisodeDuration)}/ep</span>}
                            </div>

                            <div className="flex flex-wrap gap-2 my-4">
                                {anime.genres.map(genre => (
                                    <button key={genre} onClick={() => onGenreSelect(genre)} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))] hover:bg-[rgb(var(--color-primary))/0.5]">
                                        {genre}
                                    </button>
                                ))}
                            </div>

                            <p className="text-sm text-[rgb(var(--text-secondary))]">{displaySynopsis}
                                {canExpandSynopsis && (
                                    <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="font-bold text-[rgb(var(--color-primary-accent))] ml-1">
                                        {isSynopsisExpanded ? 'Read less' : 'Read more'}
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>
                    
                    {/* Trailer & Cast */}
                    <div className="mt-6">
                        {details.trailerKey && (
                            <div className="mb-6">
                                <h4 className="text-xl font-bold mb-3 flex items-center gap-2"><FilmIcon className="w-5 h-5 text-[rgb(var(--color-primary-accent))]" /> Trailer</h4>
                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                                    <iframe src={`https://www.youtube.com/embed/${details.trailerKey}`} title="Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                                </div>
                            </div>
                        )}
                        {details.characters.length > 0 && (
                             <div>
                                <h4 className="text-xl font-bold mb-3 flex items-center gap-2"><UsersIcon className="w-5 h-5 text-[rgb(var(--color-primary-accent))]" /> Main Cast</h4>
                                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
                                {details.characters.map(char => (
                                    <div key={char.id} className="flex-shrink-0 w-24 text-center">
                                        <img src={char.image} alt={char.name} className="w-24 h-32 object-cover rounded-lg shadow-md" />
                                        <p className="mt-1 text-xs font-semibold text-[rgb(var(--text-secondary))] truncate">{char.name}</p>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 p-4 bg-[rgb(var(--surface-3))/0.5] border-t border-white/10 flex flex-col sm:flex-row gap-3">
                    <button onClick={onWatchNow} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-transform duration-300 hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.4]">
                        <PlayIcon className="w-6 h-6"/> Watch Now
                    </button>
                    <div className="flex gap-3">
                        <button onClick={handleWatchlistToggle} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors ${inWatchlist ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <BookmarkIcon className="w-6 h-6"/> {inWatchlist ? 'In Watchlist' : 'Add to List'}
                        </button>
                        <button onClick={handleFavoriteToggle} className={`p-3 rounded-xl transition-colors ${isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            {isFavorited ? <HeartIconSolid className="w-6 h-6"/> : <HeartIcon className="w-6 h-6"/>}
                        </button>
                        <div className="relative">
                            <button ref={lastFocusableElementRef} onClick={() => setIsMoreMenuOpen(prev => !prev)} className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20"><DotsVerticalIcon className="w-6 h-6"/></button>
                            {isMoreMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[rgb(var(--surface-3))] border border-white/10 rounded-xl shadow-lg p-2 z-10">
                                    {anime.malUrl && <a href={anime.malUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]"> <ExternalLinkIcon className="w-4 h-4"/> View on MAL</a>}
                                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]"><ShareIcon className="w-4 h-4"/> Share</button>
                                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]"><DownloadIcon className="w-4 h-4"/> Download</button>
                                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md text-red-400 hover:bg-red-500/10"><FlagIcon className="w-4 h-4"/> Report Issue</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailModal;