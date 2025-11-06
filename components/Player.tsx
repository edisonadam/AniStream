import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, Season, Episode, VideoServer, EpisodeViewStyle, User, Character, DefaultLanguage, Page, Filter } from '../types';
import { ChevronLeftIcon, StarIcon, ChevronRightIcon, ViewGridIcon, ViewListIcon, ViewCarouselIcon, EyeIcon, EyeOffIcon, RewindIcon, FastForwardIcon, RefreshCwIcon, ShareIcon, CloseIcon, DownloadIcon, SparklesIcon, ExternalLinkIcon, CodeIcon, SearchIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, SettingsIcon, FullscreenEnterIcon, FullscreenExitIcon, ExclamationTriangleIcon, ScissorsIcon, UsersIcon, UserPlusIcon, PictureInPictureIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';
import Comments from './Comments';
import { useSettings } from '../hooks/useSettings';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../hooks/useAuth';
import { NARUTO_FILLER_EPISODES, VIDEO_SERVERS } from '../constants';
import { mapJikanToAnime, mapJikanToCharacter, updateAnilistEntry, fetchWithRetry, buildSourceUrl, fetchAniListDetails, fetchConsumetStreamUrl } from '../api';
import { GoogleGenAI } from '@google/genai';
import { getDisplayTitle, mapPartialToFullAnime } from '../utils';
import CharacterModal from './CharacterModal';
import ClippingModal from './ClippingModal';
import InviteFriendModal from './WatchTogetherModal';
import RoomManagerModal from './RoomManagerModal';
import DownloadModal from './DownloadModal';
import Artplayer from 'artplayer';
import PlayerActions from './PlayerActions';
import { loadYouTubeAPI } from '../youtubeApi';

declare global {
  interface Window {
    YT: any;
  }
}

const TMDB_API_KEY = '0f463393529890c7bf7e801f907981f8';
const EPISODES_PER_PAGE = 100;

interface PlayerProps {
  anime: Anime;
  allAnime: Anime[];
  onGoBack: () => void;
  onSelectRelated: (anime: Anime, source?: string) => void;
  onGenreSelect: (genre: string) => void;
  onUserSelect: (user: User) => void;
  isEmbed?: boolean;
  onEnterRoom: (roomId: string) => void;
  isWatchTogetherSession?: boolean;
  isHost?: boolean;
  onEpisodeChangeByHost?: (season: number, episode: number) => void;
  onPlayerReady?: (player: any) => void;
  breadcrumbsData?: { page: Page; filters: Filter; source?: string };
}

interface MediaIds {
  tmdb: number | null;
  imdb: string | null;
  mediaType: 'tv' | 'movie' | null;
}

// Embed Modal Component
const EmbedModal: React.FC<{ animeId: number; onClose: () => void; }> = ({ animeId, onClose }) => {
    const [autoplay, setAutoplay] = useState(true);
    const [mute, setMute] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [copied, setCopied] = useState(false);

    const baseUrl = window.location.origin + '/';
    const embedUrl = `${baseUrl}?embed=true&animeId=${animeId}&autoplay=${autoplay ? 1 : 0}&mute=${mute ? 1 : 0}&theme=${theme}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="100%" style="aspect-ratio: 16 / 9;" frameborder="0" allow="autoplay; fullscreen" allowfullscreen referrerpolicy="no-referrer"></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(iframeCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in p-4" onClick={onClose}>
            <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-2xl p-6 relative animate-modal-pop-in" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <h3 className="text-xl font-bold mb-4 text-[rgb(var(--text-primary))]">Embed Player</h3>
                
                <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-[rgb(var(--text-secondary))]">Options</h4>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500" /> Autoplay</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={mute} onChange={e => setMute(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500" /> Start Muted</label>
                        <div className="flex items-center gap-2">
                            <span>Theme:</span>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={e => setTheme(e.target.value)} /> Dark</label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={e => setTheme(e.target.value)} /> Light</label>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Iframe Code</label>
                    <textarea readOnly value={iframeCode} rows={4} className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-xl p-3 text-sm text-[rgb(var(--text-muted))] font-mono focus:ring-2 focus:ring-[rgb(var(--border-focus))]"></textarea>
                </div>
                
                <button onClick={handleCopy} className="mt-4 w-full py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))]">
                    {copied ? 'Copied!' : 'Copy Code'}
                </button>
            </div>
        </div>
    );
};


const parseSeasonFromTitle = (title: string): number | null => {
    if (!title) return null;
    let match = title.match(/season (\d+)/i);
    if (match?.[1]) return parseInt(match[1], 10);
    match = title.match(/(\d+)(?:st|nd|rd|th) season/i);
    if (match?.[1]) return parseInt(match[1], 10);
    match = title.match(/part (\d+)/i);
    if (match?.[1]) return parseInt(match[1], 10);
    return null;
}

const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) return 'N/A';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Unknown';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return 'Unknown';
    }
}

const formatAiringTime = (timestamp: number): string => {
    const now = Date.now();
    const airingDate = new Date(timestamp);
    const diff = airingDate.getTime() - now;

    if (diff <= 0) return `Aired on ${airingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

    if (parts.length > 0) return `in ${parts.slice(0, 2).join(' ')}`;
    return 'Airing soon';
};

const getSeasonFromDate = (date: Date): string => {
    const month = date.getMonth(); // 0-11
    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
};

const Player: React.FC<PlayerProps> = ({ anime, onGoBack, onSelectRelated, onGenreSelect, onUserSelect, isEmbed = false, onEnterRoom, isWatchTogetherSession = false, isHost = false, onEpisodeChangeByHost, onPlayerReady, breadcrumbsData }) => {
  const [playerAnime, setPlayerAnime] = useState<Anime>(anime);
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [similarAnime, setSimilarAnime] = useState<Anime[]>([]);
  const [relatedAnime, setRelatedAnime] = useState<Anime[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [seriesParts, setSeriesParts] = useState<Partial<Anime>[]>([]);
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [trailers, setTrailers] = useState<{key: string, name: string}[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [nextAiringInfo, setNextAiringInfo] = useState<{ at: number; episode: number } | null>(null);
  
  const [mediaIds, setMediaIds] = useState<MediaIds>({ tmdb: null, imdb: null, mediaType: null });
  
  const [activeTab, setActiveTab] = useState<'episodes' | 'trailers' | 'characters'>('episodes');

  const [isSeasonTransitioning, setIsSeasonTransitioning] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(anime.title);
  
  const [localBlur, setLocalBlur] = useState<boolean | null>(null);
  const [localEpisodeViewStyle, setLocalEpisodeViewStyle] = useState<EpisodeViewStyle>('compact');
  const [episodePage, setEpisodePage] = useState(1);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isClippingModalOpen, setIsClippingModalOpen] = useState(false);
  const [isInviteFriendModalOpen, setIsInviteFriendModalOpen] = useState(false);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string | number>>(new Set());
  
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { updateProgress, getWatchProgress } = useWatchProgress();
  const { rateAnime, getRating, friends, addNotification } = useProfileData();
  const currentRating = playerAnime ? getRating(playerAnime.id) : null;
  
  const episodeRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const isNavigatingWithArrows = useRef(false);
  
  const artplayerRef = useRef<HTMLDivElement>(null);
  const artplayerInstance = useRef<Artplayer | null>(null);
  const [isInPiPMode, setIsInPiPMode] = useState(false);

  const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [surpriseError, setSurpriseError] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState<string | null>(null);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

    // State and refs for Player Focus Mode
    const [isFocusMode, setIsFocusMode] = useState(false);
    const playerNodeWrapperRef = useRef<HTMLDivElement>(null);
    const overlaySlotRef = useRef<HTMLDivElement>(null);
    const [originalDOMInfo, setOriginalDOMInfo] = useState<{ parent: HTMLElement; nextSibling: Node | null } | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const isBlurred = localBlur === null ? settings.blurEpisodeThumbnails : localBlur;

  const fetchStreamUrl = useCallback(async () => {
    if (!playerAnime) return;
    setIsStreamLoading(true);
    setStreamError(null);
    setVideoUrl(null);

    try {
        let absoluteEpisodeNumber = currentEpisode;
        if (mediaIds.mediaType === 'tv' && seasons.length > 0) {
            const sorted = [...seasons].sort((a, b) => a.season_number - b.season_number);
            let episodeOffset = 0;
            for (const season of sorted) {
                if (season.season_number < currentSeason) {
                    episodeOffset += season.episode_count;
                } else {
                    break;
                }
            }
            absoluteEpisodeNumber += episodeOffset;
        } else if (playerAnime.type !== 'Movie') {
            absoluteEpisodeNumber = currentEpisode;
        } else {
            absoluteEpisodeNumber = 1;
        }

        const serverSetting = settings.videoServer;

        const EMBED_SERVERS: VideoServer[] = [
            'vidembed', 'mappletv', 'vidlink', 'primewire', 'embedsu', 'multiembed',
            'vidbinge', 'vidsrc', 'vidsrc-pk', 'autoembed', '2embed', 'movieapi', 'embed-api',
            'vidk', 'plyr'
        ];

        let url: string | null = null;
        if (EMBED_SERVERS.includes(serverSetting)) {
            url = buildSourceUrl(
                serverSetting,
                mediaIds.mediaType,
                mediaIds.tmdb,
                currentSeason,
                absoluteEpisodeNumber,
                settings.autoPlay
            );
        } else {
            // Consumet providers
            let provider: 'gogoanime' | 'zoro' | 'animepahe' = 'zoro';
            if (serverSetting === 'kiwi') provider = 'gogoanime';
            else if (serverSetting === 'animepahe') provider = 'animepahe';

            const titleToSearch = playerAnime.title_english || playerAnime.title;
            url = await fetchConsumetStreamUrl(titleToSearch, absoluteEpisodeNumber, provider);
        }

        if (url) {
            setVideoUrl(url);
        } else {
            throw new Error(`Could not retrieve a video source for the selected server: ${serverSetting}.`);
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while fetching video source.';
        setStreamError(errorMessage);
        console.error(e);
    } finally {
        setIsStreamLoading(false);
    }
}, [playerAnime, currentSeason, currentEpisode, seasons, mediaIds.mediaType, mediaIds.tmdb, settings.videoServer, settings.autoPlay]);

  useEffect(() => {
    fetchStreamUrl();
  }, [fetchStreamUrl]);

  // Event listener for opening download modal from player control
  useEffect(() => {
    const handler = () => setIsDownloadModalOpen(true);
    document.addEventListener('open-download-modal', handler);
    return () => document.removeEventListener('open-download-modal', handler);
  }, []);

  useEffect(() => {
    if (isEmbedModalOpen || selectedCharacter || isClippingModalOpen || isInviteFriendModalOpen || isRoomManagerOpen || isDownloadModalOpen) {
        document.body.classList.add('modal-zoom-effect-active');
    } else {
        document.body.classList.remove('modal-zoom-effect-active');
    }
    // Cleanup function in case component unmounts while modal is open
    return () => {
        document.body.classList.remove('modal-zoom-effect-active');
    };
  }, [isEmbedModalOpen, selectedCharacter, isClippingModalOpen, isInviteFriendModalOpen, isRoomManagerOpen, isDownloadModalOpen]);

  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => a.season_number - b.season_number);
  }, [seasons]);

  const averageRuntime = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;
    const runtimes = episodes.map(ep => ep.runtime).filter((r): r is number => r !== null && r > 0);
    if (runtimes.length === 0) return null;
    const total = runtimes.reduce((acc, r) => acc + r, 0);
    return Math.round(total / runtimes.length);
  }, [episodes]);

  useEffect(() => {
    const imagesToPreload: string[] = [];
    if (seasons.length > 0) {
        seasons.forEach(s => {
            if (s.poster_path) imagesToPreload.push(`https://image.tmdb.org/t/p/w500${s.poster_path}`);
        });
    } else if (seriesParts.length > 1) {
        seriesParts.forEach(p => {
            if (p.thumbnail && p.thumbnail !== anime.thumbnail) imagesToPreload.push(p.thumbnail);
        });
    }
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });
  }, [seasons, seriesParts, anime.thumbnail]);


  const selectEpisode = useCallback((epNum: number) => {
    if (isWatchTogetherSession && !isHost) return;
    if (onEpisodeChangeByHost) {
        onEpisodeChangeByHost(currentSeason, epNum);
        return;
    }
    if (currentEpisode === epNum) return;
    
    const newPage = Math.ceil(epNum / EPISODES_PER_PAGE);
    if (newPage !== episodePage) {
        setIsPageTransitioning(true);
        setTimeout(() => {
            setEpisodePage(newPage);
            setCurrentEpisode(epNum);
            setIsPageTransitioning(false);
        }, 300);
    } else {
        setCurrentEpisode(epNum);
    }
  }, [currentEpisode, episodePage, isWatchTogetherSession, isHost, onEpisodeChangeByHost, currentSeason]);

  const selectSeason = useCallback((seasonNum: number, startEpisode = 1) => {
    if (isWatchTogetherSession && !isHost) return;
    if (onEpisodeChangeByHost) {
        onEpisodeChangeByHost(seasonNum, startEpisode);
        return;
    }
    if (currentSeason === seasonNum || isSeasonTransitioning) return;
    
    setIsSeasonTransitioning(true);
    setTimeout(() => {
        setCurrentSeason(seasonNum);
        setCurrentEpisode(startEpisode);
        setEpisodePage(Math.ceil(startEpisode / EPISODES_PER_PAGE));
    }, 300);
  }, [currentSeason, isSeasonTransitioning, isWatchTogetherSession, isHost, onEpisodeChangeByHost]);
  
    // Main data fetching effect
    useEffect(() => {
        if (!anime?.id) return;
        if (!isEmbed) window.scrollTo(0, 0);

        // Immediately render the page with basic info
        setPlayerAnime(anime);
        setDisplayTitle(getDisplayTitle(anime, settings));

        // Reset states for the new anime
        setError(null);
        setMediaIds({ tmdb: null, imdb: null, mediaType: null });
        setSeasons([]); setEpisodes([]); setTrailers([]); setCharacters([]); setSeriesParts([]); setRelatedMovies([]); setRecommendations([]); setSimilarAnime([]);
        setActiveTab('episodes'); setLocalBlur(null); setEpisodePage(1); setFailedImages(new Set()); setNextAiringInfo(null);
        setEpisodeSearchQuery('');

        const fetchAllDetails = async () => {
            setIsLoading(true);
            try {
                // Step 1: Get full Jikan details. This is the most reliable source for the title and year.
                const fullDetailsRes = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/full`);
                if (!fullDetailsRes.ok) throw new Error(`Failed to fetch base anime details from Jikan API (Status: ${fullDetailsRes.status})`);
                
                const fullDetailsData = await fullDetailsRes.json();
                const animeFromJikan = mapJikanToAnime(fullDetailsData.data);
                if (!animeFromJikan) throw new Error("Could not process base anime data from Jikan.");

                // Step 2: Fetch TMDB data for seasons/episodes using the reliable Jikan title.
                await fetchPlayerData(animeFromJikan);

                // Step 3: Fetch all supplementary data in parallel
                if (!isEmbed) {
                    await fetchSupplementaryData(animeFromJikan);
                }

            } catch (e) {
                console.error("Failed to fetch player data", e);
                setError(e instanceof Error ? e.message : "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchPlayerData = async (animeForLookup: Anime) => {
            try {
                const parentStory = (await fetchWithRetry(`https://api.jikan.moe/v4/anime/${animeForLookup.id}/relations`).then(res => res.ok ? res.json() : { data: [] })).data?.find((r: any) => r.relation === 'Parent story')?.entry[0];
                const baseAnimeForTmdb = parentStory ? { title: parentStory.name, year: null } : { title: animeForLookup.title, year: animeForLookup.releaseYear };

                let foundTmdbId: number | null = null;
                let foundMediaType: 'tv' | 'movie' | null = animeForLookup.type === 'Movie' ? 'movie' : 'tv';

                if (baseAnimeForTmdb.title) {
                    const searchMediaType = animeForLookup.type === 'Movie' ? 'movie' : 'tv';
                    const searchParams = new URLSearchParams({ api_key: TMDB_API_KEY, query: baseAnimeForTmdb.title.replace(/(season|part)\s\d+/i, '').trim() });
                    if (baseAnimeForTmdb.year) {
                        if (searchMediaType === 'tv') searchParams.append('first_air_date_year', baseAnimeForTmdb.year.toString());
                        else searchParams.append('year', baseAnimeForTmdb.year.toString());
                    }
                    const searchRes = await fetchWithRetry(`https://api.themoviedb.org/3/search/${searchMediaType}?${searchParams.toString()}`);
                    if (searchRes.ok) {
                        const searchData = await searchRes.json();
                        if (searchData.results.length > 0) {
                            foundTmdbId = searchData.results[0].id;
                            foundMediaType = searchMediaType;
                        }
                    }
                }

                if (foundTmdbId && foundMediaType) {
                    setMediaIds({ tmdb: foundTmdbId, mediaType: foundMediaType, imdb: null });
                    const tmdbDetailsRes = await fetchWithRetry(`https://api.themoviedb.org/3/${foundMediaType}/${foundTmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,videos`);
                    if (tmdbDetailsRes.ok) {
                        const tmdbData = await tmdbDetailsRes.json();
                        setMediaIds(prev => ({ ...prev, imdb: tmdbData.external_ids?.imdb_id || null }));
                         setPlayerAnime(prev => ({ ...prev, bannerImage: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : prev.bannerImage, isAdult: prev.isAdult || tmdbData.adult, runtime: tmdbData.runtime || prev.runtime }));

                        if (foundMediaType === 'tv' && tmdbData.seasons) {
                            const validSeasons: Season[] = tmdbData.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0).map((s:any): Season => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name, poster_path: s.poster_path }));
                            setSeasons(validSeasons);

                            const sessionState = JSON.parse(sessionStorage.getItem(`anistream-player-state-${animeForLookup.id}`) || 'null');
                            const seasonFromTitle = parseSeasonFromTitle(animeForLookup.title);
                            const savedProgress = getWatchProgress(animeForLookup.id);

                            let seasonToSet = sessionState?.season || seasonFromTitle || savedProgress?.currentSeason || (validSeasons[0] ? [...validSeasons].sort((a,b)=>a.season_number-b.season_number)[0].season_number : 1);
                            let episodeToSet = savedProgress?.currentSeason === seasonToSet ? savedProgress.currentEpisode : (sessionState?.season === seasonToSet ? sessionState.episode : 1);
                            
                            setCurrentSeason(seasonToSet);
                            setCurrentEpisode(episodeToSet);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch player-critical data (TMDB)", e);
            }
        };

        const fetchSupplementaryData = async (baseAnime: Anime) => {
            setIsLoadingTrailers(true);
            setIsLoadingCharacters(true);
            
            const [relationsPromise, anilistPromise, charactersRes, videosRes, jikanRecsPromise] = await Promise.allSettled([
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/relations`).then(res => res.json()),
                fetchAniListDetails(baseAnime.id),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/characters`),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/videos`),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/recommendations`).then(res => res.json()),
            ]);

            let finalAnime = { ...baseAnime };

            // Enrich with AniList data
            if (anilistPromise.status === 'fulfilled' && anilistPromise.value) {
                const ad = anilistPromise.value.details;
                finalAnime = { ...finalAnime, title: ad.title.english || ad.title.romaji || finalAnime.title, title_english: ad.title.english || finalAnime.title_english, title_japanese: ad.title.native || finalAnime.title_japanese, bannerImage: ad.bannerImage || finalAnime.bannerImage, synopsis: ad.description || finalAnime.synopsis, genres: ad.genres.length > 0 ? ad.genres : finalAnime.genres, rating: ad.averageScore ? ad.averageScore / 10 : finalAnime.rating, studio: ad.studios.length > 0 ? ad.studios.join(', ') : finalAnime.studio };
                if (ad.nextAiringEpisode) {
                    setNextAiringInfo({ at: ad.nextAiringEpisode.airingAt * 1000, episode: ad.nextAiringEpisode.episode });
                }
                setRecommendations(anilistPromise.value.recommendations.map((p: any) => mapPartialToFullAnime(p as any)));
            } else if (finalAnime.nextAiringEpisode) {
                setNextAiringInfo(finalAnime.nextAiringEpisode);
            }

            setPlayerAnime(finalAnime);
            setSeriesParts([finalAnime]);
            
            // Process Relations, Characters, Videos, etc.
            if (relationsPromise.status === 'fulfilled' && relationsPromise.value.data) { /* ... */ }
            if (charactersRes.status === 'fulfilled' && charactersRes.value.ok) { /* ... */ }
            if (videosRes.status === 'fulfilled' && videosRes.value.ok) { /* ... */ }
            if (jikanRecsPromise.status === 'fulfilled' && jikanRecsPromise.value.data) { /* ... */ }
            
            setIsLoadingTrailers(false);
            setIsLoadingCharacters(false);
        };
        
        fetchAllDetails();
  }, [anime.id, isEmbed, getWatchProgress, settings]);


  useEffect(() => {
    if (playerAnime) {
        const seasonInfo = seasons.find(s => s.season_number === currentSeason);
        const baseTitle = getDisplayTitle(playerAnime, settings);
        if (seasonInfo && seasons.length > 1 && mediaIds.mediaType === 'tv') setDisplayTitle(`${baseTitle}: ${seasonInfo.name}`);
        else setDisplayTitle(baseTitle || '');
    }
  }, [playerAnime, currentSeason, seasons, mediaIds.mediaType, settings]);

  useEffect(() => {
    const syncAnilist = async () => {
        if (!playerAnime || !settings.autoSyncAniList || !settings.anilistToken || mediaIds.mediaType !== 'tv') return;
        const seasonInfo = seasons.find(s => s.season_number === currentSeason);
        if (!seasonInfo || !playerAnime.totalEpisodes) return;
        const episodesInPrevSeasons = seasons.filter(s => s.season_number < currentSeason).reduce((acc, s) => acc + s.episode_count, 0);
        const overallEpisodeNumber = episodesInPrevSeasons + currentEpisode;
        try {
            await updateAnilistEntry(playerAnime.id, settings.anilistToken, { progress: overallEpisodeNumber });
        } catch (error) {
            console.error("Failed to sync progress with AniList:", error);
        }
    };
    syncAnilist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode, currentSeason, playerAnime]);

  useEffect(() => {
      if (playerAnime?.id && mediaIds.mediaType === 'tv') {
          sessionStorage.setItem(`anistream-player-state-${playerAnime.id}`, JSON.stringify({ season: currentSeason, episode: currentEpisode }));
      }
  }, [currentSeason, currentEpisode, playerAnime, mediaIds.mediaType]);

  const fetchSeasonEpisodes = useCallback(async () => {
    if (mediaIds.mediaType !== 'tv' || !mediaIds.tmdb || !currentSeason) return;
    setIsLoadingEpisodes(true);
    setEpisodeError(null);
    try {
        const res = await fetchWithRetry(`https://api.themoviedb.org/3/tv/${mediaIds.tmdb}/season/${currentSeason}?api_key=${TMDB_API_KEY}`);
        if (!res.ok) throw new Error(`Failed to fetch episode data (Status: ${res.status}).`);
        const data = await res.json();
        setEpisodes(data.episodes?.map((ep: any) => ({
            ...ep,
            episode_number: ep.episode_number, name: ep.name, still_path: ep.still_path, runtime: ep.runtime, air_date: ep.air_date
        })) || []);
    } catch (e) {
        console.error(e);
        setEpisodes([]);
        setEpisodeError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
        setIsLoadingEpisodes(false);
        setIsSeasonTransitioning(false);
    }
  }, [mediaIds.mediaType, mediaIds.tmdb, currentSeason]);

  useEffect(() => {
    if (mediaIds.mediaType === 'tv' && mediaIds.tmdb && currentSeason) {
        setEpisodePage(1);
        fetchSeasonEpisodes();
    } else {
        setEpisodes([]);
        if (!isLoading) setIsSeasonTransitioning(false);
    }
  }, [fetchSeasonEpisodes, mediaIds.mediaType, mediaIds.tmdb, currentSeason, isLoading]);
  
  const showEpisodesTab = useMemo(() => mediaIds.mediaType === 'tv' && seasons.length > 0, [mediaIds.mediaType, seasons]);
  const showTrailersTab = useMemo(() => true, []);
  const showCharactersTab = useMemo(() => true, []);

  const filteredAndSortedEpisodes = useMemo(() => {
    let episodesToShow = [...episodes];

    if (playerAnime?.id === 20 && settings.hideFillerEpisodes) {
        episodesToShow = episodesToShow.filter(ep => !NARUTO_FILLER_EPISODES.includes(ep.episode_number));
    }

    if (episodeSearchQuery) {
        const query = episodeSearchQuery.toLowerCase();
        episodesToShow = episodesToShow.filter(ep =>
            ep.episode_number.toString().includes(query) ||
            ep.name.toLowerCase().includes(query)
        );
    }
    return episodesToShow;
  }, [episodes, playerAnime?.id, settings.hideFillerEpisodes, episodeSearchQuery]);


  const totalEpisodePages = useMemo(() => Math.ceil(filteredAndSortedEpisodes.length / EPISODES_PER_PAGE), [filteredAndSortedEpisodes]);
  const paginatedEpisodes = useMemo(() => {
      if (filteredAndSortedEpisodes.length <= EPISODES_PER_PAGE) return filteredAndSortedEpisodes;
      const start = (episodePage - 1) * EPISODES_PER_PAGE;
      return filteredAndSortedEpisodes.slice(start, start + EPISODES_PER_PAGE);
  }, [filteredAndSortedEpisodes, episodePage]);

  useEffect(() => {
    if (!isLoading) {
        if (showEpisodesTab) setActiveTab('episodes');
        else if (showCharactersTab) setActiveTab('characters');
        else if (showTrailersTab) setActiveTab('trailers');
    }
  }, [isLoading, showEpisodesTab, showTrailersTab, showCharactersTab]);

  useLayoutEffect(() => {
    if (activeTab !== 'episodes' || isPageTransitioning || isSeasonTransitioning || isNavigatingWithArrows.current) {
        isNavigatingWithArrows.current = false;
        return;
    }
    const timer = setTimeout(() => {
        const episodeElement = episodeRefs.current.get(currentEpisode);
        if (episodeElement) episodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 400);
    return () => clearTimeout(timer);
  }, [currentEpisode, activeTab, isPageTransitioning, isSeasonTransitioning, paginatedEpisodes]);
  
  const handleShareWithFriend = (friend: User) => {
    if (!user || !playerAnime) return;
    addNotification({
        type: 'share',
        text: `shared ${getDisplayTitle(playerAnime, settings)} with you.`,
        relatedUser: user,
        animeId: playerAnime.id,
    }, friend.username);
    setIsShareModalOpen(false);
  };

  const handleSurpriseFact = async () => {
    if (!playerAnime) return;
    setIsSurpriseLoading(true);
    setSurpriseError(null);
    setSurpriseMessage(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Tell me a surprising, obscure, or hidden fact about the anime titled "${getDisplayTitle(playerAnime, settings)}". Make it fun and concise (under 200 characters).`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setSurpriseMessage(response.text);
    } catch (e) {
        console.error("Gemini API call failed", e);
        setSurpriseError("Oops! Couldn't generate a surprise right now. Please try again later.");
    } finally {
        setIsSurpriseLoading(false);
    }
  };

  const closeSurprise = () => {
    setSurpriseMessage(null);
    setSurpriseError(null);
  };

  // FIX: The Artplayer types seem to be incorrect/outdated.
  // 'el' is a valid property, and 'fullscreen' is a boolean, not an object with 'toggle'.
  const handleFocusToggle = useCallback(() => {
      const playerEl = (artplayerInstance.current as any)?.el;
      if (!playerEl) return;
      if (settings.playerFocusMode === 'fullscreen') {
          if (artplayerInstance.current) {
            artplayerInstance.current.fullscreen = !artplayerInstance.current.fullscreen;
          }
      } else {
          setIsFocusMode(prev => !prev);
      }
  }, [settings.playerFocusMode]);

    useLayoutEffect(() => {
        const playerEl = playerNodeWrapperRef.current;
        if (!playerEl) return;

        if (isFocusMode && overlaySlotRef.current) {
            // Store original position if it's not already stored
            if (!originalDOMInfo) {
                setOriginalDOMInfo({ 
                    parent: playerEl.parentElement as HTMLElement, 
                    nextSibling: playerEl.nextSibling 
                });
            }
            overlaySlotRef.current.appendChild(playerEl);
            document.body.classList.add('player-focused-mode');
        } else if (!isFocusMode && originalDOMInfo) {
            // Move player back to its original position
            originalDOMInfo.parent.insertBefore(playerEl, originalDOMInfo.nextSibling);
            document.body.classList.remove('player-focused-mode');
            setOriginalDOMInfo(null); // Clear stored info
        }
    }, [isFocusMode, originalDOMInfo]);

    // Effect for handling closing the focus overlay
    useEffect(() => {
        if (!isFocusMode) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFocusMode(false);
        };

        let touchStartY: number | null = null;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches?.[0]?.clientY ?? null;
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartY) return;
            const dy = (e.touches?.[0]?.clientY ?? 0) - touchStartY;
            if (dy > 120) { // Swipe down threshold
                setIsFocusMode(false);
                touchStartY = null;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.body.classList.remove('player-focused-mode');
        };
    }, [isFocusMode]);

  // Artplayer initialization and shortcut handling
  useEffect(() => {
    if (artplayerRef.current && !artplayerInstance.current) {
        const preloadMap = {
            eager: 'auto',
            visible: 'metadata',
            idle: 'metadata'
        };

        // FIX: Cast options to 'any' to bypass incorrect type definitions for properties like 'title'.
        const art = new Artplayer({
            container: artplayerRef.current,
            url: '', // Start with an empty URL
            title: displayTitle,
            poster: playerAnime?.bannerImage,
            volume: 0.7,
            isLive: false,
            muted: settings.startMuted,
            autoplay: settings.autoPlay,
            playsinline: true,
            pip: true,
            autoSize: true,
            autoMini: false,
            screenshot: true,
            setting: true,
            loop: false,
            flip: true,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: true,
            subtitleOffset: true,
            miniProgressBar: true,
            airplay: true,
            theme: 'rgb(var(--color-primary))',
            lang: navigator.language.toLowerCase(),
            hotkey: false, // Disable default hotkeys to use our own global system
            preload: preloadMap[settings.videoLoadStrategy],
             controls: [
                {
                    name: 'download',
                    position: 'right',
                    html: `<svg class="w-6 h-6" style="margin-left: 10px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>`,
                    tooltip: 'Download',
                    click: function () {
                         document.dispatchEvent(new CustomEvent('open-download-modal'));
                    }
                }
            ],
        } as any);

        artplayerInstance.current = art;
        if(onPlayerReady) onPlayerReady(art);
        
        const handleOrientation = () => {
            // FIX: Cast 'art' to 'any' to access 'isMobile' which may be missing from types.
            if ((art as any).isMobile) {
                if (art.fullscreen || art.fullscreenWeb) {
                    (screen.orientation as any).lock('landscape').catch(() => {});
                } else {
                    (screen.orientation as any).unlock();
                }
            }
        };

        art.on('fullscreen', handleOrientation);
        art.on('fullscreenWeb', handleOrientation);
        art.on('pip:enter', () => setIsInPiPMode(true));
        art.on('pip:exit', () => setIsInPiPMode(false));

        art.on('ready', () => {
             const savedProgress = getWatchProgress(anime.id);
             if (savedProgress && savedProgress.currentSeason === currentSeason && savedProgress.currentEpisode === currentEpisode) {
                const seekTime = (savedProgress.progress / 100) * art.duration;
                if(seekTime > 5) art.seek = seekTime;
             }
        });
        
        art.on('video:timeupdate', () => {
            if(art.duration > 0) {
                const progress = (art.currentTime / art.duration) * 100;
                updateProgress(anime.id, currentSeason, currentEpisode, progress);

                // AutoSkip logic
                if (settings.autoSkip) {
                    // Example: skip intro (0-85s) and outro (last 90s)
                    const introEndTime = 85;
                    const outroStartTime = art.duration - 90;
                    if (art.currentTime > 5 && art.currentTime < introEndTime) {
                        art.seek = introEndTime;
                    }
                    if (art.currentTime > outroStartTime && art.duration > 120) {
                        art.seek = art.duration;
                    }
                }
            }
        });

        art.on('video:ended', () => {
            if (settings.autoPlay) {
                handleNextEpisode();
            }
        });

        return () => {
            art.off('pip:enter', () => setIsInPiPMode(true));
            art.off('pip:exit', () => setIsInPiPMode(false));
            // FIX: Cast 'art' to 'any' to access 'isMobile' which may be missing from types.
            if ((art as any).isMobile) {
                try {
                    (screen.orientation as any).unlock();
                } catch (e) {
                    console.warn('Could not unlock screen orientation on cleanup.', e);
                }
            }
            art.destroy(true);
            artplayerInstance.current = null;
        };
    }
  }, [anime.id, playerAnime?.bannerImage, displayTitle, getWatchProgress, currentSeason, currentEpisode, updateProgress, settings.autoPlay, onPlayerReady, settings.startMuted, settings.videoLoadStrategy, settings.autoSkip]);
  
  const handleNextEpisode = useCallback(() => {
    if (mediaIds.mediaType !== 'tv' || !playerAnime) return;
    isNavigatingWithArrows.current = true;
    const currentSeasonData = sortedSeasons.find(s => s.season_number === currentSeason);
    if (!currentSeasonData) return;
    if (currentEpisode < currentSeasonData.episode_count) {
        selectEpisode(currentEpisode + 1);
    } else {
        const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === currentSeason);
        if (currentSeasonIndex < sortedSeasons.length - 1) {
            const nextSeason = sortedSeasons[currentSeasonIndex + 1];
            selectSeason(nextSeason.season_number);
        }
    }
  }, [currentEpisode, currentSeason, mediaIds.mediaType, playerAnime, selectEpisode, selectSeason, sortedSeasons]);

  const handlePrevEpisode = useCallback(() => {
    if (mediaIds.mediaType !== 'tv' || !playerAnime) return;
    isNavigatingWithArrows.current = true;
    if (currentEpisode > 1) {
        selectEpisode(currentEpisode - 1);
    } else {
        const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === currentSeason);
        if (currentSeasonIndex > 0) {
            const prevSeason = sortedSeasons[currentSeasonIndex - 1];
            selectSeason(prevSeason.season_number, prevSeason.episode_count);
        }
    }
  }, [currentEpisode, currentSeason, mediaIds.mediaType, playerAnime, selectEpisode, selectSeason, sortedSeasons]);

  useEffect(() => {
    const art = artplayerInstance.current;
    if (art && videoUrl) {
      art.switchUrl(videoUrl).then(() => {
        if (settings.autoPlay) {
          art.play().catch(console.error);
        }
      });
    }
  }, [videoUrl, settings.autoPlay]);


  useEffect(() => {
    const art = artplayerInstance.current;
    if (!art) return;

    const shortcuts: { [key: string]: () => void } = {
        togglePlay: () => art.toggle(),
        seekBackward: () => art.backward = art.currentTime - 10,
        seekForward: () => art.forward = art.currentTime + 10,
        volumeUp: () => art.volume += 0.1,
        volumeDown: () => art.volume -= 0.1,
        // FIX: The correct way to toggle fullscreen is by setting the boolean property.
        fullscreen: () => art.fullscreen = !art.fullscreen,
        mute: () => art.muted = !art.muted,
        skip: () => art.forward = art.currentTime + 85, // Skip 85s for openings
        nextEpisode: handleNextEpisode,
        previousEpisode: handlePrevEpisode,
        focusPlayer: handleFocusToggle,
    };

    const eventListeners: { [key: string]: EventListener } = {};
    
    Object.entries(shortcuts).forEach(([action, handler]) => {
        const eventName = `shortcut:${action}`;
        const listener = handler as EventListener;
        eventListeners[eventName] = listener;
        document.addEventListener(eventName, listener);
    });

    return () => {
        Object.entries(eventListeners).forEach(([eventName, listener]) => {
            document.removeEventListener(eventName, listener);
        });
    };
  }, [handleNextEpisode, handlePrevEpisode, handleFocusToggle]);


  const headerEpisodeText = mediaIds.mediaType === 'tv' ? `S${currentSeason} E${currentEpisode}` : (playerAnime?.totalEpisodes ?? 0) > 1 ? `Episode ${currentEpisode}` : 'Movie';

  const modalRoot = document.getElementById('modal-root');
  
  const embedUrl = useMemo(() => {
    if (!playerAnime) return '';
    const baseUrl = window.location.origin + '/';
    return `${baseUrl}?embed=true&animeId=${playerAnime.id}&autoplay=1&theme=${settings.theme}`;
  }, [playerAnime, settings.theme]);

    const currentEpisodeDetails = useMemo(() => {
        return episodes.find(ep => ep.episode_number === currentEpisode);
    }, [episodes, currentEpisode]);

  const SeasonNavigator = () => {
    const useTmdbSeasons = seasons.length > 0;
    const useJikanSeriesParts = !useTmdbSeasons && seriesParts.length > 1;

    type NavItem = { id: string | number; isActive: boolean; name: string; imageUrl: string; episodeCount?: number; onClick: () => void; };
    let items: NavItem[] = [];

    if (useTmdbSeasons) {
        items = [...seasons].sort((a, b) => a.season_number - b.season_number).map(s => ({
            id: s.season_number, isActive: s.season_number === currentSeason, name: s.name || `Season ${s.season_number}`, imageUrl: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '', episodeCount: s.episode_count, onClick: () => selectSeason(s.season_number)
        }));
    } else if (useJikanSeriesParts) {
        items = seriesParts.map(p => {
            const isCurrentAnime = p.id === playerAnime?.id;
            let finalImageUrl = p.thumbnail || '';
            if (!isCurrentAnime && playerAnime?.thumbnail && finalImageUrl === playerAnime.thumbnail) finalImageUrl = '';
            return {
                id: p.id!, isActive: p.id === playerAnime?.id, name: p.title!, imageUrl: finalImageUrl,
                onClick: () => {
                    if (p.id !== playerAnime?.id) {
                        onSelectRelated({ id: p.id!, title: p.title || 'N/A', type: p.type || 'TV', thumbnail: p.thumbnail || '', bannerImage: '', synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, studio: '', hasSub: true, hasDub: false, runtime: null, isAdult: false, avgEpisodeDuration: null, title_english: null, title_japanese: '', seasons_count: null, episodes_count: null });
                    }
                }
            }
        });
    }

    if (items.length <= 1) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">{useTmdbSeasons ? 'Seasons' : 'Series'}</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {items.map(item => {
                    const hasFailed = failedImages.has(item.id);
                    return (
                        <button key={item.id} onClick={item.onClick} disabled={isWatchTogetherSession && !isHost} className={`flex-shrink-0 w-40 text-left rounded-xl group transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-1))] ${item.isActive ? 'ring-[rgb(var(--color-primary-accent))]' : 'ring-transparent'} disabled:cursor-not-allowed`}>
                            <div className="aspect-[2/3] w-full relative">
                                {item.imageUrl && !hasFailed ? (
                                    <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${!item.isActive ? 'opacity-70 group-hover:opacity-100' : ''}`} onError={() => setFailedImages(prev => new Set(prev).add(item.id))} />
                                 ) : (
                                    <div className="w-full h-full bg-[rgb(var(--surface-3))] flex items-center justify-center p-2 text-center"><span className="text-xs text-[rgb(var(--text-secondary))]">{item.name}</span></div>
                                 )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                {item.episodeCount && <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-sm">{item.episodeCount} EP</span>}
                            </div>
                            <div className="p-2 bg-[rgb(var(--surface-2))]"><p className={`font-semibold text-sm truncate transition-colors ${item.isActive ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--color-primary-accent))]'}`}>{item.name}</p></div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
  };

  const RelatedMovies = () => {
    if (relatedMovies.length === 0 || playerAnime?.type === 'Movie') return null;
    return (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Related Movies</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
                {relatedMovies.map(movie => (
                    <div key={movie.id} className="flex-shrink-0 w-32 sm:w-36">
                        <AnimeCard anime={movie} onSelect={onSelectRelated} />
                    </div>
                ))}
            </div>
        </div>
    );
  };

    const YouTubeTrailerPlayer: React.FC<{ videoId: string; title: string; fallbackThumbnail: string; }> = ({ videoId, title, fallbackThumbnail }) => {
        const playerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (!videoId || !playerRef.current) return;
            
            let player: any = null;
            const playerElement = playerRef.current; // Capture ref value

            const getValidOrigin = (): string | undefined => {
                if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                    return window.location.origin;
                }
                if (window.location.protocol === 'blob:') {
                    const match = window.location.href.match(/^blob:(https?:\/\/[^/]+)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
                return undefined;
            };

            const initializePlayer = async () => {
                try {
                    await loadYouTubeAPI();
                    
                    if (!playerElement) return;

                    const onError = (event: any) => {
                        const payload = {
                            timestamp: new Date().toISOString(),
                            videoId,
                            pageUrl: window.location.href,
                            userAgent: navigator.userAgent,
                            playerError: event.data,
                            location: 'PlayerTrailers'
                        };
                        console.error('YouTube Player Error Report:', payload);

                        if (playerElement) {
                            playerElement.innerHTML = `
                                <div class="w-full h-full bg-black text-white relative">
                                    <img src="${fallbackThumbnail}" alt="Trailer thumbnail" class="w-full h-full object-cover opacity-30" />
                                    <div class="absolute inset-0 flex flex-col items-center justify-center p-2 text-xs text-center gap-1">
                                        <p class="font-bold text-red-400">Error loading trailer (Code: ${event.data})</p>
                                        <p class="text-gray-300">This video may be private or region-restricted.</p>
                                    </div>
                                </div>`;
                        }
                    };
                    
                    const playerVars: any = {
                        autoplay: 1,
                        mute: 1,
                        playsinline: 1,
                    };

                    const origin = getValidOrigin();
                    if (origin) {
                        playerVars.origin = origin;
                    }

                    player = new window.YT.Player(playerElement, {
                        videoId: videoId,
                        playerVars: playerVars,
                        events: { 
                            onReady: (event: any) => {
                                event.target.mute();
                                event.target.playVideo();
                            },
                            onError: onError 
                        }
                    });
                } catch (error) {
                    console.error("Failed to initialize YouTube trailer player:", error);
                }
            };
            
            initializePlayer();

            return () => {
                player?.destroy();
            };
        }, [videoId, title, fallbackThumbnail]);

        return <div ref={playerRef} className="w-full h-full"></div>;
    };

  const EpisodeListContent = ({ episodesToShow, isBlurred, view }: { episodesToShow: Episode[], isBlurred: boolean, view: EpisodeViewStyle }) => {
    if (isLoadingEpisodes) return <p className="text-[rgb(var(--text-muted))]">Loading episodes...</p>;
    if (episodesToShow.length === 0) {
        if (episodeSearchQuery) return <p className="text-[rgb(var(--text-muted))]">No episodes match your search.</p>;
        return <p className="text-[rgb(var(--text-muted))]">No episode information available.</p>;
    }
    const setEpisodeRef = (epNum: number) => (el: HTMLButtonElement | null) => { if (el) episodeRefs.current.set(epNum, el); else episodeRefs.current.delete(epNum); };
    
    if (view === 'compact') {
        return <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>{episodesToShow.map(ep => {
            const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
            return (
                <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`flex items-center gap-3 w-full text-left p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-[rgb(var(--surface-3))/0.5] ${currentEpisode === ep.episode_number ? 'bg-[rgb(var(--color-primary))/0.3]' : ''} disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <div className="relative flex-shrink-0 w-24 aspect-video bg-[rgb(var(--surface-3))] rounded-lg overflow-hidden">
                        <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : playerAnime.bannerImage} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                        {ep.runtime && <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{formatDuration(ep.runtime)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${currentEpisode === ep.episode_number ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))]'}`}>
                            Episode {ep.episode_number}
                            {isFiller && <span className="text-xs font-bold text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded-sm ml-2">FILLER</span>}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))] truncate">{ep.name}</p>
                        {ep.air_date && <p className="text-[10px] text-[rgb(var(--text-muted))]">{new Date(ep.air_date).toLocaleDateString()}</p>}
                    </div>
                </button>
            )
        })}</div>;
    }

    if (view === 'grid') {
        return <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">{episodesToShow.map(ep => {
            const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
            return (
                <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`relative aspect-video w-full text-left rounded-xl group transition-all duration-300 overflow-hidden hover:scale-105 ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--color-primary-accent))]' : ''} disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : playerAnime.bannerImage} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">E{ep.episode_number}</span>
                    {isFiller && <span className="absolute top-1 right-1 text-xs font-bold text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded-sm">F</span>}
                </button>
            )
        })}</div>;
    }
    
    // Default to 'horizontal'
    return <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">{episodesToShow.map(ep => {
         const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
        return (
            <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`flex-shrink-0 w-36 sm:w-40 text-left rounded-xl group transition-all duration-300 overflow-hidden hover:scale-105 ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--color-primary-accent))]' : ''} disabled:opacity-70 disabled:cursor-not-allowed`}>
                <div className="aspect-video w-full bg-[rgb(var(--surface-3))]">
                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : playerAnime.bannerImage} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                </div>
                <div className="p-2">
                    <p className={`font-semibold text-xs truncate ${currentEpisode === ep.episode_number ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))]'}`}>
                        Ep {ep.episode_number}
                        {isFiller && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-1 py-0 rounded-sm ml-1">FILLER</span>}
                    </p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">{ep.name}</p>
                </div>
            </button>
        )
    })}</div>
  };
  
  if (isLoading || !playerAnime) {
      return (
          <div className="w-full h-screen bg-[rgb(var(--surface-1))] flex flex-col items-center justify-center gap-4 text-center p-4">
              <div className="w-16 h-16 border-4 border-[rgb(var(--surface-3))] border-t-[rgb(var(--color-primary))] rounded-full animate-spin"></div>
              <p className="font-semibold text-lg text-[rgb(var(--text-primary))]">Preparing your stream...</p>
              {loadingFact && <p className="text-sm text-[rgb(var(--text-muted))] max-w-sm">{loadingFact}</p>}
          </div>
      );
  }

  const Breadcrumbs = () => {
    if (!breadcrumbsData) return null;

    const path = [];
    const sourceName = breadcrumbsData.source || 'Home';
    path.push(
        <button key="source" onClick={onGoBack} className="hover:text-[rgb(var(--color-primary-accent))] transition-colors">
            {sourceName}
        </button>
    );

    if (playerAnime.type) {
        path.push(<span key="sep1" className="mx-2">/</span>);
        path.push(<span key="type" className="opacity-70">{playerAnime.type}</span>);
    }
    
    path.push(<span key="sep2" className="mx-2">/</span>);
    path.push(<span key="title" className="font-semibold text-[rgb(var(--text-primary))] truncate">{displayTitle}</span>);

    return <nav className="flex items-center text-sm text-[rgb(var(--text-muted))]">{path}</nav>
  };

  return (
    <div className="animate-subtle-fade-in-up">
        {/* Modal Portals */}
        {modalRoot && isEmbedModalOpen && ReactDOM.createPortal(<EmbedModal animeId={playerAnime.id} onClose={() => setIsEmbedModalOpen(false)} />, modalRoot)}
        {modalRoot && isShareModalOpen && ReactDOM.createPortal(<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={() => setIsShareModalOpen(false)}><div className="bg-[rgb(var(--surface-2))] p-6 rounded-2xl w-96" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Share with a friend</h3><div className="space-y-2">{friends.map(f => <button key={f.uid} onClick={() => handleShareWithFriend(f)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgb(var(--surface-3))] text-left"><img src={f.avatar} alt={f.username} className="w-8 h-8 rounded-full"/>{f.username}</button>)}</div></div></div>, modalRoot)}
        {modalRoot && isClippingModalOpen && ReactDOM.createPortal(<ClippingModal onClose={() => setIsClippingModalOpen(false)} />, modalRoot)}
        {modalRoot && isInviteFriendModalOpen && ReactDOM.createPortal(<InviteFriendModal anime={playerAnime} onClose={() => setIsInviteFriendModalOpen(false)} />, modalRoot)}
        {modalRoot && isRoomManagerOpen && ReactDOM.createPortal(<RoomManagerModal anime={playerAnime} currentSeason={currentSeason} currentEpisode={currentEpisode} onClose={() => setIsRoomManagerOpen(false)} onEnterRoom={onEnterRoom} />, modalRoot)}
        {modalRoot && isDownloadModalOpen && ReactDOM.createPortal(<DownloadModal anime={playerAnime} episodes={episodes} season={currentSeason} onClose={() => setIsDownloadModalOpen(false)} />, modalRoot)}
        {modalRoot && selectedCharacter && ReactDOM.createPortal(<CharacterModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />, modalRoot)}

      <div className="relative aspect-video w-full max-h-[90vh] bg-black shadow-lg shadow-black/50 overflow-hidden" ref={playerNodeWrapperRef}>
        <div ref={artplayerRef} className="w-full h-full"></div>
        {streamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black">
                {playerAnime?.bannerImage && (
                    <img src={playerAnime.bannerImage} alt={getDisplayTitle(playerAnime, settings)} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <div className="relative z-10">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4 mx-auto" />
                    <h3 className="text-xl font-bold text-red-400">Failed to Load Video</h3>
                    <p className="text-sm text-[rgb(var(--text-muted))] max-w-md mt-2">{streamError}</p>
                    <button onClick={fetchStreamUrl} disabled={isStreamLoading} className="mt-6 px-4 py-2 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50">
                        {isStreamLoading ? 'Retrying...' : 'Retry'}
                    </button>
                </div>
            </div>
        )}
        {isStreamLoading && !streamError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/50 backdrop-blur-sm">
                {playerAnime?.bannerImage && (
                    <img src={playerAnime.bannerImage} alt={getDisplayTitle(playerAnime, settings)} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                )}
                <div className="relative z-10">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 font-semibold">Fetching video source...</p>
                </div>
             </div>
        )}
      </div>

      <div className="player-focus-overlay" aria-hidden={!isFocusMode} onClick={() => setIsFocusMode(false)}>
        <div className="player-focus-overlay-backdrop"></div>
        <div className="player-focus-overlay-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsFocusMode(false)} className="player-focus-overlay-close" aria-label="Close focused player"><CloseIcon className="w-5 h-5"/></button>
            <div className="player-focus-overlay-slot" ref={overlaySlotRef}></div>
        </div>
      </div>
      
    {/* Page content */}
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

        {!isEmbed && (
             <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div>
                   <Breadcrumbs />
                   <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mt-2">{displayTitle}</h1>
                   <div className="flex items-center gap-3 text-sm text-[rgb(var(--text-muted))] mt-1">
                       <span>{headerEpisodeText}</span>
                       {averageRuntime && <span>&bull; {formatDuration(averageRuntime)}</span>}
                   </div>
                    {nextAiringInfo && (
                        <div className="mt-2 text-sm text-green-400 font-semibold">
                            Next Episode {nextAiringInfo.episode} airs {formatAiringTime(nextAiringInfo.at)}
                        </div>
                    )}
                </div>
                {!isWatchTogetherSession && (
                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <button onClick={handlePrevEpisode} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><ChevronLeftIcon /></button>
                        <button onClick={handleNextEpisode} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><ChevronRightIcon /></button>
                    </div>
                )}
            </div>
        )}
            
            {!isEmbed && <PlayerActions anime={playerAnime} onClip={() => setIsClippingModalOpen(true)}/>}

            {!isEmbed && currentEpisodeDetails?.name && (
                <div className="mt-6 bg-[rgb(var(--surface-2))/0.6] p-4 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-lg mb-2 text-[rgb(var(--color-primary-accent))]">Episode {currentEpisodeDetails.episode_number}: {currentEpisodeDetails.name}</h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))] max-h-24 overflow-y-auto pr-2">{currentEpisodeDetails.overview || 'No synopsis available for this episode.'}</p>
                </div>
            )}
            
            {/* Surprise Fact */}
            {(surpriseMessage || surpriseError) && (
                 <div className="relative mt-6 p-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl rounded-2xl border border-white/10">
                    <button onClick={closeSurprise} className="absolute top-2 right-2 text-[rgb(var(--text-muted))] hover:text-white"><CloseIcon className="w-4 h-4" /></button>
                    <div className="flex items-start gap-3">
                        <SparklesIcon className="w-5 h-5 text-[rgb(var(--color-secondary-accent))] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[rgb(var(--text-secondary))]">{surpriseMessage || surpriseError}</p>
                    </div>
                 </div>
            )}
        
        {!isEmbed && (
            <>
            <div className="mt-8">
                <SeasonNavigator/>

                <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl">
                     <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <div className="flex items-center gap-2 border-b border-white/10 sm:border-b-0 self-stretch sm:self-center">
                            {showEpisodesTab && <button onClick={() => setActiveTab('episodes')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'episodes' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Episodes</button>}
                            {showCharactersTab && <button onClick={() => setActiveTab('characters')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'characters' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Characters</button>}
                            {showTrailersTab && <button onClick={() => setActiveTab('trailers')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'trailers' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Trailers</button>}
                        </div>
                        {activeTab === 'episodes' && (
                             <div className="flex items-center gap-2">
                                <button onClick={() => setLocalEpisodeViewStyle('compact')} className={`p-2 rounded-lg ${localEpisodeViewStyle === 'compact' ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10'}`}><ViewListIcon/></button>
                                <button onClick={() => setLocalEpisodeViewStyle('grid')} className={`p-2 rounded-lg ${localEpisodeViewStyle === 'grid' ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10'}`}><ViewGridIcon/></button>
                                <button onClick={() => setLocalEpisodeViewStyle('horizontal')} className={`p-2 rounded-lg ${localEpisodeViewStyle === 'horizontal' ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10'}`}><ViewCarouselIcon/></button>
                                <button onClick={() => setLocalBlur(p => p === null ? !settings.blurEpisodeThumbnails : !p)} className={`p-2 rounded-lg ${isBlurred ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10'}`}>
                                    {isBlurred ? <EyeOffIcon/> : <EyeIcon/>}
                                </button>
                                <button onClick={() => updateSettings({ hideFillerEpisodes: !settings.hideFillerEpisodes })} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${settings.hideFillerEpisodes ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10 text-[rgb(var(--text-secondary))]'}`}>
                                    {settings.hideFillerEpisodes ? 'Show Fillers' : 'Hide Fillers'}
                                </button>
                             </div>
                        )}
                    </div>

                    {activeTab === 'episodes' && (
                        <>
                            {filteredAndSortedEpisodes.length > 20 && (
                                <div className="relative mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon className="w-4 h-4"/></div>
                                    <input type="text" value={episodeSearchQuery} onChange={e => setEpisodeSearchQuery(e.target.value)} placeholder="Search episodes..." className="w-full bg-[rgb(var(--surface-3))] border border-[rgb(var(--border-color))] rounded-lg py-2 pl-9 pr-3 text-sm" />
                                </div>
                            )}
                            <div className={`transition-opacity duration-300 ${isSeasonTransitioning || isPageTransitioning ? 'opacity-30' : 'opacity-100'}`}>
                                <EpisodeListContent episodesToShow={paginatedEpisodes} isBlurred={isBlurred} view={localEpisodeViewStyle} />
                            </div>
                        </>
                    )}
                    {activeTab === 'trailers' && (
                        isLoadingTrailers ? <p>Loading trailers...</p> : trailers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trailers.map(t => <div key={t.key} className="aspect-video bg-black rounded-lg overflow-hidden"><YouTubeTrailerPlayer videoId={t.key} title={t.name} fallbackThumbnail={playerAnime.bannerImage} /></div>)}
                            </div>
                        ) : <p className="text-[rgb(var(--text-muted))]">No trailers available.</p>
                    )}
                    {activeTab === 'characters' && (
                        isLoadingCharacters ? <p>Loading characters...</p> : characters.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {characters.map(c => <div key={c.id} onClick={() => setSelectedCharacter(c)} className="text-center cursor-pointer group"><img src={c.image} alt={c.name} className="aspect-[2/3] w-full object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" /><p className="mt-1 text-xs font-semibold text-[rgb(var(--text-secondary))] truncate group-hover:text-[rgb(var(--color-primary-accent))]">{c.name}</p></div>)}
                            </div>
                        ) : <p className="text-[rgb(var(--text-muted))]">No characters found.</p>
                    )}
                </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold mb-3 text-[rgb(var(--text-primary))]">Synopsis</h2>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">{playerAnime.synopsis.length > 300 && !isSynopsisExpanded ? `${playerAnime.synopsis.substring(0, 300)}...` : playerAnime.synopsis}
                        {playerAnime.synopsis.length > 300 && (
                            <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="font-bold text-[rgb(var(--color-primary-accent))] ml-1">
                                {isSynopsisExpanded ? 'Read less' : 'Read more'}
                            </button>
                        )}
                    </p>
                </div>
                <div className="md:col-span-1 space-y-4">
                     <img src={playerAnime.thumbnail} alt={getDisplayTitle(playerAnime, settings)} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-lg" />
                     {playerAnime.malUrl && (
                        <a href={playerAnime.malUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-2.5 bg-blue-800 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                            View on MyAnimeList
                        </a>
                     )}
                </div>
            </div>

            <div className="mt-8 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                 <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Anime Details</h3>
                 <div className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
                    <div className="flex justify-between"><span>Type:</span> <span className="font-semibold text-right">{playerAnime.type}</span></div>
                    <div className="flex justify-between"><span>Status:</span> <span className="font-semibold text-right">{playerAnime.status}</span></div>
                    <div className="flex justify-between"><span>Aired:</span> <span className="font-semibold text-right">{formatDate(playerAnime.startDate)} to {formatDate(playerAnime.endDate)}</span></div>
                    <div className="flex justify-between"><span>Season:</span> <span className="font-semibold text-right">{playerAnime.season} {playerAnime.releaseYear}</span></div>
                    <div className="flex justify-between"><span>Studio:</span> <span className="font-semibold text-right">{playerAnime.studio}</span></div>
                 </div>
            </div>

            {settings.showComments && !isEmbed && <Comments anime={playerAnime} currentSeason={currentSeason} currentEpisode={currentEpisode} onUserSelect={onUserSelect} />}
            </>
        )}
        </div>

        {!isEmbed && (
            <aside className="lg:col-span-1 space-y-6">
                <RelatedMovies/>
                <div>
                     <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Recommendations</h3>
                    <div className="space-y-3">
                    {recommendations.slice(0, 5).map(rec => <div key={rec.id} onClick={() => onSelectRelated(rec, 'Recommendations')} className="group flex items-center gap-3 bg-[rgb(var(--surface-2))/0.6] p-2 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors cursor-pointer"><img src={rec.thumbnail} alt="" className="w-12 h-16 object-cover rounded-md" /><div className="flex-1 min-w-0"><h4 className="font-semibold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{getDisplayTitle(rec, settings)}</h4><p className="text-xs text-[rgb(var(--text-muted))]">{rec.type} &bull; {rec.status}</p></div></div>)}
                    </div>
                </div>
                {similarAnime.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Similar Anime</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {similarAnime.map(anime => (
                                <AnimeCard key={anime.id} anime={anime} onSelect={onSelectRelated} />
                            ))}
                        </div>
                    </div>
                )}
            </aside>
        )}
      </div>
    </div>
    </div>
  );
};

export default Player;