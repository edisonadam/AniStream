import React, { useState, useEffect, useCallback } from 'react';
// FIX: Add Season and Episode to import, which will be defined in types.ts.
import type { Anime, Season, Episode } from '../types';
import { ChevronLeftIcon, StarIcon, ChevronRightIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';
import Comments from './Comments';
import { buildSourceUrl } from '../api';
import { useSettings } from '../hooks/useSettings';
import { useContinueWatching } from '../hooks/useContinueWatching';
import { useProfileData } from '../hooks/useProfileData';
import { VIDEO_SERVERS, VIDSRC_DOMAINS, SUBTITLE_LANGUAGES } from '../constants';


const TMDB_API_KEY = '0f463393529890c7bf7e801f907981f8';

interface PlayerProps {
  anime: Anime;
  allAnime: Anime[];
  onGoBack: () => void;
  onSelectRelated: (anime: Anime) => void;
}

interface MediaIds {
  tmdb: number | null;
  imdb: string | null;
  mediaType: 'tv' | 'movie' | null;
}

const Player: React.FC<PlayerProps> = ({ anime, onGoBack, onSelectRelated }) => {
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);
  const [relatedAnime, setRelatedAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  
  const [mediaIds, setMediaIds] = useState<MediaIds>({ tmdb: null, imdb: null, mediaType: null });
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  
  const { settings, updateSettings } = useSettings();
  const { updateProgress, getContinueWatchingInfo } = useContinueWatching();
  const { logToHistory, rateAnime, getRating } = useProfileData();
  const currentRating = playerAnime ? getRating(playerAnime.id) : null;

  // Effect 1: Main Data Fetching. Only runs when the anime changes.
  useEffect(() => {
    const fetchAnimeDetails = async () => {
        if (!anime?.id) return;
        window.scrollTo(0, 0);
        setIsLoading(true);
        setError(null);
        setPlayerAnime(null);
        setMediaIds({ tmdb: null, imdb: null, mediaType: null });
        setSeasons([]);
        setEpisodes([]);

        try {
            const fullDetailsRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.id}/full`);
            if (!fullDetailsRes.ok) throw new Error('Failed to fetch main details from Jikan.');
            const fullDetailsData = await fullDetailsRes.json();
            const item = fullDetailsData.data;
            if (!item) throw new Error('No detailed data found for this anime from Jikan.');

            const fullAnimeData: Anime = {
                id: item.mal_id, title: item.title_english || item.title, thumbnail: item.images.jpg.large_image_url, bannerImage: item.images.jpg.large_image_url, synopsis: item.synopsis || 'No synopsis available.', genres: item.genres.map((g: any) => g.name), releaseYear: item.year, status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming', totalEpisodes: item.episodes, rating: item.score, type: item.type, studio: item.studios.length > 0 ? item.studios[0].name : 'Unknown', hasSub: anime.hasSub, hasDub: anime.hasDub,
            };
            setPlayerAnime(fullAnimeData);
            
            const [externalLinksRes, recommendationsRes] = await Promise.all([
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/external`).catch(e => { console.error("External links fetch failed:", e); return null; }),
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/recommendations`).catch(e => { console.error("Recommendations fetch failed:", e); return null; }),
            ]);

            if (recommendationsRes?.ok) {
                const recommendationsData = await recommendationsRes.json();
                const mappedRecommendations: Anime[] = (recommendationsData.data || []).slice(0, 6).map((rec: any) => ({ id: rec.entry.mal_id, title: rec.entry.title, thumbnail: rec.entry.images.jpg.large_image_url, bannerImage: rec.entry.images.jpg.large_image_url, synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: true, hasDub: false, }));
                setRelatedAnime(mappedRecommendations);
            }

            let foundTmdbId: number | null = null, foundImdbId: string | null = null, foundMediaType: 'tv' | 'movie' | null = fullAnimeData.type === 'Movie' ? 'movie' : 'tv';
            if (externalLinksRes?.ok) {
                const externalData = (await externalLinksRes.json()).data;
                const tmdbLink = externalData.find((l: any) => l.name === 'TheMovieDB');
                if (tmdbLink?.url) { const [, type, id] = tmdbLink.url.match(/(tv|movie)\/(\d+)/) || []; if (id && (type === 'tv' || type === 'movie')) { foundTmdbId = parseInt(id, 10); foundMediaType = type; } }
                const imdbLink = externalData.find((l: any) => l.name === 'IMDb'); if (imdbLink?.url) foundImdbId = imdbLink.url.match(/tt\d+/)?.[0] || null;
            }
            if (!foundTmdbId && fullAnimeData.title) {
                const searchMediaType = fullAnimeData.type === 'Movie' ? 'movie' : 'tv';
                const searchRes = await fetch(`https://api.themoviedb.org/3/search/${searchMediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fullAnimeData.title)}`);
                if (searchRes.ok) { const match = (await searchRes.json()).results[0]; if (match) { foundTmdbId = match.id; foundMediaType = searchMediaType; } }
            }
            if (foundTmdbId && !foundImdbId && foundMediaType) {
                const externalIdsRes = await fetch(`https://api.themoviedb.org/3/${foundMediaType}/${foundTmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
                if (externalIdsRes.ok) foundImdbId = (await externalIdsRes.json()).imdb_id;
            }
            if (foundTmdbId && foundMediaType) {
                 setMediaIds({ tmdb: foundTmdbId, mediaType: foundMediaType, imdb: foundImdbId });
                 const tmdbDetailsRes = await fetch(`https://api.themoviedb.org/3/${foundMediaType}/${foundTmdbId}?api_key=${TMDB_API_KEY}`);
                 if (tmdbDetailsRes.ok) {
                     const tmdbData = await tmdbDetailsRes.json();
                     if (tmdbData.backdrop_path) setPlayerAnime(prev => prev ? { ...prev, bannerImage: `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}` } : null);
                     if (foundMediaType === 'tv' && tmdbData.seasons) {
                        const validSeasons: Season[] = tmdbData.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0).map((s:any) => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name }));
                        setSeasons(validSeasons);
                     }
                 }
            } else { setError(`Could not find a reliable streaming ID for "${fullAnimeData.title}". The player might not work correctly.`); }
        } catch (e) { setError(e instanceof Error ? e.message : 'An unknown error occurred.'); } finally { setIsLoading(false); }
    };
    fetchAnimeDetails();
  }, [anime.id]);

  // Effect 2: Log History when anime data is loaded or user logs in.
  useEffect(() => {
    if (playerAnime) {
      logToHistory(playerAnime);
    }
  }, [playerAnime, logToHistory]);
  
  // Effect 3: Set Initial Episode from Continue Watching data.
  useEffect(() => {
    if (seasons.length > 0 && anime.id) {
      const savedProgress = getContinueWatchingInfo(anime.id);
      if (savedProgress && seasons.some(s => s.season_number === savedProgress.currentSeason)) {
          setCurrentSeason(savedProgress.currentSeason);
          setCurrentEpisode(savedProgress.currentEpisode);
      } else {
          const firstSeason = [...seasons].sort((a,b) => a.season_number - b.season_number)[0];
          setCurrentSeason(firstSeason.season_number);
          setCurrentEpisode(1);
      }
    }
  }, [seasons, anime.id, getContinueWatchingInfo]);

  // Effect 4: Update Player Source URL and log viewing progress.
  useEffect(() => {
    const url = buildSourceUrl(settings.videoServer, mediaIds.mediaType, mediaIds.tmdb, currentSeason, currentEpisode, settings.vidsrcDomain, settings.autoplay, settings.subtitleLanguage);
    setSourceUrl(url);
    
    if (playerAnime) {
        let progress = 0;
        if (mediaIds.mediaType === 'tv' && seasons.length > 0) {
            const totalEpisodesInSeasons = seasons.reduce((acc, s) => acc + s.episode_count, 0);
            const episodesInPreviousSeasons = seasons.filter(s => s.season_number < currentSeason).reduce((acc, s) => acc + s.episode_count, 0);
            const overallEpisodeNumber = episodesInPreviousSeasons + currentEpisode;
            if(totalEpisodesInSeasons > 0) progress = (overallEpisodeNumber / totalEpisodesInSeasons) * 100;
        } else if (mediaIds.mediaType === 'movie') {
            progress = 100; // Assume watched
        }
        updateProgress(playerAnime.id, currentSeason, currentEpisode, progress);
    }
  }, [settings.videoServer, settings.vidsrcDomain, settings.autoplay, settings.subtitleLanguage, mediaIds, currentSeason, currentEpisode, playerAnime, seasons, updateProgress]);

  // Effect 5: Fetch Episodes for the current season.
  useEffect(() => {
    const fetchSeasonEpisodes = async () => {
      if (mediaIds.mediaType !== 'tv' || !mediaIds.tmdb || !currentSeason) { setEpisodes([]); return; }
      setIsLoadingEpisodes(true);
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${mediaIds.tmdb}/season/${currentSeason}?api_key=${TMDB_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch episode data.');
        const data = await res.json();
        setEpisodes(data.episodes || []);
      } catch (e) { console.error(e); setEpisodes([]); } finally { setIsLoadingEpisodes(false); }
    };
    fetchSeasonEpisodes();
  }, [mediaIds.mediaType, mediaIds.tmdb, currentSeason]);

  const handleNextEpisode = useCallback(() => {
    const currentSeasonInfo = seasons.find(s => s.season_number === currentSeason);
    const currentSeasonIndex = seasons.findIndex(s => s.season_number === currentSeason);
    if (!currentSeasonInfo) return;

    if (currentEpisode < (episodes.length || currentSeasonInfo.episode_count)) {
        setCurrentEpisode(prev => prev + 1);
    } else if (currentSeasonIndex < seasons.length - 1) {
        const nextSeason = seasons[currentSeasonIndex + 1];
        setCurrentSeason(nextSeason.season_number);
        setCurrentEpisode(1);
    }
  }, [seasons, currentSeason, currentEpisode, episodes.length]);

  const handlePrevEpisode = () => {
    const currentSeasonIndex = seasons.findIndex(s => s.season_number === currentSeason);
    if (currentEpisode > 1) {
        setCurrentEpisode(prev => prev - 1);
    } else if (currentSeasonIndex > 0) {
        const prevSeason = seasons[currentSeasonIndex - 1];
        setCurrentSeason(prevSeason.season_number);
        setCurrentEpisode(prevSeason.episode_count);
    }
  };

  const isFirstEpisodeOverall = seasons.length > 0 && seasons[0].season_number === currentSeason && currentEpisode === 1;
  const lastSeason = seasons.length > 0 ? seasons[seasons.length - 1] : null;
  const isLastEpisodeOverall = lastSeason && lastSeason.season_number === currentSeason && currentEpisode === (episodes.length || lastSeason.episode_count);


  if (isLoading) return <div className="text-center p-20 text-xl font-semibold text-[rgb(var(--color-primary-accent))]">Loading Player...</div>;
  
  if (error || !playerAnime) {
      return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
             <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8 mx-auto"><ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" /><span>Back to Browse</span></button>
            <p className="text-xl text-[rgb(var(--color-danger))]">{error || 'Could not load anime details.'}</p>
        </div>
      );
  }
  
  const headerEpisodeText = mediaIds.mediaType === 'tv' ? `S${currentSeason} E${currentEpisode}` : (playerAnime?.totalEpisodes ?? 0) > 1 ? `Episode ${currentEpisode}` : 'Movie';

  return (
    <div className="animate-fade-in">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="mb-6"><button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group"><ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" /><span>Back to Browse</span></button></div>
            <h1 className="text-3xl md:text-5xl font-bold text-[rgb(var(--text-primary))] mb-4" style={{ textShadow: `0 0 10px rgb(var(--shadow-color) / 0.5)` }}>{playerAnime.title}</h1>

            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-[rgb(var(--bg-gradient-start))/0.5] relative mb-4">
              {sourceUrl ? ( <iframe key={sourceUrl} src={sourceUrl} className="absolute top-0 left-0 w-full h-full border-0" allowFullScreen title={`Player for ${playerAnime.title}`}></iframe> ) : 
              ( <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Player Error</p>
                  <p className="text-[rgb(var(--text-muted))]">{error || "Could not generate a valid streaming source."}</p>
                </div> )}
            </div>

            <div className="bg-[rgb(var(--surface-2))/0.5] rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                    {mediaIds.mediaType === 'tv' && seasons.length > 0 ? (
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <button onClick={handlePrevEpisode} disabled={isFirstEpisodeOverall} className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.6] hover:bg-[rgb(var(--surface-4))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                            <p className="text-[rgb(var(--color-primary-accent))] font-semibold text-lg text-center w-28 tabular-nums">{headerEpisodeText}</p>
                            <button onClick={handleNextEpisode} disabled={isLastEpisodeOverall} className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.6] hover:bg-[rgb(var(--surface-4))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
                        </div>
                    ) : (<p className="text-[rgb(var(--color-primary-accent))] font-semibold text-lg text-center sm:text-left">{headerEpisodeText}</p>)}
                </div>
                <div className="flex items-center flex-wrap justify-center gap-2">
                    <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                        {VIDEO_SERVERS.map(server => (
                            <button key={server.id} onClick={() => updateSettings({ videoServer: server.id })} className={`px-4 py-1.5 text-sm rounded-full transition-all ${settings.videoServer === server.id ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{server.name}</button>
                        ))}
                    </div>
                     {settings.videoServer === 'vidsrc' && (
                        <>
                        <select
                            value={settings.vidsrcDomain}
                            onChange={(e) => updateSettings({ vidsrcDomain: e.target.value })}
                            className="bg-[rgb(var(--surface-3))] rounded-full py-2 px-3 text-sm text-[rgb(var(--text-secondary))] font-semibold border-0 focus:ring-2 focus:ring-[rgb(var(--border-focus))]"
                            aria-label="Select Vidsrc domain"
                        >
                            {VIDSRC_DOMAINS.map(domain => (
                                <option key={domain} value={domain}>{domain}</option>
                            ))}
                        </select>
                        <select
                            value={settings.subtitleLanguage}
                            onChange={(e) => updateSettings({ subtitleLanguage: e.target.value })}
                            className="bg-[rgb(var(--surface-3))] rounded-full py-2 px-3 text-sm text-[rgb(var(--text-secondary))] font-semibold border-0 focus:ring-2 focus:ring-[rgb(var(--border-focus))]"
                            aria-label="Select subtitle language"
                        >
                            {SUBTITLE_LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                        </>
                    )}
                    <div className="flex items-center gap-2 bg-[rgb(var(--surface-3))] rounded-full p-1 pl-3">
                        <label htmlFor="dub-toggle-player" className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Dub</label>
                        <button id="dub-toggle-player" onClick={() => updateSettings({ preferDub: !settings.preferDub })} className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${settings.preferDub ? 'bg-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--surface-4))]'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.preferDub ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-[rgb(var(--surface-2))/0.5] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-[rgb(var(--text-primary))]">Synopsis</h2>
                <div className="flex flex-wrap gap-2 mb-4">{playerAnime.genres.map(g => (<span key={g} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))]">{g}</span>))}</div>
                <p className="text-[rgb(var(--text-secondary))] mb-4 text-sm max-h-32 overflow-y-auto">{playerAnime.synopsis}</p>
                
                <div className="flex items-center gap-4 border-y border-[rgb(var(--border-color))] py-4 my-4">
                    <span className="font-semibold text-[rgb(var(--text-primary))]">Your Rating:</span>
                    <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => {
                            const ratingValue = i + 1;
                            return (<button key={ratingValue} onClick={() => rateAnime(playerAnime.id, ratingValue)} className="group"><StarIcon className={`w-6 h-6 transition-colors ${ratingValue <= (currentRating || 0) ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--color-warning))]/50'}`} /></button>);
                        })}
                    </div>
                </div>

                <div className="text-sm space-y-2 text-[rgb(var(--text-muted))]">
                    {playerAnime.releaseYear && <p><span className="font-semibold text-[rgb(var(--text-primary))]">Release:</span> {playerAnime.releaseYear}</p>}
                    <p><span className="font-semibold text-[rgb(var(--text-primary))]">Status:</span> {playerAnime.status}</p>
                    {playerAnime.rating && <p><span className="font-semibold text-[rgb(var(--text-primary))]">Score:</span> {playerAnime.rating}/10</p>}
                </div>
            </div>

            {mediaIds.mediaType === 'tv' && seasons.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Episodes</h3>
                        {seasons.length > 1 && (
                            <div className="flex items-center space-x-2">
                                <label htmlFor="season-select" className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Season:</label>
                                <select id="season-select" value={currentSeason} onChange={(e) => {setCurrentSeason(Number(e.target.value)); setCurrentEpisode(1);}} className="text-sm bg-[rgb(var(--surface-input))/0.6] border-0 rounded-md p-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]">
                                    {seasons.map(s => (<option key={s.season_number} value={s.season_number}>{s.name || `Season ${s.season_number}`}</option>))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                        {isLoadingEpisodes ? <p className="text-[rgb(var(--text-muted))]">Loading episodes...</p> : episodes.length > 0 ? episodes.map(ep => (
                            <button key={ep.episode_number} onClick={() => setCurrentEpisode(ep.episode_number)} className={`flex-shrink-0 w-48 text-left rounded-lg group transition-all duration-300 overflow-hidden ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--border-focus))]' : 'ring-0 ring-transparent hover:ring-2 hover:ring-[rgb(var(--border-focus))]/50'}`}>
                                <div className="aspect-video relative">
                                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : playerAnime.bannerImage} alt={`Episode ${ep.episode_number}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                </div>
                                <div className="p-2 bg-[rgb(var(--surface-2))/0.7]"><p className={`font-semibold text-sm truncate ${currentEpisode === ep.episode_number ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))]'}`}>E{ep.episode_number}: {ep.name}</p></div>
                            </button>
                        )) : <p className="text-[rgb(var(--text-muted))]">No episode information available.</p>}
                    </div>
                </div>
            )}

            <Comments anime={playerAnime} />
            {relatedAnime.length > 0 && <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6 text-[rgb(var(--text-primary))]">Related Anime</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {relatedAnime.map(relAnime => (<AnimeCard key={relAnime.id} anime={relAnime} onSelect={onSelectRelated} />))}
                </div>
            </div>}
        </section>
    </div>
  );
};

export default Player;