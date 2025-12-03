
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, Character, Page, Filter } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useProfileData } from '../hooks/useProfileData';
import { getDisplayTitle, formatDuration, mapPartialToFullAnime } from '../utils';
import { fetchWithRetry, mapJikanToCharacter, fetchAniListDetails, mapJikanToAnime } from '../api';
import { ChevronLeftIcon, StarIcon, PlayIcon, BookmarkIcon, HeartIcon, HeartIconSolid, ShareIcon, FilmIcon, UsersIcon, ThumbsUpIcon, ThumbsDownIcon, ViewListIcon } from './icons/Icons';
import { useQueue } from '../hooks/useQueue';
import { useAuth } from '../hooks/useAuth';
import CharacterModal from './CharacterModal';
import RatingControl from './RatingControl';

interface AnimeDetailPageProps {
    anime: Anime;
    onGoBack: () => void;
    onGoHome: () => void;
    onWatchNow: (anime: Anime) => void;
    onGenreSelect: (genre: string) => void;
    onStudioSelect: (studio: string) => void;
    onLoginRequest: (reason: string) => void;
    breadcrumbsData?: { page: Page; filters: Filter; source?: string };
    getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
    onSelectRelated: (anime: Anime, source?: string) => void;
    onVoiceActorSelect?: (id: number) => void;
}

const StatItem: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
    <div className="bg-[rgb(var(--surface-3))/0.5] p-3 rounded-lg text-center">
        <p className="text-sm font-semibold text-[rgb(var(--text-muted))]">{label}</p>
        <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{value || 'N/A'}</p>
    </div>
);

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({ anime, onGoBack, onGoHome, onWatchNow, onGenreSelect, onStudioSelect, onLoginRequest, breadcrumbsData, getEpisodeStatus, onSelectRelated, onVoiceActorSelect }) => {
    const { settings } = useSettings();
    const { addToWatchlist, isInWatchlist } = useWatchlist();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { likeAnime, dislikeAnime, isLiked, isDisliked } = useProfileData();
    const { addToQueue, removeFromQueue, isInQueue } = useQueue();
    const { isLoggedIn } = useAuth();

    const [fullAnime, setFullAnime] = useState<Anime>(anime);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [watchOrder, setWatchOrder] = useState<(Partial<Anime> & { relationType: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    const isFavorited = isFavorite(fullAnime.id);
    const inWatchlist = isInWatchlist(fullAnime.id);
    const inQueue = isInQueue(fullAnime.id);
    const liked = isLiked(fullAnime.id);
    const disliked = isDisliked(fullAnime.id);

    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        document.body.classList.toggle('modal-zoom-effect-active', !!selectedCharacter);
        return () => {
            document.body.classList.remove('modal-zoom-effect-active');
        };
    }, [selectedCharacter]);

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
                    const mappedAnime = mapJikanToAnime(data.data);
                    if (mappedAnime) {
                        setFullAnime({
                            ...mappedAnime,
                            views: Math.floor(Math.random() * 5000) + 100, // Mock data
                            likes: Math.floor(Math.random() * 500) + 10,   // Mock data
                        });
                    }
                }
                
                if (charactersRes.ok) {
                    const data = await charactersRes.json() as any;
                    // FIX: Ensure data.data is an array before calling .map()
                    if (data?.data && Array.isArray(data.data)) {
                        setCharacters(data.data.map(mapJikanToCharacter).filter((c: Character | null): c is Character => c !== null));
                    }
                }
                
                if (anilistData) {
                    const allRelations = anilistData.relations;
                    const orderPreference = ['PARENT STORY', 'PREQUEL', 'SEQUEL', 'SIDE STORY', 'SPIN OFF', 'ALTERNATIVE', 'CHARACTER', 'SUMMARY', 'OTHER'];
                    allRelations.sort((a: any, b: any) => {
                        const aIndex = orderPreference.indexOf(a.relationType.toUpperCase().replace(/_/g, ' '));
                        const bIndex = orderPreference.indexOf(b.relationType.toUpperCase().replace(/_/g, ' '));
                        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
                    });
                    setWatchOrder(allRelations);
                }

            } catch (error) { console.error("Failed to fetch details", error); }
            finally { setIsLoading(false); }
        };

        fetchDetails();
    }, [anime.id]);

    const handleAuthenticatedAction = (action: () => void, reason: string) => {
        if (!isLoggedIn) {
            onLoginRequest(reason);
        } else {
            action();
        }
    };
    
    const handleFavoriteToggle = () => handleAuthenticatedAction(() => isFavorited ? removeFavorite(fullAnime.id, displayTitle) : addFavorite(fullAnime.id, displayTitle), "Please log in to manage your favorites.");
    const handleWatchlistToggle = () => handleAuthenticatedAction(() => inWatchlist ? {} : addToWatchlist(fullAnime, 'Plan to Watch'), "Please log in to manage your watchlist.");
    const handleQueueToggle = () => handleAuthenticatedAction(() => {
        inQueue ? removeFromQueue(fullAnime.id) : addToQueue(fullAnime);
    }, "Please log in to manage your queue.");
    const handleLike = () => handleAuthenticatedAction(() => likeAnime(fullAnime.id), "Please log in to rate anime.");
    const handleDislike = () => handleAuthenticatedAction(() => dislikeAnime(fullAnime.id), "Please log in to rate anime.");

    const displayTitle = getDisplayTitle(fullAnime, settings);
    const synopsis = fullAnime.synopsis || '';
    const canExpandSynopsis = synopsis.length > 300;
    const displaySynopsis = canExpandSynopsis && !isSynopsisExpanded ? `${synopsis.substring(0, 300)}...` : synopsis;
    
    const mainCharacters = characters.filter(c => c.role === 'Main');
    const supportingCharacters = characters.filter(c => c.role === 'Supporting');

    const airedDate = useMemo(() => {
        if (!fullAnime.startDate) return 'N/A';
        const start = new Date(fullAnime.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        if (!fullAnime.endDate) return `${start} to ?`;
        const end = new Date(fullAnime.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        if (start === end) return start;
        return `${start} to ${end}`;
    }, [fullAnime.startDate, fullAnime.endDate]);

    const { episodeNumber } = getEpisodeStatus(fullAnime.id);
    const totalEpisodes = fullAnime.totalEpisodes || fullAnime.episodes_count;
    
    let badgeText = '';
    if (episodeNumber) {
        badgeText = `${episodeNumber} / ${totalEpisodes || '?'}`;
    } else if (totalEpisodes) {
        badgeText = `${totalEpisodes} Eps`;
    }
    const showBadge = badgeText !== '';

    const Breadcrumbs: React.FC = () => {
        if (!breadcrumbsData) return null;
        const pageToName: Record<string, string> = {
            'home': 'Home', 'schedule': 'Schedule', 'trending': 'Trending',
            'top-100': 'Top 100', 'history': 'History', 'beginners': 'For Beginners',
        };
        const sourceName = breadcrumbsData.source || pageToName[breadcrumbsData.page] || 'Back';
        const path: React.ReactNode[] = [];

        path.push(
            <button key="home" onClick={onGoHome} className="hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                Home
            </button>
        );
        
        if (breadcrumbsData.page !== 'home') {
            path.push(<span key="sep-home" className="mx-2 opacity-50">/</span>);
            path.push(
                <button key="source" onClick={onGoBack} className="hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                    {sourceName}
                </button>
            );
        }
        
        path.push(<span key="sep-title" className="mx-2 opacity-50">/</span>);
        path.push(<span key="title" className="font-semibold truncate">{displayTitle}</span>);

        return (
            <nav className="flex items-center text-sm text-white bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit flex-wrap">
                {path}
            </nav>
        );
    };

    const CharacterGridItem: React.FC<{ character: Character }> = ({ character }) => {
        const va = character.voiceActors?.find(v => v.language === 'Japanese');
        return (
            <div className="bg-[rgb(var(--surface-3))/0.5] p-2 rounded-lg text-left transition-all duration-300 hover:bg-[rgb(var(--surface-3))] group overflow-hidden">
                <div className="flex gap-3">
                    <button onClick={() => setSelectedCharacter(character)} className="flex-shrink-0 transition-transform hover:scale-105">
                        <img src={character.image} alt={character.name} className="w-16 h-24 object-cover rounded-md" />
                    </button>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <button onClick={() => setSelectedCharacter(character)} className="text-xs font-bold truncate text-[rgb(var(--text-primary))] hover:text-[rgb(var(--color-primary-accent))] text-left w-full">{character.name}</button>
                            <p className="text-[10px] text-[rgb(var(--text-muted))]">{character.role}</p>
                        </div>
                        {va && (
                            <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-2">
                                <button 
                                    onClick={() => onVoiceActorSelect && onVoiceActorSelect(va.id)} 
                                    className="flex-shrink-0"
                                >
                                    <img src={va.image} alt={va.name} className="w-6 h-6 rounded-full object-cover transition-transform hover:scale-110" />
                                </button>
                                <button 
                                    onClick={() => onVoiceActorSelect && onVoiceActorSelect(va.id)}
                                    className="text-[10px] text-[rgb(var(--text-secondary))] truncate hover:text-[rgb(var(--color-primary-accent))] text-left"
                                >
                                    {va.name}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-subtle-fade-in-up">
            {modalRoot && selectedCharacter && ReactDOM.createPortal(
                <CharacterModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} onVoiceActorSelect={onVoiceActorSelect} />,
                modalRoot
            )}
            <div className="relative h-64 md:h-80 w-full">
                <img src={fullAnime.bannerImage || fullAnime.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg-gradient-start))] to-transparent"></div>
            </div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
                <div className="mb-4">
                    <Breadcrumbs />
                </div>
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
                            {showBadge && (
                                 <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400">
                                    {badgeText}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl rounded-2xl flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <button onClick={() => onWatchNow(fullAnime)} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))]"><PlayIcon className="w-6 h-6"/> Watch Now</button>
                        <div className="flex gap-3">
                            <button onClick={handleWatchlistToggle} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold ${inWatchlist ? 'bg-white/20' : 'bg-white/10'}`}><BookmarkIcon className="w-6 h-6"/> {inWatchlist ? 'In List' : 'Add to List'}</button>
                            <button onClick={handleFavoriteToggle} className={`p-3 rounded-xl ${isFavorited ? 'bg-red-500/20 text-red-400' : 'bg-white/10'}`}><HeartIconSolid className={`w-6 h-6 ${isFavorited ? '' : 'text-white'}`}/></button>
                            <button onClick={handleLike} className={`p-3 rounded-xl ${liked ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'}`}><ThumbsUpIcon className="w-6 h-6"/></button>
                            <button onClick={handleDislike} className={`p-3 rounded-xl ${disliked ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white'}`}><ThumbsDownIcon className="w-6 h-6"/></button>
                            <button className="p-3 bg-white/10 text-white rounded-xl"><ShareIcon className="w-6 h-6"/></button>
                        </div>
                    </div>
                    <button onClick={handleQueueToggle} className="flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--surface-4))] text-[rgb(var(--text-secondary))] rounded-xl font-bold hover:bg-[rgb(var(--surface-3))]"><ViewListIcon className="w-6 h-6"/> {inQueue ? 'In Queue' : 'Add to Queue'}</button>
                </div>

                <div className="mt-8 space-y-8">
                    <div>
                        <p className="text-[rgb(var(--text-secondary))]">{displaySynopsis}
                            {canExpandSynopsis && <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="font-bold text-[rgb(var(--color-primary-accent))] ml-1">{isSynopsisExpanded ? 'Show Less' : 'Show More'}</button>}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <StatItem label="Score" value={fullAnime.rating ? `${fullAnime.rating.toFixed(2)}` : 'N/A'} />
                        <StatItem label="Rank" value={fullAnime.rank ? `#${fullAnime.rank.toLocaleString()}` : 'N/A'} />
                        <StatItem label="Popularity" value={fullAnime.popularity ? `#${fullAnime.popularity.toLocaleString()}` : 'N/A'} />
                        <StatItem label="Members" value={fullAnime.members?.toLocaleString()} />
                        <StatItem label="Status" value={fullAnime.status} />
                        <StatItem label="Season" value={`${fullAnime.season || ''} ${fullAnime.releaseYear || ''}`.trim()} />
                        <StatItem label="Aired" value={airedDate} />
                        <StatItem label="Episodes" value={fullAnime.totalEpisodes} />
                        <StatItem label="Duration" value={formatDuration(fullAnime.avgEpisodeDuration)} />
                        <StatItem label="Type" value={fullAnime.type} />
                        <StatItem label="Studio" value={fullAnime.studio} />
                        <StatItem label="Source" value={fullAnime.source} />
                        <StatItem label="Views" value={fullAnime.views?.toLocaleString()} />
                        <StatItem label="Likes" value={fullAnime.likes?.toLocaleString()} />
                    </div>

                    {/* Rating Control Added Here */}
                    <RatingControl animeId={fullAnime.id} animeTitle={displayTitle} />

                    {watchOrder.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-[rgb(var(--color-primary-accent))] mb-4">Watch Order</h3>
                            <div className="bg-[rgb(var(--surface-3))/0.5] p-4 rounded-xl space-y-4">
                                {Object.entries(
                                    watchOrder.reduce((acc, item) => {
                                        const type = item.relationType.replace(/_/g, ' ');
                                        if (!acc[type]) acc[type] = [];
                                        acc[type].push(item);
                                        return acc;
                                    }, {} as Record<string, (Partial<Anime> & { relationType: string })[]>)
                                ).sort(([aType], [bType]) => {
                                    const orderPreference = ['Parent Story', 'Prequel', 'Sequel', 'Side Story', 'Spin Off', 'Alternative', 'Character', 'Summary', 'Other'];
                                    const aIndex = orderPreference.indexOf(aType);
                                    const bIndex = orderPreference.indexOf(bType);
                                    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
                                }).map(([type, items]: [string, (Partial<Anime> & { relationType: string })[]]) => (
                                    <div key={type}>
                                        <h4 className="font-semibold text-md text-[rgb(var(--text-secondary))] mb-2 capitalize">{type.toLowerCase()}</h4>
                                        <div className="space-y-2">
                                            {items.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onSelectRelated(mapPartialToFullAnime(item as any), 'Watch Order')}
                                                    className="group w-full flex items-center gap-3 bg-[rgb(var(--surface-4))/0.5] p-2 rounded-lg hover:bg-[rgb(var(--surface-4))] transition-colors text-left"
                                                >
                                                    <img src={item.thumbnail} alt={item.title} className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-semibold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{item.title}</h5>
                                                        <p className="text-xs text-[rgb(var(--text-muted))] capitalize">{item.type} &bull; {item.status}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {characters.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-[rgb(var(--color-primary-accent))] mb-4">Characters & Voice Actors</h3>
                            {mainCharacters.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-[rgb(var(--text-secondary))] mb-3">Main</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {mainCharacters.map(char => (
                                            <CharacterGridItem key={char.id} character={char} />
                                        ))}
                                    </div>
                                </div>
                            )}
                             {supportingCharacters.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-[rgb(var(--text-secondary))] mb-3">Supporting</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {supportingCharacters.map(char => (
                                            <CharacterGridItem key={char.id} character={char} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimeDetailPage;
