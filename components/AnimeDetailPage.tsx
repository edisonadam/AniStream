import React, { useState, useEffect, useMemo } from 'react';
import type { Anime, Character } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useProfileData } from '../hooks/useProfileData';
// FIX: Import formatDuration utility function.
import { getDisplayTitle, mapPartialToFullAnime, formatDuration } from '../utils';
import { fetchWithRetry, mapJikanToCharacter, fetchAniListDetails } from '../api';
import { ChevronLeftIcon, StarIcon, PlayIcon, BookmarkIcon, HeartIcon, HeartIconSolid, ShareIcon, FilmIcon, UsersIcon, ThumbsUpIcon, ThumbsDownIcon } from './icons/Icons';

interface AnimeDetailPageProps {
    anime: Anime;
    onGoBack: () => void;
    onWatchNow: (anime: Anime) => void;
    onGenreSelect: (genre: string) => void;
    onStudioSelect: (studio: string) => void;
}

const StatItem: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
    <div className="bg-[rgb(var(--surface-3))/0.5] p-3 rounded-lg text-center">
        <p className="text-sm font-semibold text-[rgb(var(--text-muted))]">{label}</p>
        <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{value || 'N/A'}</p>
    </div>
);

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({ anime, onGoBack, onWatchNow, onGenreSelect, onStudioSelect }) => {
    const { settings } = useSettings();
    const { addToWatchlist, isInWatchlist } = useWatchlist();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { likeAnime, dislikeAnime, isLiked, isDisliked } = useProfileData();

    const [fullAnime, setFullAnime] = useState<Anime>(anime);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [related, setRelated] = useState<(Partial<Anime> & { relationType: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

    const isFavorited = isFavorite(fullAnime.id);
    const inWatchlist = isInWatchlist(fullAnime.id);
    const liked = isLiked(fullAnime.id);
    const disliked = isDisliked(fullAnime.id);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const [fullDetailsRes, charactersRes, anilistData] = await Promise.all([
                    fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/full`),
                    fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/characters`),
                    fetchAniListDetails(anime.id)
                ]);

                if (fullDetailsRes.ok) {
                    const data = await fullDetailsRes.json();
                    // Just get more details, but keep the core anime object passed in props
                    setFullAnime(prev => ({
                        ...prev,
                        ...mapPartialToFullAnime(data.data),
                        views: Math.floor(Math.random() * 5000) + 100, // Mock data
                        likes: Math.floor(Math.random() * 500) + 10,   // Mock data
                    }));
                }
                
                if (charactersRes.ok) {
                    const data = await charactersRes.json();
                    setCharacters(data.data.map(mapJikanToCharacter).filter((c: Character | null): c is Character => c !== null));
                }
                
                if (anilistData) {
                    setRelated(anilistData.relations);
                }

            } catch (error) { console.error("Failed to fetch details", error); }
            finally { setIsLoading(false); }
        };

        fetchDetails();
    }, [anime.id]);

    const handleFavoriteToggle = () => isFavorited ? removeFavorite(fullAnime.id, displayTitle) : addFavorite(fullAnime.id, displayTitle);
    const handleWatchlistToggle = () => inWatchlist ? {} : addToWatchlist(fullAnime, 'Plan to Watch');

    const displayTitle = getDisplayTitle(fullAnime, settings);
    const synopsis = fullAnime.synopsis || '';
    const canExpandSynopsis = synopsis.length > 300;
    const displaySynopsis = canExpandSynopsis && !isSynopsisExpanded ? `${synopsis.substring(0, 300)}...` : synopsis;

    return (
        <div className="animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-white bg-black/30 backdrop-blur-md p-2 rounded-full hover:bg-black/50 transition-colors">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="relative h-64 md:h-80 w-full">
                <img src={fullAnime.bannerImage || fullAnime.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg-gradient-start))] to-transparent"></div>
            </div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-12">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-48 mx-auto md:mx-0 md:w-56 flex-shrink-0">
                        <img src={fullAnime.thumbnail} alt={displayTitle} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl" />
                    </div>
                    <div className="flex-1 text-center md:text-left pt-4">
                        <h1 className="text-3xl md:text-5xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{displayTitle}</h1>
                        <h2 className="text-lg text-[rgb(var(--text-muted))] mt-1">{fullAnime.title_english}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 my-4">
                            {fullAnime.genres.map(genre => (
                                <button key={genre} onClick={() => onGenreSelect(genre)} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))] hover:bg-[rgb(var(--color-primary))/0.5]">
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl rounded-2xl flex flex-col md:flex-row gap-3">
                    <button onClick={() => onWatchNow(fullAnime)} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))]"><PlayIcon className="w-6 h-6"/> Watch Now</button>
                    <div className="flex gap-3">
                        <button onClick={handleWatchlistToggle} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold ${inWatchlist ? 'bg-white/20' : 'bg-white/10'}`}><BookmarkIcon className="w-6 h-6"/> {inWatchlist ? 'In List' : 'Add to List'}</button>
                        <button onClick={handleFavoriteToggle} className={`p-3 rounded-xl ${isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10'}`}><HeartIconSolid className={`w-6 h-6 ${isFavorited ? '' : 'text-white'}`}/></button>
                        <button onClick={() => likeAnime(fullAnime.id)} className={`p-3 rounded-xl ${liked ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'}`}><ThumbsUpIcon className="w-6 h-6"/></button>
                        <button onClick={() => dislikeAnime(fullAnime.id)} className={`p-3 rounded-xl ${disliked ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white'}`}><ThumbsDownIcon className="w-6 h-6"/></button>
                        <button className="p-3 bg-white/10 text-white rounded-xl"><ShareIcon className="w-6 h-6"/></button>
                    </div>
                </div>

                <div className="mt-8 space-y-8">
                    <div>
                        <p className="text-[rgb(var(--text-secondary))]">{displaySynopsis}
                            {canExpandSynopsis && <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="font-bold text-[rgb(var(--color-primary-accent))] ml-1">{isSynopsisExpanded ? 'Show Less' : 'Show More'}</button>}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <StatItem label="Type" value={fullAnime.type} />
                        <StatItem label="Episodes" value={fullAnime.totalEpisodes} />
                        <StatItem label="Duration" value={formatDuration(fullAnime.avgEpisodeDuration)} />
                        <StatItem label="Status" value={fullAnime.status} />
                        <StatItem label="Season" value={`${fullAnime.season || ''} ${fullAnime.releaseYear || ''}`.trim()} />
                        <StatItem label="Rating" value={fullAnime.rating?.toFixed(2)} />
                        <StatItem label="Views" value={fullAnime.views?.toLocaleString()} />
                        <StatItem label="Likes" value={fullAnime.likes?.toLocaleString()} />
                        <StatItem label="Studio" value={fullAnime.studio} />
                    </div>

                    {related.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-[rgb(var(--color-primary-accent))] mb-4">Related Seasons & Series</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {related.map(item => (
                                    <div key={item.id} className="group flex items-center gap-3 bg-[rgb(var(--surface-3))/0.5] p-2 rounded-xl hover:bg-[rgb(var(--surface-3))]">
                                        <img src={item.thumbnail} alt="" className="w-12 h-16 object-cover rounded-md" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">{item.title}</h4>
                                            <p className="text-xs text-[rgb(var(--text-muted))] capitalize">{item.relationType?.toLowerCase().replace(/_/g, ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {characters.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-[rgb(var(--color-primary-accent))] mb-4">Characters</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {characters.slice(0, 8).map(char => (
                                    <div key={char.id} className="bg-[rgb(var(--surface-3))/0.5] p-2 rounded-lg text-center">
                                        <img src={char.image} alt={char.name} className="w-full aspect-[2/3] object-cover rounded-md" />
                                        <p className="text-xs font-semibold mt-1 truncate">{char.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPage;