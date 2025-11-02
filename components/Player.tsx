import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Anime, Season, Episode, VideoServer, EpisodeViewStyle, User, Character, DefaultLanguage } from '../types';
import { ChevronLeftIcon, StarIcon, ChevronRightIcon, ViewGridIcon, ViewListIcon, ViewCarouselIcon, EyeIcon, EyeOffIcon, RewindIcon, FastForwardIcon, RefreshCwIcon, ShareIcon, CloseIcon, DownloadIcon, SparklesIcon, ExternalLinkIcon, CodeIcon, SearchIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, SettingsIcon, FullscreenEnterIcon, FullscreenExitIcon, ExclamationTriangleIcon, ScissorsIcon, UsersIcon, UserPlusIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';
import Comments from './Comments';
import { useSettings } from '../hooks/useSettings';
import { useWatchProgress } from '../hooks/useWatchProgress';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../hooks/useAuth';
import { NARUTO_FILLER_EPISODES, VIDEO_SERVERS } from '../constants';
import { mapJikanToAnime, mapJikanToCharacter, updateAnilistEntry, fetchWithRetry, buildSourceUrl } from '../api';
import { GoogleGenAI } from '@google/genai';
import { getDisplayTitle } from '../utils';
import CharacterModal from './CharacterModal';
import ClippingModal from './ClippingModal';
import InviteFriendModal from './WatchTogetherModal';
import RoomManagerModal from './RoomManagerModal';
import DownloadModal from './DownloadModal';

const TMDB_API_KEY = '0f463393529890c7bf7e801f907981f8';
const EPISODES_PER_PAGE = 100;

interface PlayerProps {
  anime: Anime;
  allAnime: Anime[];
  onGoBack: () => void;
  onSelectRelated: (anime: Anime) => void;
  onGenreSelect: (genre: string) => void;
  onUserSelect: (user: User) => void;
  isEmbed?: boolean;
  onEnterRoom: (roomId: string) => void;
  isWatchTogetherSession?: boolean;
  isHost?: boolean;
  onEpisodeChangeByHost?: (season: number, episode: number) => void;
  onPlayerReady?: (player: any) => void;
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

    const baseUrl = window.location.origin + window.location.pathname;
    const embedUrl = `${baseUrl}?embed=true&animeId=${animeId}&autoplay=${autoplay ? 1 : 0}&mute=${mute ? 1 : 0}&theme=${theme}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="100%" style="aspect-ratio: 16 / 9;" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;

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
    const airingDate = new Date(timestamp * 1000);
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

const StreamErrorMessage: React.FC<{
  error: string;
  currentSeason: number;
  seasons: Season[];
  onSelectSeason: (seasonNum: number) => void;
}> = ({ error, currentSeason, seasons, onSelectSeason }) => {
    const hasOtherSeasons = seasons.length > 1;
    const canSuggestSeason1 = hasOtherSeasons && currentSeason !== 1;
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black">
            <p className="text-xl font-semibold text-[rgb(var(--color-danger))] mb-2">Could Not Load Stream</p>
            <p className="text-[rgb(var(--text-muted))]">{error}</p>
            {canSuggestSeason1 && (
                <div className="mt-4">
                    <p className="text-sm text-[rgb(var(--text-muted))] mb-2">Sometimes, only the first season is available.</p>
                    <button onClick={() => onSelectSeason(1)} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors text-sm">
                        Try Season 1
                    </button>
                </div>
            )}
        </div>
    );
}

const Player: React.FC<PlayerProps> = ({ anime, onGoBack, onSelectRelated, onGenreSelect, onUserSelect, isEmbed = false, onEnterRoom, isWatchTogetherSession = false, isHost = false, onEpisodeChangeByHost, onPlayerReady }) => {
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);
  const [relatedAnime, setRelatedAnime] = useState<Anime[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [seriesParts, setSeriesParts] = useState<Partial<Anime>[]>([]);
  const [rawRelationsData, setRawRelationsData] = useState<any[] | null>(null);
  const [isLoadingNavigator, setIsLoadingNavigator] = useState(true);

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
  
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [surpriseError, setSurpriseError] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState<string | null>(null);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');

  const isBlurred = localBlur === null ? settings.blurEpisodeThumbnails : localBlur;
  
  const availableServers = useMemo(() => {
    return VIDEO_SERVERS.filter(s => s.type === settings.defaultLanguage);
  }, [settings.defaultLanguage]);

  const videoSrc = useMemo(() => {
    if (mediaIds.mediaType === 'movie') {
        return buildSourceUrl(settings.videoServer, mediaIds.mediaType, mediaIds.tmdb, undefined, undefined, settings.autoplayNext);
    }
    if (mediaIds.mediaType === 'tv') {
        return buildSourceUrl(settings.videoServer, mediaIds.mediaType, mediaIds.tmdb, currentSeason, currentEpisode, settings.autoplayNext);
    }
    return null;
  }, [settings.videoServer, mediaIds.mediaType, mediaIds.tmdb, currentSeason, currentEpisode, settings.autoplayNext]);


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
    setStreamError(null);
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
    setStreamError(null);
    setIsSeasonTransitioning(true);
    setTimeout(() => {
        setCurrentSeason(seasonNum);
        setCurrentEpisode(startEpisode);
        setEpisodePage(Math.ceil(startEpisode / EPISODES_PER_PAGE));
    }, 300);
  }, [currentSeason, isSeasonTransitioning, isWatchTogetherSession, isHost, onEpisodeChangeByHost]);
  
  useEffect(() => {
    const fetchCriticalDetails = async () => {
        if (!anime?.id) return;
        if (!isEmbed) window.scrollTo(0, 0);
        setIsLoading(true); setError(null); setPlayerAnime(null); setDisplayTitle(getDisplayTitle(anime, settings));
        setMediaIds({ tmdb: null, imdb: null, mediaType: null });
        setSeasons([]); setEpisodes([]); setTrailers([]); setCharacters([]); setSeriesParts([]); setRelatedMovies([]); setRawRelationsData(null);
        setActiveTab('episodes'); setLocalBlur(null); setEpisodePage(1);
        setIsLoadingNavigator(true); setIsLoadingTrailers(true); setIsLoadingCharacters(true);
        setFailedImages(new Set());
        setNextAiringInfo(null);
        setEpisodeSearchQuery('');

        try {
            const [fullDetailsPromise, externalLinksPromise, relationsPromise] = await Promise.all([
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/full`).then(res => res.json()),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/external`).then(res => res.json()),
                fetchWithRetry(`https://api.jikan.moe/v4/anime/${anime.id}/relations`).then(res => res.json())
            ]);
            
            setRawRelationsData(relationsPromise.data || null);

            const item = fullDetailsPromise.data;
            if (!item) throw new Error('No detailed data found for this anime.');
            
            const mappedAnime = mapJikanToAnime(item);
            if (!mappedAnime) throw new Error('Could not map anime data.');

            const externalData = externalLinksPromise.data || [];
            const anilistLink = externalData.find((l: any) => l.name === 'AniList');
            const officialSiteLink = externalData.find((l: any) => l.name === 'Official Site');

            const fullAnimeData: Anime = {
                ...mappedAnime,
                hasSub: anime.hasSub, hasDub: anime.hasDub,
                runtime: mappedAnime.runtime || anime.runtime,
                avgEpisodeDuration: mappedAnime.avgEpisodeDuration || anime.avgEpisodeDuration,
                anilistUrl: anilistLink?.url,
                officialSite: officialSiteLink?.url || mappedAnime.officialSite,
            };

            setPlayerAnime(fullAnimeData);
            setDisplayTitle(getDisplayTitle(fullAnimeData, settings));
            setSeriesParts([fullAnimeData]);

            const parentStory = (relationsPromise.data || []).find((r: any) => r.relation === 'Parent story')?.entry[0];
            const baseAnimeForTmdb = parentStory 
                ? { title: parentStory.name, year: null } 
                : { title: fullAnimeData.title, year: fullAnimeData.releaseYear };
            
            let foundTmdbId: number | null = null;
            let foundMediaType: 'tv' | 'movie' | null = fullAnimeData.type === 'Movie' ? 'movie' : 'tv';

            if (!foundTmdbId && baseAnimeForTmdb.title) {
                const searchMediaType = fullAnimeData.type === 'Movie' ? 'movie' : 'tv';
                const allTitles = [...new Set([ baseAnimeForTmdb.title, ...(item.titles?.map((t: any) => t.title) || []) ].map(t => t.replace(/(season|part)\s\d+/i, '').trim()))];

                for (const title of allTitles) {
                    if (foundTmdbId) break;
                    const searchParams = new URLSearchParams({ api_key: TMDB_API_KEY, query: title });
                    if (baseAnimeForTmdb.year) {
                        if (searchMediaType === 'tv') searchParams.append('first_air_date_year', baseAnimeForTmdb.year.toString());
                        else searchParams.append('year', baseAnimeForTmdb.year.toString());
                    }
                    const searchRes = await fetchWithRetry(`https://api.themoviedb.org/3/search/${searchMediaType}?${searchParams.toString()}`);
                    if (searchRes.ok) { 
                        const searchData = await searchRes.json();
                        if (searchData.results.length > 0) {
                            const exactMatch = searchData.results.find((r: any) => (r.name || r.title)?.toLowerCase() === title.toLowerCase());
                            const match = exactMatch || searchData.results[0]; 
                            if (match) { 
                                foundTmdbId = match.id; 
                                foundMediaType = searchMediaType; 
                            }
                        } 
                    }
                }
            }

            if (foundTmdbId && foundMediaType) {
                 setMediaIds({ tmdb: foundTmdbId, mediaType: foundMediaType, imdb: null });
                 const tmdbDetailsRes = await fetchWithRetry(`https://api.themoviedb.org/3/${foundMediaType}/${foundTmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,videos`);
                 if (tmdbDetailsRes.ok) {
                     const tmdbData = await tmdbDetailsRes.json();
                     setMediaIds(prev => ({ ...prev, imdb: tmdbData.external_ids?.imdb_id || null }));
                     setPlayerAnime(prev => prev ? { ...prev, bannerImage: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` : prev.bannerImage, isAdult: prev.isAdult || tmdbData.adult, runtime: tmdbData.runtime || prev.runtime } : null);
                     
                     if (tmdbData.videos?.results) {
                        const tmdbTrailers = tmdbData.videos.results
                            .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
                            .map((v: any) => ({ key: v.key, name: v.name }));
                        setTrailers(tmdbTrailers);
                    }

                     if (foundMediaType === 'tv' && tmdbData.seasons) {
                        const validSeasons: Season[] = tmdbData.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0).map((s:any): Season => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name, poster_path: s.poster_path }));
                        setSeasons(validSeasons);

                        const sessionState = JSON.parse(sessionStorage.getItem(`anistream-player-state-${anime.id}`) || 'null');
                        const seasonFromTitle = parseSeasonFromTitle(fullAnimeData.title);
                        const savedProgress = getWatchProgress(anime.id);

                        if (sessionState && validSeasons.some(s => s.season_number === sessionState.season)) {
                            setCurrentSeason(sessionState.season);
                            setCurrentEpisode(sessionState.episode);
                        } else if (seasonFromTitle && validSeasons.some(s => s.season_number === seasonFromTitle)) {
                            setCurrentSeason(seasonFromTitle);
                            setCurrentEpisode(1);
                        } else if (savedProgress && validSeasons.some(s => s.season_number === savedProgress.currentSeason)) {
                            setCurrentSeason(savedProgress.currentSeason);
                            setCurrentEpisode(savedProgress.currentEpisode);
                        } else if (validSeasons.length > 0) {
                            const firstSeason = [...validSeasons].sort((a,b) => a.season_number - b.season_number)[0];
                            setCurrentSeason(firstSeason.season_number);
                            setCurrentEpisode(1);
                        }
                     }
                 }
            }
        } catch (e) { 
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setIsLoadingNavigator(false);
        } finally { 
            setIsLoading(false); 
        }
    };
    fetchCriticalDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.id, settings]);
  
  const handleNextEpisode = () => {
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
  };

  const handlePrevEpisode = () => {
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
  };
  
  useEffect(() => {
    const fetchLoadingFact = async () => {
        if (!anime) return;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Generate a short, surprising, fun, and little-known fact about the anime "${getDisplayTitle(anime, settings)}". Keep it under 150 characters.`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setLoadingFact(response.text);
        } catch (e) {
            console.error("Failed to fetch loading fact from Gemini", e);
        }
    };
    fetchLoadingFact();
  }, [anime, settings]);

  useEffect(() => {
      if (isLoading || !playerAnime) return;
      const fetchSecondaryData = async () => {
          try {
              if (rawRelationsData && rawRelationsData.length > 0) {
                  const allEntries = rawRelationsData.flatMap((r: any) => r.entry.map((entry: any) => ({ ...entry, relationType: r.relation })));
                  const seriesRelations = ['Prequel', 'Sequel', 'Parent story', 'Side story', 'Alternative version', 'Other'];
                  const seriesMediaTypes = ['TV', 'OVA', 'ONA', 'Special', 'Movie'];
                  const seriesPartsRaw = allEntries.filter((e: any) => seriesRelations.includes(e.relationType) && seriesMediaTypes.includes(e.type));
                  
                  const sortedSeriesParts = [ ...seriesPartsRaw.filter(p => p.relationType === 'Prequel'), playerAnime, ...seriesPartsRaw.filter(p => p.relationType !== 'Prequel') ];
                  const finalSeriesParts = Array.from(new Map(sortedSeriesParts.map(p => [p.mal_id || p.id, p])).values()).map((p: any): Partial<Anime> => ({ id: p.mal_id || p.id, title: p.name || p.title, thumbnail: p.images?.jpg.image_url || p.thumbnail, type: p.type }));
                  setSeriesParts(finalSeriesParts.length > 1 ? finalSeriesParts : [playerAnime]);
  
                  let movieRelations = allEntries.filter((entry: any) => entry.type === 'Movie').map((m: any) => mapJikanToAnime(m)).filter((a): a is Anime => a !== null);
                  if (settings.restrictAdultContent) movieRelations = movieRelations.filter(a => !a.isAdult);
                  setRelatedMovies(Array.from(new Map(movieRelations.map(m => [m.id, m])).values()));
              }
              setIsLoadingNavigator(false);
  
              const [recommendationsRes, videosRes, charactersRes] = await Promise.all([
                  fetchWithRetry(`https://api.jikan.moe/v4/anime/${playerAnime.id}/recommendations`),
                  fetchWithRetry(`https://api.jikan.moe/v4/anime/${playerAnime.id}/videos`),
                  fetchWithRetry(`https://api.jikan.moe/v4/anime/${playerAnime.id}/characters`)
              ]);
  
              if (recommendationsRes.ok) {
                  const recommendationsData = await recommendationsRes.json();
                  let mappedRecs = (recommendationsData.data || []).slice(0, 12).map((rec: any) => mapJikanToAnime(rec.entry)).filter((a): a is Anime => a !== null);
                  if (settings.restrictAdultContent) mappedRecs = mappedRecs.filter(a => !a.isAdult);
                  setRelatedAnime(mappedRecs.slice(0, 6));
              }
  
              if (videosRes.ok) {
                  const videosData = await videosRes.json();
                  const promos = videosData.data?.promo || [];
                  const malTrailers = promos
                    .filter((p: any) => p.trailer?.youtube_id)
                    .map((p: any) => ({ key: p.trailer.youtube_id, name: p.title }));

                  setTrailers(prevTrailers => {
                      const existingKeys = new Set(prevTrailers.map(t => t.key));
                      const newTrailers = malTrailers.filter(t => !existingKeys.has(t.key));
                      return [...prevTrailers, ...newTrailers];
                  });
              }
              setIsLoadingTrailers(false);
  
              if (charactersRes.ok) {
                  const charactersData = (await charactersRes.json()).data;
                  if (charactersData) setCharacters(charactersData.map(mapJikanToCharacter).filter((c): c is Character => c !== null));
              }
              setIsLoadingCharacters(false);
          } catch (e) {
              console.error("Failed to fetch secondary anime details:", e);
              setIsLoadingNavigator(false);
              setIsLoadingTrailers(false);
              setIsLoadingCharacters(false);
          }
      };
      if (!isEmbed) {
        fetchSecondaryData();
      } else {
        setIsLoadingNavigator(false);
        setIsLoadingTrailers(false);
        setIsLoadingCharacters(false);
      }
  }, [isLoading, playerAnime, rawRelationsData, settings.restrictAdultContent, isEmbed]);


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

  const headerEpisodeText = mediaIds.mediaType === 'tv' ? `S${currentSeason} E${currentEpisode}` : (playerAnime?.totalEpisodes ?? 0) > 1 ? `Episode ${currentEpisode}` : 'Movie';

  const modalRoot = document.getElementById('modal-root');
  
  const embedUrl = useMemo(() => {
    if (!playerAnime) return '';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?embed=true&animeId=${playerAnime.id}&autoplay=1&theme=${settings.theme}`;
  }, [playerAnime, settings.theme]);

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
                        onSelectRelated({ id: p.id!, title: p.title || 'N/A', type: p.type || 'TV', thumbnail: p.thumbnail || '', bannerImage: '', synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, studio: '', hasSub: true, hasDub: false, runtime: null, isAdult: false, avgEpisodeDuration: null, title_english: null, title_japanese: '' });
                    }
                }
            }
        });
    }

    if (items.length <= 1 && !isLoadingNavigator) return null;

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))] mb-3">{useTmdbSeasons ? 'Seasons' : 'Series'}</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {isLoadingNavigator ? Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-40 animate-pulse">
                        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-xl"></div>
                        <div className="h-4 mt-2 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
                    </div>
                )) : items.map(item => {
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
                <button key={ep.episode_number} ref={setEpisodeRef(ep.episode_number)} onClick={() => selectEpisode(ep.episode_number)} disabled={isWatchTogetherSession && !isHost} className={`relative aspect-video w-full text-left rounded-xl group transition-all duration-300 overflow-hidden hover:scale-105 ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--border-focus))]' : 'ring-0 ring-transparent'} disabled:opacity-70 disabled:cursor-not-allowed`}>
                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : playerAnime.bannerImage} alt={`Episode ${ep.episode_number}`} className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-1 left-2">
                        <p className="font-semibold text-xs text-white">
                            E{ep.episode_number}
                            {isFiller && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded-sm ml-1">FILLER</span>}
                        </p>
                    </div>
                    {ep.runtime && <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">{formatDuration(ep.runtime)}</span>}
                </button>
            )
        })}</div>;
    }
    
    if (view === 'horizontal') {
        return (
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {episodesToShow.map(ep => {
                    const isFiller = playerAnime?.id === 20 && NARUTO_FILLER_EPISODES.includes(ep.episode_number);
                    return (
                        <button
                            key={ep.episode_number}
                            ref={setEpisodeRef(ep.episode_number)}
                            onClick={() => selectEpisode(ep.episode_number)}
                            disabled={isWatchTogetherSession && !isHost}
                            className={`flex-shrink-0 w-48 aspect-video text-left rounded-xl group transition-all duration-300 overflow-hidden relative ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--border-focus))]' : 'ring-0 ring-transparent'} disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            <img src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : playerAnime.bannerImage} alt={`Episode ${ep.episode_number}`} className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${isBlurred ? 'blur-md' : 'blur-0'}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-1 left-2 w-[90%]">
                                <p className="font-semibold text-xs text-white">
                                    E{ep.episode_number}
                                    {isFiller && <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/20 px-1.5 py-0.5 rounded-sm ml-1">FILLER</span>}
                                </p>
                                <p className="text-[10px] text-gray-300 truncate">{ep.name}</p>
                            </div>
                            {ep.runtime && <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">{formatDuration(ep.runtime)}</span>}
                        </button>
                    );
                })}
            </div>
        );
    }
    
    return null;
  };
  
  const EpisodeViewToggle = () => {
    const cycleViewStyle = () => {
        const order: EpisodeViewStyle[] = ['compact', 'grid', 'horizontal'];
        const currentIndex = order.indexOf(localEpisodeViewStyle);
        const nextIndex = (currentIndex + 1) % order.length;
        setLocalEpisodeViewStyle(order[nextIndex]);
    };

    const iconMap: Record<EpisodeViewStyle, React.ReactNode> = {
        compact: <ViewGridIcon />,
        grid: <ViewCarouselIcon />,
        horizontal: <ViewListIcon />,
    };

    const labelMap: Record<EpisodeViewStyle, string> = {
        compact: 'Grid',
        grid: 'Horizontal',
        horizontal: 'Compact List',
    };

    return (
        <button 
            onClick={cycleViewStyle} 
            className="p-2 rounded-full text-[rgb(var(--text-muted))] bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-secondary))] transition-transform hover:scale-110" 
            aria-label={`Switch to ${labelMap[localEpisodeViewStyle]} view`}
        >
            {iconMap[localEpisodeViewStyle]}
        </button>
    );
  };
  
  const BlurToggle = () => <button onClick={() => setLocalBlur(!isBlurred)} className="p-2 rounded-full text-[rgb(var(--text-muted))] bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text-secondary))] transition-transform hover:scale-110" aria-label={isBlurred ? "Show thumbnails" : "Blur thumbnails"}>{isBlurred ? <EyeOffIcon /> : <EyeIcon />}</button>;

  const TrailerList = () => (
      <>
        {isLoadingTrailers ? <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 animate-pulse"><div className="flex-shrink-0 w-80 h-44 bg-[rgb(var(--surface-3))] rounded-xl"></div><div className="flex-shrink-0 w-80 h-44 bg-[rgb(var(--surface-3))] rounded-xl hidden sm:block"></div></div>
        : trailers.length > 0 ? <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>{trailers.map(t => <div key={t.key} className="flex-shrink-0 w-80"><div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg"><iframe src={`https://www.youtube.com/embed/${t.key}`} title={t.name} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe></div></div>)}</div>
        : <p className="text-[rgb(var(--text-muted))]">No trailers available for this {mediaIds.mediaType === 'tv' ? 'season' : 'title'}.</p>}
      </>
  );

  const CharacterList = () => {
    if (isLoadingCharacters) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[rgb(var(--surface-3))/0.5] rounded-2xl flex items-center p-3 gap-3 animate-pulse">
              <div className="w-16 h-16 bg-[rgb(var(--surface-4))] rounded-lg"></div>
              <div className="flex-1 space-y-2"><div className="h-4 bg-[rgb(var(--surface-4))] rounded w-3/4"></div><div className="h-3 bg-[rgb(var(--surface-4))] rounded w-1/2"></div></div>
              <div className="w-16 h-16 bg-[rgb(var(--surface-4))] rounded-lg ml-auto"></div>
            </div>
          ))}
        </div>
      );
    }
    if (characters.length === 0) return <p className="text-[rgb(var(--text-muted))]">No character information available.</p>;
    const mainCharacters = characters.filter(c => c.role === 'Main');
    const supportingCharacters = characters.filter(c => c.role === 'Supporting');
    const CharacterCard: React.FC<{ character: Character }> = ({ character }) => {
      const va = character.voiceActors.find(v => v.language === 'Japanese');
      return (
        <button onClick={() => setSelectedCharacter(character)} className="w-full bg-[rgb(var(--surface-3))/0.5] rounded-2xl flex justify-between items-center p-3 gap-3 text-left hover:bg-[rgb(var(--surface-3))] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-accent))]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img src={character.image} alt={character.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0"><p className="font-bold text-[rgb(var(--text-primary))] truncate">{character.name}</p><p className="text-sm text-[rgb(var(--text-muted))]">{character.role}</p></div>
          </div>
          {va && (
            <div className="flex items-center gap-3 min-w-0 flex-1 justify-end text-right">
              <div className="flex-1 min-w-0"><p className="font-bold text-[rgb(var(--text-primary))] truncate">{va.name}</p><p className="text-sm text-[rgb(var(--text-muted))]">{va.language}</p></div>
              <img src={va.image} alt={va.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            </div>
          )}
        </button>
      );
    };
    return (
      <div className="space-y-8 max-h-[42rem] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
        {mainCharacters.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--color-primary-accent))]">Main Characters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{mainCharacters.map(c => <CharacterCard key={c.id} character={c} />)}</div>
          </div>
        )}
        {supportingCharacters.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--color-primary-accent))]">Supporting Characters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{supportingCharacters.map(c => <CharacterCard key={c.id} character={c} />)}</div>
          </div>
        )}
      </div>
    );
  };

  const PaginationControls = () => {
    if (totalEpisodePages <= 1) return null;
    const handlePageChange = (newPage: number) => {
        if (newPage === episodePage) return;
        setIsPageTransitioning(true);
        setTimeout(() => { setEpisodePage(newPage); setIsPageTransitioning(false); }, 300);
    };
    return <div className="flex flex-wrap justify-center items-center gap-2 mt-4">{[...Array(totalEpisodePages)].map((_, i) => { const pageNum = i + 1; return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-transform hover:scale-105 ${episodePage === pageNum ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))]' : 'bg-[rgb(var(--surface-3))] hover:bg-[rgb(var(--surface-4))]'}`}>{`${(i * EPISODES_PER_PAGE) + 1} - ${Math.min((i + 1) * EPISODES_PER_PAGE, filteredAndSortedEpisodes.length)}`}</button>; })}</div>;
  };
  
const InfoItem: React.FC<{label: string, value: string | number | null | undefined, isHighlight?: boolean}> = ({label, value, isHighlight}) => (
    <div>
        <span className="font-semibold text-[rgb(var(--text-primary))] block">{label}</span>
        <span className={`text-sm ${isHighlight ? 'text-[rgb(var(--color-secondary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>{value || 'Unknown'}</span>
    </div>
);

const AnimeInfoSection: React.FC<{anime: Anime, onTrailerClick: () => void}> = ({ anime, onTrailerClick }) => {
    return (
        <div className="bg-[rgb(var(--surface-2))/0.5] backdrop-blur-md rounded-3xl p-6">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 relative">
                    <img src={anime.thumbnail} alt={getDisplayTitle(anime, settings)} className="w-full h-auto object-cover rounded-2xl shadow-lg" />
                    <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                        {(anime.hasSub || anime.hasDub) && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/50 text-white backdrop-blur-md">{anime.hasSub && anime.hasDub ? 'SUB/DUB' : anime.hasSub ? 'SUB' : 'DUB'}</span>}
                    </div>
                    {anime.type === 'Movie' && anime.runtime && <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-black/70 text-white backdrop-blur-sm z-10">{formatDuration(anime.runtime)}</span>}
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {anime.malUrl && <a href={anime.malUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 bg-blue-800 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors min-w-[100px]">MyAnimeList</a>}
                        {anime.anilistUrl && <a href={anime.anilistUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 bg-sky-600 text-white rounded-lg font-semibold text-sm hover:bg-sky-500 transition-colors min-w-[100px]">AniList</a>}
                        <button onClick={onTrailerClick} className="flex-1 text-center py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-500 transition-colors min-w-[100px]">Trailer</button>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">{getDisplayTitle(anime, { ...settings, displayTitleLanguage: 'english' })}</h2>
                    <h3 className="text-lg text-[rgb(var(--text-muted))] mb-4">{anime.title_japanese}</h3>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {anime.genres.map(g => (
                            <button key={g} onClick={() => onGenreSelect(g)} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))] hover:bg-[rgb(var(--color-primary))/0.5] transition-colors">{g}</button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-6">
                        {anime.officialSite && <div className="col-span-2"><span className="font-semibold text-[rgb(var(--text-primary))] block">Official Site</span><a href={anime.officialSite} target="_blank" rel="noopener noreferrer" className="text-[rgb(var(--color-primary-accent))] hover:underline truncate block">{anime.officialSite}</a></div>}
                        <InfoItem label="Format" value={anime.type} />
                        <InfoItem label="Status" value={anime.status} />
                        {nextAiringInfo && playerAnime?.status === 'Ongoing' && <InfoItem label={`Ep ${nextAiringInfo.episode} Airing`} value={formatAiringTime(nextAiringInfo.at)} isHighlight={nextAiringInfo.at * 1000 > Date.now()} />}
                        <InfoItem label="Rating" value={anime.rating ? `${anime.rating} / 10` : 'N/A'} />
                        <InfoItem label="Start Date" value={formatDate(anime.startDate)} />
                        <InfoItem label="End Date" value={formatDate(anime.endDate)} />
                        <InfoItem label="Episodes" value={anime.totalEpisodes} />
                        <InfoItem label="Duration" value={anime.avgEpisodeDuration ? `${anime.avgEpisodeDuration} min/ep` : (anime.runtime ? formatDuration(anime.runtime) : 'N/A')} />
                        <InfoItem label="Season" value={anime.season} />
                        <InfoItem label="Country" value="JP" />
                        <InfoItem label="Adult" value={anime.isAdult ? 'Yes' : 'No'} />
                        <InfoItem label="Studios" value={anime.studio} />
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-white">Synopsis</h3>
                    <p className="text-[rgb(var(--text-secondary))] text-sm max-h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>{anime.synopsis}</p>
                </div>
            </div>
        </div>
    );
}

  if (isLoading) return (
    <div className="text-center p-20 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(var(--color-primary))] mb-6"></div>
        <h2 className="text-2xl font-semibold text-[rgb(var(--color-primary-accent))] mb-2 animate-pulse">Loading Player...</h2>
    </div>
  );
  if (error || !playerAnime) return <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center"><button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8 mx-auto"><ChevronLeftIcon className="w-6 h-6" /><span>Back</span></button><p className="text-xl text-[rgb(var(--color-danger))]">{error || 'Could not load details.'}</p></div>;

  const currentSeasonData = sortedSeasons.find(s => s.season_number === currentSeason);
  const currentSeasonIndex = sortedSeasons.findIndex(s => s.season_number === currentSeason);
  const isFirstEpisodeOverall = currentEpisode === 1 && currentSeasonIndex === 0;
  const isLastEpisodeOverall = !!currentSeasonData && currentEpisode === currentSeasonData.episode_count && currentSeasonIndex === sortedSeasons.length - 1;

    if (isEmbed) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col">
                <div className="w-full aspect-video bg-black relative">
                    {videoSrc ? (
                        <iframe
                            ref={iframeRef}
                            key={videoSrc} // Force re-render on src change
                            src={videoSrc}
                            title="Anime Player"
                            className="w-full h-full"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black">
                            <p className="text-xl font-semibold text-[rgb(var(--color-danger))]">Could not find a valid video source.</p>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 bg-black p-2 text-white flex justify-between items-center">
                    <h1 className="text-sm font-bold truncate">{displayTitle}</h1>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-4">{headerEpisodeText}</p>
                </div>
            </div>
        );
    }

  return (
    <div className="animate-cinematic-fade-in">
        {selectedCharacter && modalRoot && ReactDOM.createPortal(
            <CharacterModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />,
            modalRoot
        )}
        {(isSurpriseLoading || surpriseMessage || surpriseError) && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={closeSurprise}>
                <div className="bg-gradient-to-br from-[rgb(var(--surface-2))/0.8] to-[rgb(var(--surface-3))/0.8] backdrop-blur-xl border border-[rgb(var(--border-color))] rounded-3xl shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-sm m-4 p-6 relative transform transition-all animate-subtle-fade-in-up text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={closeSurprise} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                    <div className="flex justify-center text-[rgb(var(--color-primary-accent))] mb-4"><SparklesIcon className="w-10 h-10" /></div>
                    <h3 className="text-xl font-bold mb-4 text-[rgb(var(--text-primary))]">Surprise Fact!</h3>
                    {isSurpriseLoading && <p className="text-[rgb(var(--text-muted))] animate-pulse">Generating a surprise...</p>}
                    {surpriseError && <p className="text-[rgb(var(--color-danger))]">{surpriseError}</p>}
                    {surpriseMessage && <p className="text-[rgb(var(--text-secondary))] text-lg leading-relaxed">"{surpriseMessage}"</p>}
                </div>
            </div>
        )}
        {isShareModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={() => setIsShareModalOpen(false)}>
                <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-[rgb(var(--border-color))] rounded-3xl shadow-2xl w-full max-w-sm m-4 p-6 relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setIsShareModalOpen(false)} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                    <h3 className="text-xl font-bold mb-4 text-[rgb(var(--text-primary))]">Share with a friend</h3>
                    {friends.length > 0 ? (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {friends.map(friend => (
                                <button key={friend.username} onClick={() => handleShareWithFriend(friend)} className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-[rgb(var(--surface-3))] transition-colors">
                                    <img src={friend.avatar} alt={friend.username} className="w-10 h-10 rounded-full" />
                                    <span className="font-semibold text-[rgb(var(--text-secondary))]">{friend.username}</span>
                                </button>
                            ))}
                        </div>
                    ) : ( <p className="text-center text-[rgb(var(--text-muted))] py-8">You have no friends to share with yet.</p> )}
                </div>
            </div>
        )}

        {isEmbedModalOpen && playerAnime && modalRoot && ReactDOM.createPortal(
            <EmbedModal animeId={playerAnime.id} onClose={() => setIsEmbedModalOpen(false)} />,
            modalRoot
        )}
        {isDownloadModalOpen && playerAnime && modalRoot && ReactDOM.createPortal(
            <DownloadModal anime={playerAnime} episodes={episodes} season={currentSeason} onClose={() => setIsDownloadModalOpen(false)} />,
            modalRoot
        )}
        {isClippingModalOpen && modalRoot && ReactDOM.createPortal(
            <ClippingModal onClose={() => setIsClippingModalOpen(false)} />,
            modalRoot
        )}
        {isInviteFriendModalOpen && playerAnime && modalRoot && ReactDOM.createPortal(
            <InviteFriendModal anime={playerAnime} onClose={() => setIsInviteFriendModalOpen(false)} />,
            modalRoot
        )}
        {isRoomManagerOpen && playerAnime && modalRoot && onEnterRoom && ReactDOM.createPortal(
            <RoomManagerModal anime={playerAnime} currentSeason={currentSeason} currentEpisode={currentEpisode} onClose={() => setIsRoomManagerOpen(false)} onEnterRoom={onEnterRoom} />,
            modalRoot
        )}
        
        <div className="relative w-full h-[300px] md:h-[500px]">
            <img src={playerAnime.bannerImage} alt={`${getDisplayTitle(playerAnime, settings)} banner`} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--bg-gradient-start))] from-10% to-transparent" />
        </div>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 -mt-32 md:-mt-56 relative z-10">
            <div className="relative z-10">
                <div className="mb-4">
                    <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
                        <button onClick={onGoBack} className="hover:text-[rgb(var(--color-primary-accent))]">Home</button>
                        <ChevronRightIcon className="w-4 h-4" />
                        <span className="font-semibold text-[rgb(var(--text-secondary))]">{playerAnime.type || 'Anime'}</span>
                        <ChevronRightIcon className="w-4 h-4" />
                        <span className="font-bold text-[rgb(var(--text-primary))] truncate max-w-xs">{displayTitle}</span>
                    </nav>
                </div>
                <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 min-w-0">
                         <h1 className={`text-4xl md:text-6xl font-bold text-white transition-opacity duration-300 ${isSeasonTransitioning ? 'opacity-0' : 'opacity-100'}`} style={{ textShadow: '0 3px 8px rgba(0,0,0,0.9)' }}>{displayTitle}</h1>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {playerAnime.isAdult && <span className="flex-shrink-0 px-3 py-1 text-sm font-bold rounded-full bg-red-600 text-white">+18</span>}
                      <button onClick={() => setIsDownloadModalOpen(true)} title="Download Options" className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.7] backdrop-blur-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--color-primary-hover))] hover:text-white transition-colors" aria-label="Download Options"><DownloadIcon /></button>
                      <button onClick={() => setIsEmbedModalOpen(true)} title="Embed Player" className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.7] backdrop-blur-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--color-primary-hover))] hover:text-white transition-colors" aria-label="Embed Player"><CodeIcon /></button>
                      <a href={embedUrl} target="_blank" rel="noopener noreferrer" title="Preview Embed" className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.7] backdrop-blur-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--color-primary-hover))] hover:text-white transition-colors" aria-label="Preview Embed"><ExternalLinkIcon /></a>
                      {user && <button onClick={() => setIsShareModalOpen(true)} title="Share with a friend" className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.7] backdrop-blur-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--color-primary-hover))] hover:text-white transition-colors" aria-label="Share with a friend"><ShareIcon /></button>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-6">
                <div className="xl:col-span-2">
                    {playerAnime.type === 'Movie' && <span className="mb-4 inline-block px-4 py-1.5 text-base font-bold rounded-full bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] shadow-lg shadow-[rgb(var(--shadow-color))/0.4]">Movie</span>}
                    
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-[rgb(var(--bg-gradient-start))/0.5] relative my-4">
                        {videoSrc ? (
                            <iframe
                                ref={iframeRef}
                                key={videoSrc} // Force re-render on src change
                                src={videoSrc}
                                title="Anime Player"
                                className="w-full h-full"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black">
                                <p className="text-xl font-semibold text-[rgb(var(--color-danger))]">Could not find a valid video source.</p>
                                <p className="text-[rgb(var(--text-muted))]">Please try another server or check back later.</p>
                            </div>
                        )}
                    </div>


                    <div className="bg-[rgb(var(--surface-2))/0.5] backdrop-blur-md rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1 min-w-0">
                            {mediaIds.mediaType === 'tv' && seasons.length > 0 ? (
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <button onClick={handlePrevEpisode} disabled={isFirstEpisodeOverall || (isWatchTogetherSession && !isHost)} className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.6] hover:bg-[rgb(var(--surface-4))] disabled:opacity-50 disabled:hover:bg-[rgb(var(--surface-3))/0.6] transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                                <p className="text-[rgb(var(--color-primary-accent))] font-semibold text-lg text-center w-28 tabular-nums">{headerEpisodeText}</p>
                                <button onClick={handleNextEpisode} disabled={isLastEpisodeOverall || (isWatchTogetherSession && !isHost)} className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.6] hover:bg-[rgb(var(--surface-4))] disabled:opacity-50 disabled:hover:bg-[rgb(var(--surface-3))/0.6] transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
                            </div>
                            ) : ( <p className="text-[rgb(var(--color-primary-accent))] font-semibold text-lg text-center sm:text-left">{headerEpisodeText}</p> )}
                        </div>
                        <div className="flex items-center flex-wrap justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="server-select" className="text-sm font-semibold text-[rgb(var(--text-muted))]">Server:</label>
                                <select 
                                    id="server-select"
                                    value={settings.videoServer}
                                    onChange={(e) => updateSettings({ videoServer: e.target.value as VideoServer })}
                                    className="bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))] transition-all"
                                >
                                    {availableServers.map(server => (
                                        <option key={server.id} value={server.id}>{server.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                                {(['sub', 'dub', 'ssub'] as DefaultLanguage[]).map(lang => (
                                    <button key={lang} onClick={() => updateSettings({ defaultLanguage: lang })} className={`px-4 py-1.5 text-sm uppercase rounded-full transition-all ${settings.defaultLanguage === lang ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>
                                        {lang === 'ssub' ? 'S-Sub' : lang}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-[rgb(var(--surface-2))/0.5] backdrop-blur-md rounded-2xl p-3 my-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                         {mediaIds.mediaType === 'tv' && (
                            <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                                <button onClick={() => updateSettings({ autoplayNext: !settings.autoplayNext })} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all ${settings.autoplayNext ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}><RefreshCwIcon className="w-4 h-4" /><span>Autoplay</span></button>
                                <button onClick={() => updateSettings({ autoSkipIntro: !settings.autoSkipIntro })} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all ${settings.autoSkipIntro ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}><FastForwardIcon className="w-4 h-4" /><span>Skip Intro</span></button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            {user && !isWatchTogetherSession && <button onClick={() => setIsRoomManagerOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--surface-3))] text-sm text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-[rgb(var(--surface-4))] hover:text-white transition-colors"><UsersIcon className="w-4 h-4" /> Watch Together</button>}
                            {user && <button onClick={() => setIsInviteFriendModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--surface-3))] text-sm text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-[rgb(var(--surface-4))] hover:text-white transition-colors"><UserPlusIcon className="w-4 h-4" /> Invite Friend</button>}
                            <a href={`mailto:edisonadam160@gmail.com?subject=Report: Anime Issue - ${encodeURIComponent(playerAnime.title)}&body=Anime ID: ${playerAnime.id}%0D%0ASeason: ${currentSeason}%0D%0AEpisode: ${currentEpisode}%0D%0AStream URL: ${videoSrc || 'N/A'}%0D%0A%0D%0APlease describe the issue:%0D%0A`} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--surface-3))] text-sm text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-[rgb(var(--surface-4))] hover:text-white transition-colors"><ExclamationTriangleIcon className="w-4 h-4" /> Report</a>
                            <button onClick={() => setIsClippingModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--surface-3))] text-sm text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-[rgb(var(--surface-4))] hover:text-white transition-colors"><ScissorsIcon className="w-4 h-4" /> Clip</button>
                        </div>
                    </div>

                    <div className="my-8"><SeasonNavigator /><RelatedMovies /></div>
                    
                    {mediaIds.tmdb && (
                      <div className="mt-8">
                          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[rgb(var(--border-color))] mb-6">
                              <div className="flex">
                                  {showEpisodesTab && <button onClick={() => setActiveTab('episodes')} className={`px-3 sm:px-4 py-2 text-base sm:text-lg font-semibold transition-colors ${activeTab === 'episodes' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))] -mb-px' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Episodes</button>}
                                  {showTrailersTab && <button onClick={() => setActiveTab('trailers')} className={`px-3 sm:px-4 py-2 text-base sm:text-lg font-semibold transition-colors ${activeTab === 'trailers' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))] -mb-px' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Trailers</button>}
                                  {showCharactersTab && <button onClick={() => setActiveTab('characters')} className={`px-3 sm:px-4 py-2 text-base sm:text-lg font-semibold transition-colors ${activeTab === 'characters' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))] -mb-px' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Characters</button>}
                              </div>
                              {activeTab === 'episodes' && showEpisodesTab && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => updateSettings({ hideFillerEpisodes: !settings.hideFillerEpisodes })} className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full transition-all ${settings.hideFillerEpisodes ? 'bg-[rgb(var(--color-primary))] text-white font-semibold shadow-md' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-3))]'}`}>
                                    Hide Filler
                                  </button>
                                  <BlurToggle />
                                  <EpisodeViewToggle />
                                </div>
                              )}
                          </div>
                          {activeTab === 'episodes' && showEpisodesTab && (
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]">
                                    <SearchIcon className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={episodeSearchQuery}
                                    onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                                    placeholder={`Search from ${episodes.length} episodes...`}
                                    className="w-full bg-[rgb(var(--surface-input))/0.5] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:ring-1 focus:ring-[rgb(var(--border-focus))]"
                                />
                            </div>
                          )}
                          <div key={activeTab} className={`transition-opacity duration-300 ${isSeasonTransitioning && activeTab === 'episodes' ? 'opacity-0' : 'opacity-100'}`}>
                               {activeTab === 'episodes' && showEpisodesTab && (
                                <div className={`transition-opacity duration-300 ${isPageTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                                    {episodeError ? (
                                        <div className="text-center p-4 bg-[rgb(var(--surface-2))] rounded-xl">
                                            <p className="font-semibold text-[rgb(var(--color-danger))] mb-3">Error loading episodes</p>
                                            <p className="text-sm text-[rgb(var(--text-muted))] mb-4">{episodeError}</p>
                                            <button onClick={fetchSeasonEpisodes} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors text-sm">Retry</button>
                                        </div>
                                    ) : ( <> <div key={localEpisodeViewStyle} className="animate-cinematic-fade-in"><EpisodeListContent episodesToShow={paginatedEpisodes} isBlurred={isBlurred} view={localEpisodeViewStyle} /></div> <PaginationControls /> </> )}
                                </div>
                               )}
                               {activeTab === 'trailers' && showTrailersTab && <TrailerList />}
                               {activeTab === 'characters' && showCharactersTab && <CharacterList />}
                          </div>
                      </div>
                    )}
                </div>
                <div className="xl:col-span-1">
                     <AnimeInfoSection anime={playerAnime} onTrailerClick={() => setActiveTab('trailers')} />
                    <Comments anime={playerAnime} onUserSelect={onUserSelect} />
                </div>
            </div>

            {relatedAnime.length > 0 && (
                <div className="mt-16">
                    <h3 className="text-3xl font-bold mb-8 text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                        Related Anime
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {relatedAnime.map(relAnime => (
                            <AnimeCard key={relAnime.id} anime={relAnime} onSelect={onSelectRelated} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    </div>
  );
};

export default Player;