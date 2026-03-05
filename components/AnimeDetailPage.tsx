import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, Character, Page, Filter, User } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useWatchlist } from '../hooks/useWatchlist';
import { useFavorites } from '../hooks/useFavorites';
import { useProfileData } from '../hooks/useProfileData';
import { getDisplayTitle, formatDuration, mapPartialToFullAnime } from '../utils';
import { fetchWithRetry, mapJikanToCharacter, fetchAniListDetails, mapJikanToAnime } from '../api';
import { ChevronLeftIcon, StarIcon, PlayIcon, BookmarkIcon, HeartIcon, HeartIconSolid, ShareIcon, FilmIcon, UsersIcon, ThumbsUpIcon, ThumbsDownIcon, ViewListIcon, CloseIcon, CheckIcon, ClipboardIcon } from './icons/Icons';
import Comments from './Comments';
import { useQueue } from '../hooks/useQueue';
import { useAuth } from '../hooks/useAuth';
import CharacterModal from './CharacterModal';
import RatingControl from './RatingControl';
import ErrorState from './ErrorState';
import { motion, AnimatePresence } from 'motion/react';

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
    onUserSelect: (user: User) => void;
}

const StatItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="bg-[rgb(var(--surface-3))/0.5] p-3 rounded-lg text-center h-full flex flex-col justify-center">
        <p className="text-sm font-semibold text-[rgb(var(--text-muted))] mb-1">{label}</p>
        <div className="text-lg font-bold text-[rgb(var(--text-primary))] flex items-center justify-center h-full">{value || 'N/A'}</div>
    </div>
);

const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({ anime, onGoBack, onGoHome, onWatchNow, onGenreSelect, onStudioSelect, onLoginRequest, breadcrumbsData, getEpisodeStatus, onSelectRelated, onVoiceActorSelect, onUserSelect }) => {
    const { settings } = useSettings();
    const { addToWatchlist, isInWatchlist } = useWatchlist();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();
    const { likeAnime, dislikeAnime, isLiked, isDisliked } = useProfileData();
    const { addToQueue, removeFromQueue, isInQueue } = useQueue();
    const { isLoggedIn } = useAuth();

    const [fullAnime, setFullAnime] = useState<Anime>(anime);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [watchOrder, setWatchOrder] = useState<(Partial<Anime> & { relationType: string })[]>([]);
    const [recommendations, setRecommendations] = useState<Partial<Anime>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [trailer, setTrailer] = useState<{ id: string; site: string } | null>(null);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

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
        document.body.classList.toggle('modal-zoom-effect-active', isShareModalOpen);
        return () => {
            document.body.classList.remove('modal-zoom-effect-active');
        };
    }, [isShareModalOpen]);

    const [nextAiring, setNextAiring] = useState<{ episode: number; timeUntil: number } | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);
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
                    const data = (await charactersRes.json()) as any;
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
                    setRecommendations(anilistData.recommendations || []);
                    setTrailer(anilistData.details.trailer || null);

                    if (anilistData.details.nextAiringEpisode) {
                        setNextAiring({
                            episode: anilistData.details.nextAiringEpisode.episode,
                            timeUntil: anilistData.details.nextAiringEpisode.airingAt
                        });
                    }
                }

            } catch (error) { 
                console.error("Failed to fetch details", error); 
                setError(error instanceof Error ? error.message : "Failed to load anime details.");
            }
            finally { setIsLoading(false); }
        };

        fetchDetails();
    }, [anime.id, retryCount]);

    // Countdown Timer Logic
    const [timeLeft, setTimeLeft] = useState<string>('');
    useEffect(() => {
        if (!nextAiring) return;
        
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = nextAiring.timeUntil - now;
            
            if (diff <= 0) {
                setTimeLeft('Airing now or just aired!');
                return;
            }
            
            const days = Math.floor(diff / (60 * 60 * 24));
            const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((diff % (60 * 60)) / 60);
            
            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [nextAiring]);


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
            <motion.div 
                whileHover={{ y: -4 }}
                className="bg-[rgb(var(--surface-3))/0.5] p-2.5 rounded-2xl text-left transition-all duration-300 hover:bg-[rgb(var(--surface-3))] group overflow-hidden border border-white/5 hover:border-[rgb(var(--color-primary))]/30 shadow-lg"
            >
                <div className="flex gap-4">
                    <button onClick={() => setSelectedCharacter(character)} className="flex-shrink-0 transition-transform hover:scale-105 relative group/img">
                        <img src={character.image} alt={character.name} className="w-20 h-28 object-cover rounded-xl shadow-md" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <ViewListIcon className="w-6 h-6 text-white" />
                        </div>
                    </button>
                    <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                        <div>
                            <button onClick={() => setSelectedCharacter(character)} className="text-sm font-bold truncate text-[rgb(var(--text-primary))] hover:text-[rgb(var(--color-primary-accent))] text-left w-full transition-colors">{character.name}</button>
                            <p className="text-[11px] font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider mt-0.5">{character.role}</p>
                        </div>
                        {va && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2.5">
                                <button 
                                    onClick={() => onVoiceActorSelect && onVoiceActorSelect(va.id)} 
                                    className="flex-shrink-0 relative group/va"
                                >
                                    <img src={va.image} alt={va.name} className="w-8 h-8 rounded-full object-cover transition-all group-hover/va:ring-2 group-hover/va:ring-[rgb(var(--color-primary))]" />
                                </button>
                                <div className="min-w-0">
                                    <button 
                                        onClick={() => onVoiceActorSelect && onVoiceActorSelect(va.id)}
                                        className="text-[11px] font-semibold text-[rgb(var(--text-secondary))] truncate hover:text-[rgb(var(--color-primary-accent))] text-left block w-full transition-colors"
                                    >
                                        {va.name}
                                    </button>
                                    <span className="text-[9px] text-[rgb(var(--text-muted))] uppercase">Japanese VA</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const TrailerModal: React.FC = () => {
        if (!trailer || !isTrailerOpen) return null;
        const videoUrl = trailer.site === 'youtube' 
            ? `https://www.youtube.com/embed/${trailer.id}?autoplay=1`
            : `https://player.vimeo.com/video/${trailer.id}?autoplay=1`;

        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
                    onClick={() => setIsTrailerOpen(false)}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(var(--color-primary),0.3)] border border-white/10"
                >
                    <button 
                        onClick={() => setIsTrailerOpen(false)} 
                        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    <iframe 
                        src={videoUrl} 
                        className="w-full h-full" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowFullScreen
                    />
                </motion.div>
            </div>
        );
    };

    return (
        <div className="animate-subtle-fade-in-up">
            <AnimatePresence>
                {isTrailerOpen && <TrailerModal />}
            </AnimatePresence>
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
                                <button key={genre} onClick={() => onGenreSelect(genre)} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))] hover:bg-[rgb(var(--color-primary))/0.5] transition-colors">
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
                    {nextAiring && (
                        <div className="bg-[rgb(var(--color-primary))/0.2] border border-[rgb(var(--color-primary))/0.3] p-3 rounded-xl text-center mb-2">
                            <p className="text-[rgb(var(--color-primary-accent))] font-bold text-sm uppercase tracking-wider">Episode {nextAiring.episode} Airing In</p>
                            <p className="text-2xl font-black text-white">{timeLeft}</p>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-3">
                        <button onClick={() => onWatchNow(fullAnime)} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-all active:scale-95 shadow-lg shadow-[rgb(var(--color-primary))]/20"><PlayIcon className="w-6 h-6"/> Watch Now</button>
                        {trailer && (
                            <button onClick={() => setIsTrailerOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all active:scale-95 border border-white/10"><FilmIcon className="w-6 h-6"/> Watch Trailer</button>
                        )}
                        <div className="flex gap-3">
                            <button onClick={handleWatchlistToggle} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all active:scale-95 ${inWatchlist ? 'bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary-accent))] border border-[rgb(var(--color-primary))]/30' : 'bg-white/10 border border-white/10'}`}><BookmarkIcon className="w-6 h-6"/> {inWatchlist ? 'In List' : 'Add to List'}</button>
                            <button onClick={handleFavoriteToggle} className={`p-3 rounded-xl transition-all active:scale-95 border ${isFavorited ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 border-white/10'}`}><HeartIconSolid className={`w-6 h-6 ${isFavorited ? '' : 'text-white'}`}/></button>
                            <button onClick={handleLike} className={`p-3 rounded-xl transition-all active:scale-95 border ${liked ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-white border-white/10'}`}><ThumbsUpIcon className="w-6 h-6"/></button>
                            <button onClick={handleDislike} className={`p-3 rounded-xl transition-all active:scale-95 border ${disliked ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/10 text-white border-white/10'}`}><ThumbsDownIcon className="w-6 h-6"/></button>
                            <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"><ShareIcon className="w-6 h-6"/></button>
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
                        <StatItem label="Studio" value={
                            fullAnime.studio ? (
                                <button 
                                    onClick={() => onStudioSelect(fullAnime.studio)} 
                                    className="hover:text-[rgb(var(--color-primary-accent))] hover:underline transition-colors"
                                >
                                    {fullAnime.studio}
                                </button>
                            ) : 'Unknown'
                        } />
                        <StatItem label="Source" value={fullAnime.source} />
                        <StatItem label="Views" value={fullAnime.views?.toLocaleString()} />
                        <StatItem label="Likes" value={fullAnime.likes?.toLocaleString()} />
                    </div>

                    {/* Rating Control Added Here */}
                    <RatingControl animeId={fullAnime.id} animeTitle={displayTitle} />

                    {watchOrder.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-[rgb(var(--color-primary))] rounded-full" />
                                <h3 className="text-2xl font-bold text-white">Watch Order</h3>
                            </div>
                            <div className="bg-[rgb(var(--surface-3))/0.3] backdrop-blur-md p-6 rounded-3xl border border-white/5 space-y-6">
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
                                    <div key={type} className="space-y-3">
                                        <h4 className="text-xs font-black text-[rgb(var(--text-muted))] uppercase tracking-[0.2em] ml-1">{type}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {items.map(item => (
                                                <motion.button
                                                    key={item.id}
                                                    whileHover={{ x: 8 }}
                                                    onClick={() => onSelectRelated(mapPartialToFullAnime(item as any), 'Watch Order')}
                                                    className="group flex items-center gap-4 bg-[rgb(var(--surface-4))/0.4] p-3 rounded-2xl hover:bg-[rgb(var(--surface-4))] transition-all text-left border border-white/5 hover:border-[rgb(var(--color-primary))]/30"
                                                >
                                                    <div className="relative w-14 h-20 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
                                                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-bold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{item.title}</h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[rgb(var(--text-secondary))] uppercase">{item.type}</span>
                                                            <span className="text-[10px] font-medium text-[rgb(var(--text-muted))]">&bull;</span>
                                                            <span className="text-[10px] font-medium text-[rgb(var(--text-muted))]">{item.status}</span>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {recommendations.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-[rgb(var(--color-primary))] rounded-full" />
                                <h3 className="text-2xl font-bold text-white">Recommended Anime</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {recommendations.slice(0, 12).map(rec => (
                                    <motion.button
                                        key={rec.id}
                                        whileHover={{ y: -8 }}
                                        onClick={() => onSelectRelated(mapPartialToFullAnime(rec as any), 'Recommendations')}
                                        className="group text-left"
                                    >
                                        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-xl mb-3 border border-white/5 group-hover:border-[rgb(var(--color-primary))]/50 transition-colors">
                                            <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <div className="w-full">
                                                    <div className="flex items-center gap-1 text-[rgb(var(--color-primary-accent))] mb-1">
                                                        <StarIcon className="w-3 h-3 fill-current" />
                                                        <span className="text-[10px] font-bold">{rec.rating?.toFixed(1) || 'N/A'}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">{rec.type} &bull; {rec.status}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-bold text-[rgb(var(--text-primary))] line-clamp-2 group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{rec.title}</h4>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {characters.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-[rgb(var(--color-primary))] rounded-full" />
                                <h3 className="text-2xl font-bold text-white">Characters & Voice Actors</h3>
                            </div>
                            {mainCharacters.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-xs font-black text-[rgb(var(--text-muted))] uppercase tracking-[0.2em] mb-4 ml-1">Main Cast</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {mainCharacters.map(char => (
                                            <CharacterGridItem key={char.id} character={char} />
                                        ))}
                                    </div>
                                </div>
                            )}
                             {supportingCharacters.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black text-[rgb(var(--text-muted))] uppercase tracking-[0.2em] mb-4 ml-1">Supporting Cast</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {supportingCharacters.map(char => (
                                            <CharacterGridItem key={char.id} character={char} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div id="comments-section" className="mt-12">
                        <Comments 
                            anime={fullAnime} 
                            onUserSelect={onUserSelect} 
                        />
                    </div>

                    {isShareModalOpen && (
                        <ShareModal 
                            anime={fullAnime} 
                            onClose={() => setIsShareModalOpen(false)} 
                        />
                    )}

                    {selectedCharacter && (
                        <CharacterModal 
                            character={selectedCharacter} 
                            onClose={() => setSelectedCharacter(null)} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

interface ShareModalProps {
    anime: Anime;
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ anime, onClose }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const shareUrl = `${window.location.origin}/anime/${anime.id}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };

    const shareOptions = [
        {
            name: 'Twitter',
            icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            color: 'bg-black',
            action: () => window.open(`https://twitter.com/intent/tweet?text=Check out ${getDisplayTitle(anime)} on AniStream!&url=${encodeURIComponent(shareUrl)}`, '_blank')
        },
        {
            name: 'Facebook',
            icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
            color: 'bg-[#1877F2]',
            action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
        },
        {
            name: 'Reddit',
            icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.056 1.597.04.21.06.427.06.646 0 3.033-3.662 5.492-8.18 5.492-4.51 0-8.177-2.459-8.177-5.492 0-.21.022-.426.059-.635-.617-.268-1.05-.881-1.05-1.6 0-.968.786-1.754 1.754-1.754.483 0 .913.196 1.221.505 1.19-.858 2.846-1.42 4.671-1.493l.887-4.141a.25.25 0 0 1 .203-.196l2.64-.554c.105-.022.214.045.243.146zM8.5 12.14a1.14 1.14 0 1 0 0 2.281 1.14 1.14 0 0 0 0-2.281zm7 0a1.14 1.14 0 1 0 0 2.281 1.14 1.14 0 0 0 0-2.281zM12 17.33c-1.628 0-3.059-.486-4.058-1.26a.25.25 0 0 1 .313-.393c.836.65 2.057 1.053 3.745 1.053 1.689 0 2.91-.404 3.746-1.053a.25.25 0 0 1 .312.393c-.999.774-2.43 1.26-4.058 1.26z"/></svg>,
            color: 'bg-[#FF4500]',
            action: () => window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=Check out ${getDisplayTitle(anime)} on AniStream!`, '_blank')
        },
        {
            name: 'WhatsApp',
            icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
            color: 'bg-[#25D366]',
            action: () => window.open(`https://api.whatsapp.com/send?text=Check out ${getDisplayTitle(anime)} on AniStream! ${encodeURIComponent(shareUrl)}`, '_blank')
        }
    ];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={onClose}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-[rgb(var(--surface-2))] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-8 border border-white/10 backdrop-blur-xl"
            >
                <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 transition-colors text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                    <CloseIcon className="w-6 h-6" />
                </button>
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[rgb(var(--color-primary))]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShareIcon className="w-8 h-8 text-[rgb(var(--color-primary))]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Share Anime</h3>
                    <p className="text-[rgb(var(--text-muted))] mt-2">Spread the word about {getDisplayTitle(anime)}</p>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {shareOptions.map(option => (
                        <button 
                            key={option.name}
                            onClick={option.action}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                                {option.icon}
                            </div>
                            <span className="text-xs font-bold text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text-primary))] transition-colors">{option.name}</span>
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest ml-1">Direct Link</p>
                    <div className="flex items-center bg-[rgb(var(--surface-1))] p-1.5 rounded-2xl border border-white/10 group focus-within:border-[rgb(var(--color-primary))] transition-all">
                        <input 
                            type="text" 
                            readOnly 
                            value={shareUrl} 
                            className="flex-1 bg-transparent text-sm px-3 py-2 outline-none text-[rgb(var(--text-secondary))]" 
                        />
                        <button 
                            onClick={copyToClipboard}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${copyStatus === 'copied' ? 'bg-green-500 text-white' : 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] hover:bg-[rgb(var(--color-primary-hover))] active:scale-95 shadow-lg shadow-[rgb(var(--color-primary))/0.2]'}`}
                        >
                            {copyStatus === 'copied' ? (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <ClipboardIcon className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default AnimeDetailPage;