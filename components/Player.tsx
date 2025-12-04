

import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, Season, Episode, VideoServer, EpisodeViewStyle, User, Character, DefaultLanguage, Page, Filter, Settings, WatchlistStatus } from '../types';
import { GoogleGenAI } from '@google/genai';
import { ChevronLeftIcon, StarIcon, ChevronRightIcon, ViewGridIcon, ViewListIcon, ViewCarouselIcon, EyeIcon, EyeOffIcon, RewindIcon, FastForwardIcon, RefreshCwIcon, ShareIcon, CloseIcon, DownloadIcon, AnnouncementIcon, ExternalLinkIcon, CodeIcon, SearchIcon, PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, SettingsIcon, FullscreenEnterIcon, FullscreenExitIcon, ExclamationTriangleIcon, ScissorsIcon, UsersIcon, UserPlusIcon, PictureInPictureIcon, FilmIcon, ArrowTopRightOnSquareIcon, LightbulbOffIcon, LightbulbIcon, SparklesIcon, ChevronDownIcon, InfoIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';
import Comments from './Comments';
import RatingControl from './RatingControl';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../hooks/useAuth';
import { NARUTO_FILLER_EPISODES, VIDEO_SERVERS } from '../constants';
import { mapJikanToAnime, mapJikanToCharacter, updateAnilistEntry, fetchWithRetry, fetchAniListDetails, fetchConsumetStreamUrl } from '../api';
import { getDisplayTitle, mapPartialToFullAnime, formatDuration, formatTimestamp } from '../utils';
import CharacterModal from './CharacterModal';
import ClippingModal from './ClippingModal';
import InviteFriendModal from './WatchTogetherModal';
import RoomManagerModal from './RoomManagerModal';
import DownloadModal from './DownloadModal';
import Artplayer from 'artplayer';
import PlayerActions from './PlayerActions';
import { loadYouTubeAPI } from '../youtubeApi';
import { useToast } from '../hooks/useToast';
import { useSettings } from '../hooks/useSettings';
import { db } from '../firebase';
import { ref, onValue, set, push, serverTimestamp, onDisconnect, remove, get } from 'firebase/database';
import CommentsModal from './CommentsModal';

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
  onGoHome: () => void;
  onSelectRelated: (anime: Anime, source?: string) => void;
  onGenreSelect: (genre: string) => void;
  onStudioSelect: (studio: string) => void;
  onUserSelect: (user: User) => void;
  isEmbed?: boolean;
  onEnterRoom: (roomId: string) => void;
  isWatchTogetherSession?: boolean;
  isHost?: boolean;
  onEpisodeChangeByHost?: (season: number, episode: number) => void;
  onPlayerReady?: (player: any) => void;
  breadcrumbsData?: { page: Page; filters: Filter; source?: string };
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isLoggedIn: boolean;
  onLoginRequest: (reason: string) => void;
  getEpisodeStatus: (animeId: number) => { isNew: boolean; episodeNumber: number | null };
}

interface MediaIds {
  tmdb: number | null;
  imdb: string | null;
  mediaType: 'tv' | 'movie' | null;
}

interface MediaItem {
  key: string; // youtube ID or URL
  name: string;
  type: 'youtube' | 'direct';
  thumbnail?: string;
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
    
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && years === 0 && months === 0 && days === 0) parts.push(`${minutes}m`);
    if (seconds > 0 && parts.length < 2) parts.push(`${seconds}s`);


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

// Helper component for the details grid
const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="font-semibold text-[rgb(var(--text-muted))]">{label}</p>
        <div className="text-[rgb(var(--text-secondary))] font-medium truncate">{children}</div>
    </div>
);

async function findRootAnime(jikanAnime: any, visitedIds: Set<number> = new Set()): Promise<any> {
    if (!jikanAnime || visitedIds.has(jikanAnime.mal_id)) {
        return jikanAnime; // Return current if invalid or cycle detected
    }
    visitedIds.add(jikanAnime.mal_id);

    // Jikan's full endpoint includes relations
    const relations = jikanAnime.relations || [];
    const parent = relations.find((r: any) => r.relation === 'Prequel' || r.relation === 'Parent story')?.entry[0];

    if (parent && parent.type === 'anime') {
        try {
            const parentRes = await fetchWithRetry(`https://api.themoviedb.org/3/anime/${parent.mal_id}/full`);
            if (parentRes.ok) {
                const parentData = await parentRes.json();
                // Recursively find the root of the parent
                return findRootAnime(parentData.data, visitedIds);
            }
        } catch (e) {
            console.error(`Failed to fetch parent anime ${parent.mal_id}, returning current as root.`, e);
        }
    }
    
    // No parent found or fetch failed, this is the root
    return jikanAnime;
}


const Player: React.FC<PlayerProps> = ({ anime, onGoBack, onGoHome, onSelectRelated, onGenreSelect, onStudioSelect, onUserSelect, isEmbed = false, onEnterRoom, isWatchTogetherSession = false, isHost = false, onEpisodeChangeByHost, onPlayerReady, breadcrumbsData, settings, updateSettings, isLoggedIn, onLoginRequest, getEpisodeStatus }) => {
  const [playerAnime, setPlayerAnime] = useState<Anime>(anime);
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [similarAnime, setSimilarAnime] = useState<Anime[]>([]);
  const [relatedAnime, setRelatedAnime] = useState<Anime[]>([]);
  const [watchOrder, setWatchOrder] = useState<(Partial<Anime> & { relationType: string })[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [seriesParts, setSeriesParts] = useState<Partial<Anime>[]>([]);
  
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [trailers, setTrailers] = useState<MediaItem[]>([]);
  const [introsOutros, setIntrosOutros] = useState<MediaItem[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(false);
  const [isLoadingIntrosOutros, setIsLoadingIntrosOutros] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [nextAiringInfo, setNextAiringInfo] = useState<{ at: number; episode: number } | null>(null);
  
  const [mediaIds, setMediaIds] = useState<MediaIds>({ tmdb: null, imdb: null, mediaType: null });
  
  const [playingMedia, setPlayingMedia] = useState<MediaItem | null>(null);

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
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string | number>>(new Set());
  
  const { user } = useAuth();
  const { updateProgress, getWatchProgress } = useWatchProgress();
  const { rateAnime, getRating, friends, addNotification } = useProfileData();
  const { addToast } = useToast();
  const currentRating = playerAnime ? getRating(playerAnime.id) : null;
  
  const episodeRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const isNavigatingWithArrows = useRef(false);
  
  const artplayerRef = useRef<HTMLDivElement>(null);
  const artplayerInstance = useRef<Artplayer | null>(null);
  const [isInPiPMode, setIsInPiPMode] = useState(false);

  const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [surpriseError, setSurpriseError] = useState<string | null>(null);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'characters' | 'trailers' | 'intros'>('characters');

    // State and refs for Player Focus Mode
    const [isFocusMode, setIsFocusMode] = useState(false);
    const playerNodeWrapperRef = useRef<HTMLDivElement>(null);
    const overlaySlotRef = useRef<HTMLDivElement>(null);
    const [originalDOMInfo, setOriginalDOMInfo] = useState<{ parent: HTMLElement; nextSibling: Node | null } | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [externalIframeUrl, setExternalIframeUrl] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [skipTimes, setSkipTimes] = useState<{ op: [number, number] | null; ed: [number, number] | null }>({ op: null, ed: null });
  const [showSkipButton, setShowSkipButton] = useState<'op' | 'ed' | null>(null);
  const introMarkerRef = useRef<HTMLDivElement | null>(null);
  const outroMarkerRef = useRef<HTMLDivElement | null>(null);
  const [manualServerSelection, setManualServerSelection] = useState(false);
  const [failedServers, setFailedServers] = useState<Set<VideoServer>>(new Set());
  
  const episodeListContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const currentSeasonRef = useRef(currentSeason);
  useEffect(() => { currentSeasonRef.current = currentSeason; }, [currentSeason]);
    
    const [selectedLanguage, setSelectedLanguage] = useState<DefaultLanguage>(settings.defaultLanguage);
    const [timestampForComment, setTimestampForComment] = useState<string | null>(null);
    const [episodeListMode, setEpisodeListMode] = useState<'both' | 'sub' | 'dub'>('both');

    useLayoutEffect(() => {
        // We only want to scroll to top when the main content has loaded to avoid layout shifts causing a scroll jump.
        if (!isEmbed && !isLoading) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, [anime.id, isEmbed, isLoading]);

    useEffect(() => {
        const currentServerInfo = VIDEO_SERVERS.find(s => s.id === settings.videoServer);
        if (currentServerInfo) {
            setSelectedLanguage(currentServerInfo.type);
        }
    }, [settings.videoServer]);

    const handleManualServerChange = (server: VideoServer) => {
        updateSettings({ videoServer: server });
        setManualServerSelection(true);
    };

    const handleLanguageChange = (newLang: DefaultLanguage) => {
        if (newLang === selectedLanguage) return;
        setSelectedLanguage(newLang);
        const firstServerForType = VIDEO_SERVERS.find(s => s.type === newLang);
        if (firstServerForType) {
            handleManualServerChange(firstServerForType.id);
        }
    };

    const handleTimestamp = useCallback(() => {
        const art = artplayerInstance.current;
        if (!art) return;
        
        const time = formatTimestamp(art.currentTime);
        const textToInsert = `At ${time}: `;
        
        // Show toast
        addToast(`Timestamp ${time} copied to comments`, 'info');
        
        // Update state to trigger effect in Comments component
        setTimestampForComment(textToInsert);
        // Clear it shortly after so the same timestamp can be added again if needed
        setTimeout(() => setTimestampForComment(null), 500);

        // Scroll to comments
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Fallback for mobile/modal view - open modal
            setIsCommentsModalOpen(true);
        }
    }, [addToast]);


  const handleEpisodeScroll = useCallback(() => {
    if (scrollSaveTimeoutRef.current) {
        clearTimeout(scrollSaveTimeoutRef.current);
    }
    scrollSaveTimeoutRef.current = window.setTimeout(() => {
        if (episodeListContainerRef.current && playerAnime) {
            const scrollStateKey = `episode-scroll-${playerAnime.id}-s${currentSeasonRef.current}`;
            sessionStorage.setItem(scrollStateKey, episodeListContainerRef.current.scrollTop.toString());
        }
    }, 300); // Debounce save
  }, [playerAnime]);

  const isBlurred = localBlur === null ? settings.blurEpisodeThumbnails : localBlur;

  useEffect(() => {
    if (settings.lightsOffMode) {
        document.body.classList.add('lights-off-active');
    } else {
        document.body.classList.remove('lights-off-active');
    }
    // Cleanup function in case component unmounts
    return () => {
        document.body.classList.remove('lights-off-active');
    };
  }, [settings.lightsOffMode]);

  const fetchStreamUrl = useCallback(async () => {
    if (!playerAnime || externalIframeUrl) return;
    setIsStreamLoading(true);
    setStreamError(null);
    setVideoUrl(null);

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

    try {
        const serverSetting = settings.videoServer;

        // Try direct stream fetch first (Artplayer compatible)
        let provider: 'gogoanime' | 'zoro' | 'animepahe' = 'zoro'; // Default provider
        if (serverSetting === 'gogoanime') {
            provider = 'gogoanime';
        } else if (serverSetting === 'animepahe') {
            provider = 'animepahe';
        } else if (serverSetting === 'zoro') {
            provider = 'zoro';
        }
        // Other servers like 'hop', 'izy', 'vidembed' etc will try 'zoro' first via this logic.

        const titleToSearch = playerAnime.title_english || playerAnime.title;
        const url = await fetchConsumetStreamUrl(titleToSearch, absoluteEpisodeNumber, provider);

        if (url) {
            setVideoUrl(url);
        } else {
            throw new Error(`Could not retrieve a video source for the selected server: ${serverSetting}.`);
        }
    } catch (e) {
        // Fallback to Embed Player if direct stream fails (server down/API error)
        console.warn("Primary stream fetch failed, falling back to embed:", e);
        // Use vidsrc.cc as a reliable fallback which accepts MAL ID and absolute episode number
        const embedUrl = `https://vidsrc.cc/v2/embed/anime/${playerAnime.id}/${absoluteEpisodeNumber}`;
        setExternalIframeUrl(embedUrl);
        setStreamError(null); // Clear error since we are handling it with fallback
    } finally {
        setIsStreamLoading(false);
    }
}, [playerAnime, currentSeason, currentEpisode, seasons, mediaIds.mediaType, settings.videoServer, externalIframeUrl]);

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
    if (isEmbedModalOpen || selectedCharacter || isClippingModalOpen || isInviteFriendModalOpen || isRoomManagerOpen || isDownloadModalOpen || playingMedia || isCommentsModalOpen) {
        document.body.classList.add('modal-zoom-effect-active');
    } else {
        document.body.classList.remove('modal-zoom-effect-active');
    }
    // Cleanup function in case component unmounts while modal is open
    return () => {
        document.body.classList.remove('modal-zoom-effect-active');
    };
  }, [isEmbedModalOpen, selectedCharacter, isClippingModalOpen, isInviteFriendModalOpen, isRoomManagerOpen, isDownloadModalOpen, playingMedia, isCommentsModalOpen]);

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
    
    setExternalIframeUrl(null);
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
    
    setExternalIframeUrl(null);
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

        // Immediately render the page with basic info
        setPlayerAnime(anime);
        setDisplayTitle(getDisplayTitle(anime, settings));
        isInitialLoadRef.current = true;

        // Reset states for the new anime
        setError(null);
        setMediaIds({ tmdb: null, imdb: null, mediaType: null });
        setSeasons([]); setEpisodes([]); setTrailers([]); setIntrosOutros([]); setCharacters([]); setSeriesParts([]); setRelatedMovies([]); setRecommendations([]); setRelatedAnime([]); setWatchOrder([]);
        setLocalBlur(null); setEpisodePage(1); setFailedImages(new Set()); setNextAiringInfo(null);
        setEpisodeSearchQuery('');
        setSidebarTab('characters');
        setManualServerSelection(false);
        setFailedServers(new Set());
        setExternalIframeUrl(null);

        const fetchPlayerData = async (animeForLookup: Anime, propAnime: Anime): Promise<{ tmdbData: any } | null> => {
            try {
                let titleForTmdb = animeForLookup.title;
                let yearForTmdb: number | null = animeForLookup.releaseYear;
                
                if (/(season|part|cour|saison|temporada)\s\d+/i.test(animeForLookup.title)) {
                    yearForTmdb = null;
                }
                
                const searchTitle = titleForTmdb.replace(/(season|part|cour|saison|temporada)\s\d+/i, '').trim();

                let foundTmdbId: number | null = null;
                let foundMediaType: 'tv' | 'movie' | null = animeForLookup.type === 'Movie' ? 'movie' : 'tv';

                if (searchTitle) {
                    const searchMediaType = animeForLookup.type === 'Movie' ? 'movie' : 'tv';
                    const searchParams = new URLSearchParams({ api_key: TMDB_API_KEY, query: searchTitle });
                    if (yearForTmdb) {
                        if (searchMediaType === 'tv') searchParams.append('first_air_date_year', yearForTmdb.toString());
                        else searchParams.append('year', yearForTmdb.toString());
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
                            const seasonFromTitle = parseSeasonFromTitle(propAnime.title);
                            const savedProgress = getWatchProgress(animeForLookup);

                            let seasonToSet = sessionState?.season || seasonFromTitle || savedProgress?.currentSeason || (validSeasons[0] ? [...validSeasons].sort((a,b)=>a.season_number-b.season_number)[0].season_number : 1);
                            let episodeToSet = savedProgress?.currentSeason === seasonToSet ? savedProgress.currentEpisode : (sessionState?.season === seasonToSet ? sessionState.episode : 1);
                            
                            setCurrentSeason(seasonToSet);
                            setCurrentEpisode(episodeToSet);
                        }
                        return { tmdbData };
                    }
                }
            } catch (e) {
                console.error("Failed to fetch player-critical data (TMDB)", e);
            }
            return null;
        };
        
        const fetchSupplementaryData = async (baseAnime: Anime, tmdbData: any | null) => {
            setIsLoadingTrailers(true);
            setIsLoadingCharacters(true);
            setIsLoadingIntrosOutros(true);
            
            const [relationsPromise, anilistPromise, charactersRes, jikanVideosRes, jikanRecsPromise, anithemesPromise] = await Promise.allSettled([
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/relations`).then(res => res.json()),
                fetchAniListDetails(baseAnime.id),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/characters`),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/videos`),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${baseAnime.id}/recommendations`).then(res => res.json()),
                fetchWithRetry(`https://api.animethemes.moe/anime?filter[has]=resources&filter[resource_site]=MyAnimeList&filter[resource_id]=${baseAnime.id}&include=animethemes.animethemeentries.videos,animethemes.song`)
            ]);

            let finalAnime = { ...baseAnime };
            let anilistTrailer: MediaItem | null = null;

            if (anilistPromise.status === 'fulfilled' && anilistPromise.value) {
                const ad = anilistPromise.value.details;
                finalAnime = { ...finalAnime, title: ad.title.english || ad.title.romaji || finalAnime.title, title_english: ad.title.english || finalAnime.title_english, title_japanese: ad.title.native || finalAnime.title_japanese, bannerImage: ad.bannerImage || finalAnime.bannerImage, synopsis: ad.description || finalAnime.synopsis, genres: ad.genres.length > 0 ? ad.genres : finalAnime.genres, rating: ad.averageScore ? ad.averageScore / 10 : finalAnime.rating, studio: ad.studios.length > 0 ? ad.studios.join(', ') : finalAnime.studio };
                if (ad.nextAiringEpisode) {
                    setNextAiringInfo({ at: ad.nextAiringEpisode.airingAt * 1000, episode: ad.nextAiringEpisode.episode });
                }
                setRecommendations(anilistPromise.value.recommendations.map((p: any) => mapPartialToFullAnime(p as any)));
                
                const allRelations = anilistPromise.value.relations;
                const orderPreference = ['PARENT STORY', 'PREQUEL', 'SEQUEL', 'SIDE STORY', 'SPIN OFF', 'ALTERNATIVE', 'CHARACTER', 'SUMMARY', 'OTHER'];
                allRelations.sort((a: any, b: any) => {
                    const aIndex = orderPreference.indexOf(a.relationType.toUpperCase().replace(/_/g, ' '));
                    const bIndex = orderPreference.indexOf(b.relationType.toUpperCase().replace(/_/g, ' '));
                    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
                });
                setWatchOrder(allRelations);

                const generalRelations = allRelations
                    .filter((r: any) => !['PREQUEL', 'SEQUEL', 'PARENT STORY', 'ALTERNATIVE'].includes(r.relationType.toUpperCase()))
                    .map((r: any) => mapPartialToFullAnime(r));
                setRelatedAnime(generalRelations);
                
                if (ad.trailer && ad.trailer.site === 'youtube' && ad.trailer.id) {
                    anilistTrailer = { key: ad.trailer.id, name: 'Official Trailer (from AniList)', type: 'youtube' };
                }
            }

            setPlayerAnime(finalAnime);
            
            if (relationsPromise.status === 'fulfilled' && relationsPromise.value.data) {
                const relationEntries = relationsPromise.value.data.flatMap((rel: any) => rel.entry);
                const series = relationEntries
                    .filter((e: any) => e.type === 'anime')
                    .map((e: any) => ({ id: e.mal_id, title: e.name, type: e.type, thumbnail: baseAnime.thumbnail }));
                
                const uniqueSeries = Array.from(new Map([
                    { id: finalAnime.id, title: finalAnime.title, type: finalAnime.type, thumbnail: finalAnime.thumbnail },
                    ...series
                ].map(item => [item.id, item])).values());
                
                if (uniqueSeries.length > 1) {
                    setSeriesParts(uniqueSeries);
                } else {
                    setSeriesParts([finalAnime]);
                }
            } else {
                setSeriesParts([finalAnime]);
            }
            
            if (charactersRes.status === 'fulfilled' && charactersRes.value.ok) {
                const charactersData = await charactersRes.value.json();
                setCharacters((charactersData.data || []).map(mapJikanToCharacter).filter(Boolean));
            }
            
            const jikanVideosData = (jikanVideosRes.status === 'fulfilled' && jikanVideosRes.value.ok) 
                ? await jikanVideosRes.value.json() 
                : null;

            // Trailers
            const jikanTrailers: MediaItem[] = [];
            if (jikanVideosData?.data?.promo) {
                jikanVideosData.data.promo.forEach((v: any) => {
                    const key = v.trailer?.youtube_id;
                    if (key) jikanTrailers.push({ key: key, name: v.title, type: 'youtube' });
                });
            }
            const tmdbTrailers: MediaItem[] = [];
            if (tmdbData?.videos?.results) {
                tmdbData.videos.results.forEach((video: any) => {
                    if (video.site === 'YouTube' && video.key && ['Trailer', 'Teaser', 'Clip'].includes(video.type)) {
                        tmdbTrailers.push({ key: video.key, name: video.name || video.type, type: 'youtube' });
                    }
                });
            }

            const allTrailersMap = new Map<string, MediaItem>();
            if (anilistTrailer) {
                allTrailersMap.set(anilistTrailer.key, anilistTrailer);
            }
            tmdbTrailers.filter(t => t.name.toLowerCase().includes('official trailer')).forEach(t => {
                if (!allTrailersMap.has(t.key)) allTrailersMap.set(t.key, t);
            });
            tmdbTrailers.forEach(t => { if (!allTrailersMap.has(t.key)) allTrailersMap.set(t.key, t); });
            jikanTrailers.forEach(t => { if (!allTrailersMap.has(t.key)) allTrailersMap.set(t.key, t); });
            setTrailers(Array.from(allTrailersMap.values()));
            
            // Intros & Outros
            const allThemes: MediaItem[] = [];
            if (anithemesPromise.status === 'fulfilled' && anithemesPromise.value.ok) {
                const anithemesData = await anithemesPromise.value.json();
                if (anithemesData?.anime?.[0]?.animethemes) {
                    for (const theme of anithemesData.anime[0].animethemes) {
                        const songTitle = theme.song?.title || 'Unknown Song';
                        for (const entry of theme.animethemeentries) {
                            const video = entry.videos.find((v: any) => v.tags.includes('NC')) || entry.videos[0];
                            if (video?.link) {
                                const name = `${theme.type}${theme.sequence || ''}${entry.version > 1 ? `v${entry.version}` : ''}${video.tags ? ` (${video.tags})` : ''} - "${songTitle}"`;
                                allThemes.push({ key: video.link, name: name, type: 'direct' });
                            }
                        }
                    }
                }
            }
        
            const existingThemeKeys = new Set(allThemes.map(t => t.key));
        
            if (jikanVideosData?.data?.music_videos) {
                jikanVideosData.data.music_videos.forEach((v: any) => {
                    const key = v.video?.youtube_id;
                    if (key && !existingThemeKeys.has(key)) {
                        allThemes.push({ key, name: v.title, type: 'youtube' });
                        existingThemeKeys.add(key);
                    }
                });
            }
        
            if (tmdbData?.videos?.results) {
                tmdbData.videos.results.forEach((video: any) => {
                    if (video.site === 'YouTube' && video.key && ['Opening Credits', 'Ending Credits'].includes(video.type)) {
                        if (!existingThemeKeys.has(video.key)) {
                            allThemes.push({ key: video.key, name: video.name || video.type, type: 'youtube' });
                            existingThemeKeys.add(video.key);
                        }
                    }
                });
            }
        
            const finalThemesMap = new Map<string, MediaItem>();
            allThemes.forEach(theme => {
                if (!finalThemesMap.has(theme.key)) {
                    finalThemesMap.set(theme.key, theme);
                }
            });
            setIntrosOutros(Array.from(finalThemesMap.values()));

            // Safely handle Jikan API recommendations response, as the data structure is not guaranteed.
            if (anilistPromise.status !== 'fulfilled' || !anilistPromise.value) {
                if (jikanRecsPromise.status === 'fulfilled') {
                    const value = jikanRecsPromise.value as any; // Cast to any to avoid 'unknown' issues
                    if (value?.data && Array.isArray(value.data)) {
                         setRecommendations(
                            value.data.map((r: any) => mapJikanToAnime(r.entry)).filter(Boolean)
                        );
                    }
                }
            }
            
            setIsLoadingTrailers(false);
            setIsLoadingCharacters(false);
            setIsLoadingIntrosOutros(false);
        };
        
        const fetchAllDetails = async () => {
            setIsLoading(true);
            try {
                // Fetch details for the specific anime entry that was clicked (e.g., "One Punch Man S2")
                const fullDetailsRes = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/full`);
                if (!fullDetailsRes.ok) throw new Error(`Failed to fetch base anime details from Jikan API (Status: ${fullDetailsRes.status})`);
                
                const initialJikanData = (await fullDetailsRes.json()).data;
                if (!initialJikanData) throw new Error("Could not find anime data from Jikan.");

                // Traverse relations to find the root of the series (e.g., "One Punch Man")
                const rootJikanData = await findRootAnime(initialJikanData);
                const rootAnimeFromJikan = mapJikanToAnime(rootJikanData);
                if (!rootAnimeFromJikan) throw new Error("Could not process root anime data from Jikan.");
                
                // Use the root anime for player data fetching, but pass original `anime` prop for context (to get the starting season)
                const playerData = await fetchPlayerData(rootAnimeFromJikan, anime);

                if (!isEmbed) {
                    // All supplementary data should also be based on the root anime
                    await fetchSupplementaryData(rootAnimeFromJikan, playerData?.tmdbData);
                }

            } catch (e) {
                console.error("Failed to fetch player data", e);
                setError(e instanceof Error ? e.message : "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDetails();
  }, [anime.id, isEmbed, getWatchProgress, settings]);

  // Fetch Intro/Outro skip times from AniSkip
  useEffect(() => {
    if (!playerAnime || !currentEpisode || playerAnime.type === 'Movie') {
        setSkipTimes({ op: null, ed: null });
        return;
    }

    const fetchSkipTimes = async () => {
        try {
            const malId = playerAnime.id;
            // The API also needs episode length for better accuracy, but it works with 0.
            // Using 0 to get times before video is fully loaded.
            const res = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${currentEpisode}?types=op&types=ed&episodeLength=0`);
            
            // 404 means no data, which is normal.
            if (!res.ok) {
                if (res.status !== 404) {
                    console.error(`AniSkip API error: ${res.status}`);
                }
                setSkipTimes({ op: null, ed: null });
                return;
            }

            const data = await res.json();
            if (data.found) {
                const op = data.results.find((r: any) => r.skipType === 'op');
                const ed = data.results.find((r: any) => r.skipType === 'ed');
                setSkipTimes({
                    op: op ? [op.interval.startTime, op.interval.endTime] : null,
                    ed: ed ? [ed.interval.startTime, ed.interval.endTime] : null,
                });
            } else {
                setSkipTimes({ op: null, ed: null });
            }
        } catch (e) {
            console.error("Failed to fetch skip times from AniSkip", e);
            setSkipTimes({ op: null, ed: null });
        }
    };

    fetchSkipTimes();
  }, [playerAnime, currentEpisode]);


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
            episode_number: ep.episode_number, name: ep.name, still_path: ep.still_path, runtime: ep.runtime, air_date: ep.air_date, overview: ep.overview,
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
  
  const currentEpisodeDetails = useMemo(() => {
    return episodes.find(ep => ep.episode_number === currentEpisode);
  }, [episodes, currentEpisode]);

  useEffect(() => {
    if (isLoadingEpisodes || !episodeListContainerRef.current || !playerAnime) return;

    const scrollFunction = () => {
        const episodeElement = episodeRefs.current.get(currentEpisode);
        if (episodeElement) {
            episodeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    const scrollStateKey = `episode-scroll-${playerAnime.id}-s${currentSeason}`;
    const savedScrollTop = sessionStorage.getItem(scrollStateKey);
  
    if (isInitialLoadRef.current) {
        if (savedScrollTop !== null) {
            episodeListContainerRef.current.scrollTop = parseInt(savedScrollTop, 10);
        } else {
            setTimeout(scrollFunction, 50); // Small delay for initial render
        }
        isInitialLoadRef.current = false;
    } else {
        // If navigating with next/prev buttons, do not scroll. Otherwise, use the "drag" delay for clicks.
        if (isNavigatingWithArrows.current) {
            isNavigatingWithArrows.current = false; // Reset flag and prevent scroll.
            return;
        }
        
        const scrollTimeout = setTimeout(() => {
            scrollFunction();
        }, 500); // 0.5s delay for clicks
        
        return () => clearTimeout(scrollTimeout);
    }
  }, [isLoadingEpisodes, paginatedEpisodes, currentSeason, playerAnime, currentEpisode]);
  
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
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Tell me a surprising, obscure, or hidden fact about the anime titled "${getDisplayTitle(playerAnime, settings)}". Make it fun and concise (under 200 characters).`,
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

  const skipTimesRef = useRef(skipTimes);
  skipTimesRef.current = skipTimes;

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

  const isFirstEpisodeOfAll = useMemo(() => {
    if (mediaIds.mediaType !== 'tv') return true;
    const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === currentSeason);
    if (sortedSeasons.length === 0) {
        return currentEpisode <= 1;
    }
    return currentEpisode <= 1 && currentSeasonIndex <= 0;
  }, [currentEpisode, currentSeason, sortedSeasons, mediaIds.mediaType]);

  const isLastEpisodeOfAll = useMemo(() => {
    if (mediaIds.mediaType !== 'tv') return true;
    const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === currentSeason);
    if (currentSeasonIndex === -1) {
        const totalEpisodesInList = episodes.length;
        if (totalEpisodesInList > 0) {
            return currentEpisode >= totalEpisodesInList;
        }
        return currentEpisode >= (playerAnime.totalEpisodes || Infinity);
    }
    const currentSeasonData = sortedSeasons[currentSeasonIndex];
    return currentEpisode >= currentSeasonData.episode_count && currentSeasonIndex >= sortedSeasons.length - 1;
  }, [currentEpisode, currentSeason, sortedSeasons, mediaIds.mediaType, playerAnime.totalEpisodes, episodes]);


  // Artplayer initialization and shortcut handling
  useEffect(() => {
    if (artplayerRef.current && !artplayerInstance.current && !externalIframeUrl) {
        const preloadMap = {
            eager: 'auto',
            visible: 'metadata',
            idle: 'metadata'
        };

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

        if (art.template.$progress) {
            const introEl = document.createElement('div');
            introEl.className = 'skip-marker';
            introMarkerRef.current = introEl;
            art.template.$progress.appendChild(introEl);

            const outroEl = document.createElement('div');
            outroEl.className = 'skip-marker';
            outroMarkerRef.current = outroEl;
            art.template.$progress.appendChild(outroEl);
        }
        
        const handleOrientation = () => {
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
             const savedProgress = getWatchProgress(anime);
             if (savedProgress && savedProgress.currentSeason === currentSeason && savedProgress.currentEpisode === currentEpisode) {
                const seekTime = (savedProgress.progress / 100) * art.duration;
                if(seekTime > 5) art.seek = seekTime;
             }
        });
        
        art.on('video:timeupdate', () => {
            if(art.duration > 0) {
                const progress = (art.currentTime / art.duration) * 100;
                updateProgress(anime, currentSeason, currentEpisode, progress);

                // AutoSkip & Skip Button logic
                const currentSkipTimes = skipTimesRef.current;
                const currentTime = art.currentTime;
                
                // AutoSkip
                if (settings.autoSkip) {
                    if (currentSkipTimes.op && currentTime >= currentSkipTimes.op[0] + 1 && currentTime < currentSkipTimes.op[1]) {
                        art.seek = currentSkipTimes.op[1];
                    } else if (currentSkipTimes.ed && currentTime >= currentSkipTimes.ed[0] && currentTime < currentSkipTimes.ed[1]) {
                        // For outros, just end the video
                        art.seek = art.duration;
                    }
                }

                // Skip Button
                let newSkipButtonState: 'op' | 'ed' | null = null;
                if (currentSkipTimes.op && currentTime >= currentSkipTimes.op[0] && currentTime < currentSkipTimes.op[1]) {
                    newSkipButtonState = 'op';
                } else if (currentSkipTimes.ed && currentTime >= currentSkipTimes.ed[0] && currentTime < currentSkipTimes.ed[1]) {
                    newSkipButtonState = 'ed';
                }
                setShowSkipButton(current => current !== newSkipButtonState ? newSkipButtonState : current);
            }
        });

        art.on('video:ended', () => {
            if (settings.autoPlay) {
                handleNextEpisode();
            }
        });

        art.on('error', () => {
            if (manualServerSelection) {
                addToast('The selected server failed to load.', 'error');
                return;
            }

            addToast('Current source failed, attempting to switch server...', 'warning');

            const currentServerId = settings.videoServer;
            const newFailedServers = new Set(failedServers).add(currentServerId);
            setFailedServers(newFailedServers);
            
            const currentServer = VIDEO_SERVERS.find(s => s.id === currentServerId);
            if (!currentServer) return;

            const sameTypeServers = VIDEO_SERVERS.filter(s => s.type === currentServer.type);
            
            // Find the next server in the list that hasn't failed yet
            const nextServer = sameTypeServers.find(s => !newFailedServers.has(s.id));
            
            if (nextServer) {
                setTimeout(() => { // Small delay to prevent potential race conditions
                    addToast(`Switched to server: ${nextServer.name}`, 'info');
                    updateSettings({ videoServer: nextServer.id });
                }, 500);
            } else {
                addToast(`All servers of type '${currentServer.type.toUpperCase()}' have failed. Please try a different type.`, 'error');
            }
        });

        return () => {
            art.off('pip:enter', () => setIsInPiPMode(true));
            art.off('pip:exit', () => setIsInPiPMode(false));
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
  }, [anime, playerAnime?.bannerImage, displayTitle, getWatchProgress, currentSeason, currentEpisode, updateProgress, settings.autoPlay, onPlayerReady, settings.startMuted, settings.videoLoadStrategy, settings.autoSkip, handleNextEpisode, manualServerSelection, addToast, settings.videoServer, failedServers, updateSettings, externalIframeUrl]);
  
  // Update Intro/Outro markers on progress bar
  useEffect(() => {
    const art = artplayerInstance.current;
    if (!art) return;

    const updateMarkers = () => {
        const duration = art.duration;
        const introMarker = introMarkerRef.current;
        const outroMarker = outroMarkerRef.current;

        if (duration > 0 && introMarker && outroMarker) {
            if (skipTimes.op) {
                const [start, end] = skipTimes.op;
                introMarker.style.left = `${(start / duration) * 100}%`;
                introMarker.style.width = `${((end - start) / duration) * 100}%`;
            } else {
                introMarker.style.width = '0%';
            }
            if (skipTimes.ed) {
                const [start, end] = skipTimes.ed;
                outroMarker.style.left = `${(start / duration) * 100}%`;
                outroMarker.style.width = `${((end - start) / duration) * 100}%`;
            } else {
                outroMarker.style.width = '0%';
            }
        } else if (introMarker && outroMarker) {
            introMarker.style.width = '0%';
            outroMarker.style.width = '0%';
        }
    };
    
    art.on('ready', updateMarkers);
    art.on('resize', updateMarkers); // In case progress bar size changes
    updateMarkers(); // Initial update

    return () => {
        art.off('ready', updateMarkers);
        art.off('resize', updateMarkers);
    };
  }, [skipTimes]);

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

  const mainCharacters = characters.filter(c => c.role === 'Main');
  const supportingCharacters = characters.filter(c => c.role === 'Supporting');

  const CharacterRow: React.FC<{ character: Character, onClick: () => void }> = ({ character, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgb(var(--surface-3))] cursor-pointer transition-colors group">
        <img src={character.image} alt={character.name} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
        <p className="text-sm font-semibold text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--color-primary-accent))]">{character.name}</p>
    </div>
  );

    const MediaRow: React.FC<{ item: MediaItem, onClick: () => void }> = ({ item, onClick }) => (
        <button onClick={onClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgb(var(--surface-3))] cursor-pointer transition-colors group w-full text-left">
            <div className="relative w-24 h-14 aspect-video bg-[rgb(var(--surface-3))] rounded-md overflow-hidden flex-shrink-0">
                <img src={item.type === 'youtube' ? `https://i.ytimg.com/vi/${item.key}/mqdefault.jpg` : (item.thumbnail || playerAnime.thumbnail)} alt={item.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="w-8 h-8 text-white" />
                </div>
            </div>
            <p className="text-sm font-semibold text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--color-primary-accent))] line-clamp-2">{item.name}</p>
        </button>
    );

  const SeasonNavigator = () => {
    const useTmdbSeasons = seasons.length > 0;
    const useJikanSeriesParts = seriesParts.length > 1;

    const seasonToAnimePartMap = useMemo(() => {
        const map = new Map<number, Partial<Anime>>();
        const allParts = [playerAnime, ...seriesParts];
        for (const part of allParts) {
            if (!part?.title) continue;
            const seasonNum = parseSeasonFromTitle(part.title);
            if (seasonNum !== null && !map.has(seasonNum)) {
                map.set(seasonNum, part);
            }
        }
        if (!map.has(1)) map.set(1, playerAnime);
        return map;
    }, [seriesParts, playerAnime]);

    type NavItem = { id: string | number; isActive: boolean; name: string; imageUrl: string; episodeCount?: number; onClick: () => void; onDetailsClick?: () => void; };
    let items: NavItem[] = [];

    if (useTmdbSeasons) {
        items = [...seasons].sort((a, b) => a.season_number - b.season_number).map(s => {
            const animePart = seasonToAnimePartMap.get(s.season_number);
            return {
                id: s.season_number, 
                isActive: s.season_number === currentSeason, 
                name: s.name || `Season ${s.season_number}`, 
                imageUrl: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '', 
                episodeCount: s.episode_count, 
                onClick: () => selectSeason(s.season_number),
                onDetailsClick: animePart ? () => onSelectRelated(mapPartialToFullAnime(animePart as any), 'Season Details') : undefined,
            };
        });
    } else if (useJikanSeriesParts) {
        items = seriesParts.map(p => {
            const isCurrentAnime = p.id === playerAnime?.id;
            let finalImageUrl = p.thumbnail || '';
            if (!isCurrentAnime && playerAnime?.thumbnail && finalImageUrl === playerAnime.thumbnail) finalImageUrl = '';
            return {
                id: p.id!, 
                isActive: p.id === playerAnime?.id, 
                name: p.title!, 
                imageUrl: finalImageUrl,
                onClick: () => {
                    if (p.id !== playerAnime?.id) onSelectRelated(mapPartialToFullAnime(p as any), 'Season Navigation');
                },
                onDetailsClick: () => onSelectRelated(mapPartialToFullAnime(p as any), 'Season Details'),
            }
        });
    }

    if (items.length <= 1) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">{useTmdbSeasons ? 'Seasons' : 'Series'}</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 horizontal-scroll-fade">
                {items.map(item => {
                    const hasFailed = failedImages.has(item.id);
                    return (
                        <div key={item.id} className="flex-shrink-0 w-40">
                            <button onClick={item.onClick} disabled={isWatchTogetherSession && !isHost} className={`w-full text-left rounded-xl group transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-1))] ${item.isActive ? 'ring-[rgb(var(--color-primary-accent))]' : 'ring-transparent'} disabled:cursor-not-allowed`}>
                                <div className="aspect-[2/3] w-full relative">
                                    {item.imageUrl && !hasFailed ? (
                                        <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${!item.isActive ? 'opacity-70 group-hover:opacity-100' : ''}`} onError={() => setFailedImages(prev => new Set(prev).add(item.id))} />
                                    ) : (
                                        <div className="w-full h-full bg-[rgb(var(--surface-3))] flex items-center justify-center p-2 text-center"><span className="text-xs text-[rgb(var(--text-secondary))]">{item.name}</span></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                                    {item.episodeCount && <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-sm">{item.episodeCount} EP</span>}
                                </div>
                                <div className="p-2 bg-[rgb(var(--surface-2))] flex items-center justify-between">
                                    <p className={`flex-1 font-semibold text-sm truncate transition-colors ${item.isActive ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--color-primary-accent))]'}`}>{item.name}</p>
                                    {item.onDetailsClick && (
                                        <button onClick={(e) => { e.stopPropagation(); item.onDetailsClick!(); }} className="p-1 rounded-full text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-4))] hover:text-[rgb(var(--color-primary-accent))] transition-colors" title="View Details">
                                            <InfoIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </button>
                        </div>
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
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 horizontal-scroll-fade">
                {relatedMovies.map(movie => (
                    <div key={movie.id} className="flex-shrink-0 w-32 sm:w-36">
                        <AnimeCard anime={movie} onSelect={onSelectRelated} episodeStatus={getEpisodeStatus(movie.id)} onLoginRequest={onLoginRequest} />
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const EpisodeListContent = ({ episodesToShow, isBlurred, view }: { episodesToShow: Episode[], isBlurred: boolean, view: EpisodeViewStyle }) => {
    if (isLoadingEpisodes) return <p className="text-[rgb(var(--text-muted))]">Loading episodes...</p>;
    if (episodesToShow.length === 0) {
        if (episodeSearchQuery) return <p className="text-[rgb(var(--text-muted))]">No episodes match your search.</p>;
        return <p className="text-[rgb(var(--text-muted))]">No episode information available.</p>;
    }
    const setEpisodeRef = (epNum: number) => (el: HTMLButtonElement | null) => { if (el) episodeRefs.current.set(epNum, el); else episodeRefs.current.delete(epNum); };

    // Strict label logic based on filter selection (episodeListMode)
    const LanguageLabel = () => {
        if (episodeListMode === 'sub') {
            return playerAnime.hasSub ? <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/20 px-1 py-0.5 rounded-sm ml-2">SUB</span> : null;
        }
        if (episodeListMode === 'dub') {
            return playerAnime.hasDub ? <span className="text-[10px] font-bold text-violet-400 bg-violet-400/20 px-1 py-0.5 rounded-sm ml-2">DUB</span> : null;
        }
        // Both
        return (
            <>
                {playerAnime.hasSub && <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/20 px-1 py-0.5 rounded-sm ml-2">SUB</span>}
                {playerAnime.hasDub && <span className="text-[10px] font-bold text-violet-400 bg-violet-400/20 px-1 py-0.5 rounded-sm ml-2">DUB</span>}
            </>
        );
    };
    
    const LanguageLabelTiny = () => {
        if (episodeListMode === 'sub') {
             return playerAnime.hasSub ? <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/20 px-1 py-0 rounded-sm">SUB</span> : null;
        }
        if (episodeListMode === 'dub') {
             return playerAnime.hasDub ? <span className="text-[10px] font-bold text-violet-400 bg-violet-400/20 px-1 py-0 rounded-sm">DUB</span> : null;
        }
        return (
            <div className="flex flex-col gap-1 items-end">
                {playerAnime.hasSub && <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/20 px-1 py-0 rounded-sm">SUB</span>}
                {playerAnime.hasDub && <span className="text-[10px] font-bold text-violet-400 bg-violet-400/20 px-1 py-0 rounded-sm">DUB</span>}
            </div>
        );
    };

    if (view === 'compact') {
        return <div ref={episodeListContainerRef} onScroll={handleEpisodeScroll} className="space-y-2 max-h-[24rem] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>{episodesToShow.map(ep => {
            const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
            return (
                <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`group flex items-center gap-3 w-full text-left p-2 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-[rgb(var(--surface-3))/0.5] ${currentEpisode === ep.episode_number ? 'bg-[rgb(var(--color-primary))/0.3]' : ''} disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <div className="relative flex-shrink-0 w-24 aspect-video bg-[rgb(var(--surface-3))] rounded-lg overflow-hidden">
                        <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : playerAnime.bannerImage} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                        {ep.runtime && <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{formatDuration(ep.runtime)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm whitespace-normal flex flex-wrap items-center ${currentEpisode === ep.episode_number ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))]'}`}>
                            <span>Episode {ep.episode_number}</span>
                            <LanguageLabel />
                            {isFiller && <span className="text-xs font-bold text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded-sm ml-2">FILLER</span>}
                        </div>
                        <p className="text-xs text-[rgb(var(--text-muted))] whitespace-normal">{ep.name}</p>
                        {ep.air_date && <p className="text-[10px] text-[rgb(var(--text-muted))]">{new Date(ep.air_date).toLocaleDateString()}</p>}
                    </div>
                </button>
            )
        })}</div>;
    }

    if (view === 'grid') {
        return <div ref={episodeListContainerRef} onScroll={handleEpisodeScroll} className="max-h-[24rem] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">{episodesToShow.map(ep => {
            const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
            return (
                <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`relative aspect-video w-full text-left rounded-xl group transition-all duration-300 overflow-hidden hover:scale-105 ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--color-primary-accent))]' : ''} disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : playerAnime.bannerImage} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">E{ep.episode_number}</span>
                    <div className="absolute top-1 right-1">
                        <LanguageLabelTiny />
                        {isFiller && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-1 py-0 rounded-sm mt-1 block text-center">F</span>}
                    </div>
                </button>
            )
        })}</div></div>;
    }
    
    // Default to 'horizontal'
    return <div ref={episodeListContainerRef} onScroll={handleEpisodeScroll} className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 horizontal-scroll-fade">{episodesToShow.map(ep => {
         const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
        return (
            <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`flex-shrink-0 w-36 sm:w-40 text-left rounded-xl group transition-all duration-300 overflow-hidden hover:scale-105 ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--color-primary-accent))]' : ''} disabled:opacity-70 disabled:cursor-not-allowed`}>
                <div className="aspect-video w-full bg-[rgb(var(--surface-3))] relative">
                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : playerAnime.bannerImage} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                     <div className="absolute top-1 right-1">
                        <LanguageLabelTiny />
                    </div>
                </div>
                <div className="p-2">
                    <div className={`font-semibold text-xs truncate flex items-center gap-1 ${currentEpisode === ep.episode_number ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))]'}`}>
                        <span>Ep {ep.episode_number}</span>
                        {isFiller && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-1 py-0 rounded-sm">F</span>}
                    </div>
                    <p className="text-[10px] text-[rgb(var(--text-muted))] whitespace-normal">{ep.name}</p>
                </div>
            </button>
        )
    })}</div>
  };

  if (!playerAnime) {
    // This case should ideally not happen if the app logic is correct, but it's a safe fallback.
    return (
        <div className="w-full h-screen bg-[rgb(var(--surface-1))] flex items-center justify-center">
            <p>Error: Anime data is missing.</p>
        </div>
    );
  }

  const Breadcrumbs = () => {
    if (!breadcrumbsData) return null;

    const pageToName: Record<string, string> = {
        'home': 'Home', 'schedule': 'Schedule', 'trending': 'Trending',
        'top-100': 'Top 100', 'history': 'History', 'beginners': 'For Beginners',
    };
    
    const sourceName = breadcrumbsData.source || pageToName[breadcrumbsData.page] || 'Home';
    const path: React.ReactNode[] = [];

    path.push(
        <button key="home" onClick={onGoHome} className="hover:text-[rgb(var(--color-primary-accent))] transition-colors">
            Home
        </button>
    );
    
    if (breadcrumbsData.page !== 'home') {
        path.push(<span key="sep-home" className="mx-2">/</span>);
        path.push(
            <button key="source" onClick={onGoBack} className="hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                {sourceName}
            </button>
        );
    }
    
    path.push(<span key="sep-title" className="mx-2">/</span>);
    path.push(<span key="title" className="font-semibold text-[rgb(var(--text-primary))] truncate">{displayTitle}</span>);

    return <nav className="flex items-center text-sm text-[rgb(var(--text-muted))] flex-wrap">{path}</nav>;
  };

  return (
    <div className={`animate-subtle-fade-in-up ${isFullPage ? 'fixed inset-0 bg-[rgb(var(--bg-gradient-start))] z-[9999] overflow-y-auto' : ''}`}>
        {/* Modal Portals */}
        {modalRoot && isEmbedModalOpen && ReactDOM.createPortal(<EmbedModal animeId={playerAnime.id} onClose={() => setIsEmbedModalOpen(false)} />, modalRoot)}
        {modalRoot && isShareModalOpen && ReactDOM.createPortal(<div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={() => setIsShareModalOpen(false)}><div className="bg-[rgb(var(--surface-2))] p-6 rounded-2xl w-96" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold mb-4">Share with a friend</h3><div className="space-y-2">{friends.map(f => <button key={f.uid} onClick={() => handleShareWithFriend(f)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgb(var(--surface-3))] text-left"><img src={f.avatar} alt={f.username} className="w-8 h-8 rounded-full"/>{f.username}</button>)}</div></div></div>, modalRoot)}
        {modalRoot && isClippingModalOpen && ReactDOM.createPortal(<ClippingModal onClose={() => setIsClippingModalOpen(false)} />, modalRoot)}
        {modalRoot && isInviteFriendModalOpen && ReactDOM.createPortal(<InviteFriendModal anime={playerAnime} onClose={() => setIsInviteFriendModalOpen(false)} />, modalRoot)}
        {modalRoot && isRoomManagerOpen && ReactDOM.createPortal(<RoomManagerModal anime={playerAnime} currentSeason={currentSeason} currentEpisode={currentEpisode} onClose={() => setIsRoomManagerOpen(false)} onEnterRoom={onEnterRoom} />, modalRoot)}
        {modalRoot && isDownloadModalOpen && ReactDOM.createPortal(<DownloadModal anime={playerAnime} episodes={episodes} season={currentSeason} onClose={() => setIsDownloadModalOpen(false)} />, modalRoot)}
        {modalRoot && selectedCharacter && ReactDOM.createPortal(<CharacterModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />, modalRoot)}
        {modalRoot && isCommentsModalOpen && ReactDOM.createPortal(<CommentsModal isOpen={isCommentsModalOpen} onClose={() => setIsCommentsModalOpen(false)} anime={playerAnime} currentSeason={currentSeason} currentEpisode={currentEpisode} onUserSelect={onUserSelect} />, modalRoot)}
        {modalRoot && playingMedia && ReactDOM.createPortal(
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-cinematic-fade-in p-4" onClick={() => setPlayingMedia(null)}>
                <div className="bg-black rounded-2xl w-full max-w-4xl aspect-video relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setPlayingMedia(null)} className="absolute -top-10 right-0 text-white hover:text-[rgb(var(--color-primary-accent))] z-10"><CloseIcon /></button>
                    {playingMedia.type === 'youtube' ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${playingMedia.key}?autoplay=1`}
                            title="Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-2xl"
                        ></iframe>
                    ) : (
                        <video src={playingMedia.key} controls autoPlay className="w-full h-full rounded-2xl bg-black" />
                    )}
                </div>
            </div>,
            modalRoot
        )}

      <div className="relative h-48 md:h-64 w-full flex flex-col justify-end">
        <img src={playerAnime.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg-gradient-start))] to-transparent"></div>
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 !pt-0">
            <div className="container mx-auto">
                <div className="flex items-end gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                         <div className="flex items-center gap-2">
                            {playerAnime.type && <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded uppercase backdrop-blur-sm">{playerAnime.type}</span>}
                         </div>
                         <h1 className="text-3xl md:text-5xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                            {displayTitle}
                        </h1>
                    </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setIsDownloadModalOpen(true)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" title="Download Options">
                            <DownloadIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setIsFullPage(true)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" title="Enter Full Page Player">
                            <ArrowTopRightOnSquareIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                {!isEmbed && <div className="mt-2"><Breadcrumbs /></div>}
            </div>
        </div>
      </div>
      
        <div className="player-wrapper-container container mx-auto px-4 sm:px-6 lg:p-8 pt-8">
            <div className={`relative ${settings.lightsOffMode ? 'z-[61]' : 'z-10'}`}>
                <div className={`relative aspect-video w-full max-h-[90vh] bg-black shadow-lg shadow-black/50 overflow-hidden ${isFullPage ? 'fixed inset-0 z-[10000] w-screen h-screen max-h-full rounded-none' : 'rounded-2xl'}`} ref={playerNodeWrapperRef}>
                    {externalIframeUrl ? (
                      <div className="w-full h-full relative bg-black rounded-2xl">
                        <iframe 
                          src={externalIframeUrl} 
                          className="w-full h-full border-0 rounded-2xl" 
                          allow="autoplay; fullscreen; picture-in-picture" 
                          allowFullScreen
                          sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
                        ></iframe>
                        <button 
                          onClick={() => setExternalIframeUrl(null)} 
                          className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white rounded-full font-semibold hover:bg-red-600 transition-colors text-sm"
                        >
                          <CloseIcon className="w-4 h-4" /> Close External Player
                        </button>
                      </div>
                    ) : (
                      <div ref={artplayerRef} className="w-full h-full"></div>
                    )}
                    {isFullPage && !externalIframeUrl && (
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                            <button onClick={() => setIsDownloadModalOpen(true)} className="p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors" title="Download Options">
                                <DownloadIcon className="w-6 h-6" />
                            </button>
                            <button onClick={() => setIsFullPage(false)} className="p-2 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors" title="Exit Full Page Player">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                    {streamError && !externalIframeUrl && (
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
                    {isStreamLoading && !streamError && !externalIframeUrl && (
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
                    {showSkipButton && !externalIframeUrl && (
                        <button
                            onClick={() => {
                                const art = artplayerInstance.current;
                                if (!art) return;

                                if (showSkipButton === 'op' && skipTimes.op) {
                                    art.seek = skipTimes.op[1];
                                } else if (showSkipButton === 'ed' && skipTimes.ed) {
                                    art.seek = art.duration; // Skip to end for outro
                                }
                                setShowSkipButton(null);
                            }}
                            className="absolute bottom-16 sm:bottom-20 right-4 z-20 px-4 py-2 bg-[rgb(var(--surface-2))/0.8] backdrop-blur-md text-white rounded-lg font-semibold hover:bg-[rgb(var(--surface-1))] transition-all animate-subtle-fade-in-up"
                        >
                            Skip {showSkipButton === 'op' ? 'Intro' : 'Outro'} <FastForwardIcon className="inline-block w-5 h-5 ml-1" />
                        </button>
                    )}
                </div>

                {nextAiringInfo && (
                    <div className="text-center my-4 p-3 bg-[rgb(var(--surface-2))/0.6] rounded-xl border border-white/10">
                        <p className="font-semibold text-[rgb(var(--color-primary-accent))]">
                            Next Episode ({nextAiringInfo.episode}) airs {formatAiringTime(nextAiringInfo.at)}.
                        </p>
                    </div>
                )}
                
                {!isEmbed && <PlayerActions anime={playerAnime} onClip={() => setIsClippingModalOpen(true)} settings={settings} updateSettings={updateSettings} onSurprise={handleSurpriseFact} onManualServerChange={handleManualServerChange} selectedLanguage={selectedLanguage} onLanguageChange={handleLanguageChange} isLoggedIn={isLoggedIn} onLoginRequest={onLoginRequest} onAddTimestamp={handleTimestamp} onOpenRoomManager={() => setIsRoomManagerOpen(true)} />}
                
                {mediaIds.mediaType === 'tv' && !isEmbed && (
                    <div className="flex justify-between items-center mt-4 p-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 text-white rounded-2xl">
                        <button
                            onClick={handlePrevEpisode}
                            disabled={isFirstEpisodeOfAll || isSeasonTransitioning}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RewindIcon className="w-5 h-5" />
                            <span>Previous Episode</span>
                        </button>
                        <div className="text-center px-4">
                            <p className="font-bold text-lg text-[rgb(var(--text-primary))]">{headerEpisodeText}</p>
                        </div>
                        <button
                            onClick={handleNextEpisode}
                            disabled={isLastEpisodeOfAll || isSeasonTransitioning}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Next Episode</span>
                            <FastForwardIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {(surpriseMessage || surpriseError || isSurpriseLoading) && (
                    <div className="relative mt-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 rounded-2xl animate-cinematic-fade-in">
                        <button onClick={closeSurprise} className="absolute top-2 right-2 text-[rgb(var(--text-muted))] hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                        <div className="flex items-start gap-3">
                            <AnnouncementIcon className="w-6 h-6 text-[rgb(var(--color-primary-accent))] flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h4 className="font-bold text-[rgb(var(--text-primary))]">Surprise Fact!</h4>
                                {isSurpriseLoading && <p className="text-sm text-[rgb(var(--text-muted))]">Generating a fun fact...</p>}
                                {surpriseError && <p className="text-sm text-red-400">{surpriseError}</p>}
                                {surpriseMessage && <p className="text-sm text-[rgb(var(--text-secondary))]">{surpriseMessage}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>


      <div className="player-focus-overlay" aria-hidden={!isFocusMode} onClick={() => setIsFocusMode(false)}>
        <div className="player-focus-overlay-backdrop"></div>
        <div className="player-focus-overlay-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsFocusMode(false)} className="player-focus-overlay-close" aria-label="Close focused player"><CloseIcon className="w-5 h-5"/></button>
            <div className="player-focus-overlay-slot" ref={overlaySlotRef}></div>
        </div>
      </div>
      
    {/* Page content */}
    <div className="player-content-container container mx-auto px-4 sm:px-6 lg:p-8 py-8">
      <div className="player-content-grid grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="player-main-content lg:col-span-2">
            {!isEmbed && (
                <div className="mb-8">
                    <SeasonNavigator/>
                    
                    {/* Rating Control Inserted Here */}
                    <RatingControl animeId={playerAnime.id} animeTitle={getDisplayTitle(playerAnime, settings)} />

                    <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl mt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                            <div className="flex items-center gap-4 border-b border-white/10 sm:border-b-0 self-stretch sm:self-center">
                                <h3 className="px-4 py-2 text-lg font-semibold text-[rgb(var(--color-primary-accent))]">Episodes</h3>
                                <div className="flex bg-[rgb(var(--surface-3))] rounded-lg p-1">
                                     <button 
                                        onClick={() => setEpisodeListMode('both')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${episodeListMode === 'both' ? 'bg-[rgb(var(--color-primary))] text-white shadow-sm' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}
                                     >
                                        BOTH
                                     </button>
                                     <button 
                                        onClick={() => {
                                            setEpisodeListMode('sub');
                                            handleLanguageChange('sub');
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${episodeListMode === 'sub' ? 'bg-[rgb(var(--color-primary))] text-white shadow-sm' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}
                                     >
                                        SUB
                                     </button>
                                     {playerAnime.hasDub && (
                                         <button 
                                            onClick={() => {
                                                setEpisodeListMode('dub');
                                                handleLanguageChange('dub');
                                            }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${episodeListMode === 'dub' ? 'bg-[rgb(var(--color-primary))] text-white shadow-sm' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}
                                         >
                                            DUB
                                         </button>
                                     )}
                                </div>
                            </div>
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
                        </div>

                        {filteredAndSortedEpisodes.length > 20 && (
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon className="w-4 h-4"/></div>
                                <input type="text" value={episodeSearchQuery} onChange={e => setEpisodeSearchQuery(e.target.value)} placeholder="Search episodes..." className="w-full bg-[rgb(var(--surface-3))] border border-[rgb(var(--border-color))] rounded-lg py-2 pl-9 pr-3 text-sm" />
                            </div>
                        )}
                        <div className={`transition-opacity duration-300 ${isSeasonTransitioning || isPageTransitioning ? 'opacity-30' : 'opacity-100'}`}>
                            <EpisodeListContent episodesToShow={paginatedEpisodes} isBlurred={isBlurred} view={localEpisodeViewStyle} />
                        </div>
                         {currentEpisodeDetails && (
                            <div className="mt-4 p-4 bg-[rgb(var(--surface-3))/0.5] rounded-lg border border-white/10">
                                <h4 className="font-bold text-sm text-[rgb(var(--text-primary))] whitespace-normal mb-1">
                                    Episode {currentEpisodeDetails.episode_number}: {currentEpisodeDetails.name}
                                </h4>
                                {currentEpisodeDetails.overview && (
                                    <p className="text-xs text-[rgb(var(--text-muted))] max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                        {currentEpisodeDetails.overview}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {!isEmbed && (
            <aside className="player-sidebar-content lg:col-span-1 space-y-6">
                <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                    <img src={playerAnime.thumbnail} alt={getDisplayTitle(playerAnime, settings)} className="w-full aspect-[2/3] object-cover rounded-xl shadow-lg mb-4" />
                     {playerAnime.synopsis && (
                        <div className="my-4">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                                {isSynopsisExpanded || playerAnime.synopsis.length <= 250 ? playerAnime.synopsis : `${playerAnime.synopsis.substring(0, 250)}...`}
                                {playerAnime.synopsis.length > 250 && (
                                    <button onClick={() => setIsSynopsisExpanded(prev => !prev)} className="font-bold text-[rgb(var(--color-primary-accent))] ml-1">
                                        {isSynopsisExpanded ? 'Read less' : 'Read more'}
                                    </button>
                                )}
                            </p>
                        </div>
                    )}
                     <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <DetailItem label="Format">{playerAnime.type || 'N/A'}</DetailItem>
                        <DetailItem label="Status">{playerAnime.status}</DetailItem>
                        <DetailItem label="Rating">{playerAnime.rating ? `${playerAnime.rating.toFixed(2)} / 10` : 'N/A'}</DetailItem>
                        <DetailItem label="Episodes">{playerAnime.totalEpisodes || 'N/A'}</DetailItem>
                        <DetailItem label="Duration">{playerAnime.avgEpisodeDuration ? `~${playerAnime.avgEpisodeDuration} min` : 'N/A'}</DetailItem>
                        <DetailItem label="Season">{`${playerAnime.season || ''} ${playerAnime.releaseYear || ''}`.trim() || 'N/A'}</DetailItem>
                        <DetailItem label="Start Date">{formatDate(playerAnime.startDate)}</DetailItem>
                        <DetailItem label="End Date">{formatDate(playerAnime.endDate)}</DetailItem>
                        <DetailItem label="Studio"><button onClick={() => onStudioSelect(playerAnime.studio)} className="hover:text-[rgb(var(--color-primary-accent))] hover:underline text-left">{playerAnime.studio || 'N/A'}</button></DetailItem>
                        <DetailItem label="Country">JP</DetailItem>
                        <DetailItem label="Adult">{playerAnime.isAdult ? 'Yes' : 'No'}</DetailItem>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {playerAnime.genres.map(genre => (
                            <button key={genre} onClick={() => onGenreSelect(genre)} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))] hover:bg-[rgb(var(--color-primary))/0.5] transition-colors">
                                {genre}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                        {playerAnime.officialSite && (
                            <a href={playerAnime.officialSite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))] bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-[rgb(var(--color-primary-accent))]">
                                <ExternalLinkIcon className="w-4 h-4" /> Official Site
                            </a>
                        )}
                        {playerAnime.malUrl && (
                            <a href={playerAnime.malUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))] bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-[rgb(var(--color-primary-accent))]">
                                <StarIcon className="w-4 h-4" /> MyAnimeList
                            </a>
                        )}
                    </div>
                </div>
                
                <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setSidebarTab('characters')}
                            className={`flex-1 py-3 font-semibold text-sm transition-colors ${sidebarTab === 'characters' ? 'text-[rgb(var(--color-primary-accent))] bg-[rgb(var(--color-primary))/0.1]' : 'text-[rgb(var(--text-muted))] hover:bg-white/5'}`}
                        >
                            Characters ({characters.length})
                        </button>
                        <button
                            onClick={() => setSidebarTab('trailers')}
                            className={`flex-1 py-3 font-semibold text-sm transition-colors ${sidebarTab === 'trailers' ? 'text-[rgb(var(--color-primary-accent))] bg-[rgb(var(--color-primary))/0.1]' : 'text-[rgb(var(--text-muted))] hover:bg-white/5'}`}
                        >
                            Trailers ({trailers.length})
                        </button>
                        <button
                            onClick={() => setSidebarTab('intros')}
                            className={`flex-1 py-3 font-semibold text-sm transition-colors ${sidebarTab === 'intros' ? 'text-[rgb(var(--color-primary-accent))] bg-[rgb(var(--color-primary))/0.1]' : 'text-[rgb(var(--text-muted))] hover:bg-white/5'}`}
                        >
                            Intros/Outros ({introsOutros.length})
                        </button>
                    </div>

                    <div className="p-4 min-h-[10rem]" key={sidebarTab}>
                        {sidebarTab === 'characters' && (
                            <div className="animate-cinematic-fade-in">
                                {isLoadingCharacters ? (
                                    <p className="text-center text-sm text-[rgb(var(--text-muted))]">Loading characters...</p>
                                ) : characters.length > 0 ? (
                                    <>
                                        {mainCharacters.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-gray-400 mb-2 text-xs uppercase tracking-wider">Main</h5>
                                                <div className="space-y-1 max-h-[calc(5*4.75rem)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                                    {mainCharacters.map(c => <CharacterRow key={c.id} character={c} onClick={() => setSelectedCharacter(c)} />)}
                                                </div>
                                            </div>
                                        )}
                                        {supportingCharacters.length > 0 && (
                                            <div className={mainCharacters.length > 0 ? "mt-4" : ""}>
                                                <h5 className="font-semibold text-gray-400 mb-2 text-xs uppercase tracking-wider">Supporting</h5>
                                                <div className="space-y-1 max-h-[calc(5*4.75rem)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                                    {supportingCharacters.map(c => <CharacterRow key={c.id} character={c} onClick={() => setSelectedCharacter(c)} />)}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-center text-sm text-[rgb(var(--text-muted))]">No characters available.</p>
                                )}
                            </div>
                        )}
                        {sidebarTab === 'trailers' && (
                            <div className="animate-cinematic-fade-in">
                                <div className="space-y-2 max-h-[calc(10*4.5rem)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                    {isLoadingTrailers ? (
                                        <p className="text-[rgb(var(--text-muted))] text-sm text-center">Loading trailers...</p>
                                    ) : trailers.length > 0 ? (
                                        trailers.map((trailer, index) => trailer.key && (
                                            <MediaRow key={index} item={trailer} onClick={() => setPlayingMedia(trailer)} />
                                        ))
                                    ) : (
                                        <p className="text-[rgb(var(--text-muted))] text-sm text-center">No trailers available for this title.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {sidebarTab === 'intros' && (
                            <div className="animate-cinematic-fade-in">
                                <div className="space-y-2 max-h-[calc(10*4.5rem)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                                    {isLoadingIntrosOutros ? (
                                        <p className="text-[rgb(var(--text-muted))] text-sm text-center">Loading themes...</p>
                                    ) : introsOutros.length > 0 ? (
                                        introsOutros.map((theme, index) => theme.key && (
                                            <MediaRow key={index} item={theme} onClick={() => setPlayingMedia(theme)} />
                                        ))
                                    ) : (
                                        <p className="text-[rgb(var(--text-muted))] text-sm text-center">No intros or outros found for this anime.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        )}
      </div>

      {/* Comments section is now the first item after the main grid */}
      {!isEmbed && settings.showComments && <div id="comments-section" className="mt-8"><Comments anime={playerAnime} currentSeason={currentSeason} currentEpisode={currentEpisode} onUserSelect={onUserSelect} onOpenInModal={() => setIsCommentsModalOpen(true)} insertText={timestampForComment} /></div>}

      {watchOrder.length > 0 && !isEmbed && (
          <div className="mt-8">
              <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Watch Order</h3>
              <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-4 rounded-2xl space-y-4">
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
                                  <div
                                      key={item.id}
                                      onClick={() => onSelectRelated(mapPartialToFullAnime(item as any), 'Watch Order')}
                                      className="group flex items-center gap-3 bg-[rgb(var(--surface-3))/0.5] p-2 rounded-xl hover:bg-[rgb(var(--surface-3))] transition-colors cursor-pointer"
                                  >
                                      <img src={item.thumbnail} alt={item.title} className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{item.title}</h5>
                                          <p className="text-xs text-[rgb(var(--text-muted))] capitalize">{item.type} &bull; {item.status}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <RelatedMovies/>
      <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Recommendations</h3>
          <div className="space-y-3">
          {recommendations.slice(0, 5).map(rec => <div key={rec.id} onClick={() => onSelectRelated(rec, 'Recommendations')} className="group flex items-center gap-3 bg-[rgb(var(--surface-2))/0.6] p-2 rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors cursor-pointer"><img src={rec.thumbnail} alt="" className="w-12 h-16 object-cover rounded-md" /><div className="flex-1 min-w-0"><h4 className="font-semibold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{getDisplayTitle(rec, settings)}</h4><p className="text-xs text-[rgb(var(--text-muted))]">{rec.type} &bull; {rec.status}</p></div></div>)}
          </div>
      </div>
      {relatedAnime.length > 0 && (
          <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Related Anime</h3>
              <div className="grid grid-cols-2 gap-4">
                  {relatedAnime.map(rel => (
                      <AnimeCard key={rel.id} anime={rel} onSelect={onSelectRelated} episodeStatus={getEpisodeStatus(rel.id)} onLoginRequest={onLoginRequest} />
                  ))}
              </div>
          </div>
      )}
      {similarAnime.length > 0 && (
          <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">Similar Anime</h3>
              <div className="grid grid-cols-2 gap-4">
                  {similarAnime.map(anime => (
                      <AnimeCard key={anime.id} anime={anime} onSelect={onSelectRelated} episodeStatus={getEpisodeStatus(anime.id)} onLoginRequest={onLoginRequest} />
                  ))}
              </div>
          </div>
      )}
    </div>
    </div>
  );
};

export default Player;