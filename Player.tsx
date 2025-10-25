import React, { useState, useEffect } from 'react';
import type { Anime } from './types';
import { ChevronLeftIcon, StarIcon, FullscreenIcon, ChevronDownIcon, ChevronRightIcon } from './components/icons/Icons';
import AnimeCard from './components/AnimeCard';
import Comments from './components/Comments';
import { buildSourceUrl } from './api';

const TMDB_API_KEY = '0f463393529890c7bf7e801f907981f8';

interface PlayerProps {
  anime: Anime;
  onGoBack: () => void;
  onSelectRelated: (anime: Anime) => void;
}

interface Season {
    season_number: number;
    episode_count: number;
    name: string;
}

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
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

  useEffect(() => {
    const fetchAnimeDetails = async () => {
        if (!anime) return;
        window.scrollTo(0, 0);
        setIsLoading(true);
        setError(null);
        setPlayerAnime(null);
        setMediaIds({ tmdb: null, imdb: null, mediaType: null });
        setSeasons([]);
        setEpisodes([]);

        try {
            const [fullDetailsRes, externalLinksRes, recommendationsRes] = await Promise.all([
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/full`),
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/external`),
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/recommendations`),
            ]);

            if (!fullDetailsRes.ok || !recommendationsRes.ok) {
                throw new Error('Failed to fetch detailed anime data from Jikan.');
            }

            const fullDetailsData = await fullDetailsRes.json();
            const recommendationsData = await recommendationsRes.json();

            const item = fullDetailsData.data;
            const fullAnimeData: Anime = {
                id: item.mal_id,
                title: item.title_english || item.title,
                thumbnail: item.images.jpg.large_image_url,
                bannerImage: item.images.jpg.large_image_url,
                synopsis: item.synopsis || 'No synopsis available.',
                genres: item.genres.map((g: any) => g.name),
                releaseYear: item.year,
                status: item.status === 'Finished Airing' ? 'Completed' : item.status === 'Currently Airing' ? 'Ongoing' : 'Upcoming',
                totalEpisodes: item.episodes,
                rating: item.score,
                type: item.type,
                studio: item.studios.length > 0 ? item.studios[0].name : 'Unknown',
                hasSub: anime.hasSub,
                hasDub: anime.hasDub,
            };
            setPlayerAnime(fullAnimeData);

            let foundTmdbId: number | null = null;
            let foundImdbId: string | null = null;
            let foundMediaType: 'tv' | 'movie' | null = fullAnimeData.type === 'Movie' ? 'movie' : 'tv';

            // 1. Try to get both IDs from Jikan's external links
            if (externalLinksRes.ok) {
                const externalLinksData = await externalLinksRes.json();
                const externalData = externalLinksData.data;

                const tmdbLink = externalData.find((link: any) => link.name === 'TheMovieDB');
                if (tmdbLink && tmdbLink.url) {
                    const urlParts = tmdbLink.url.split('/');
                    const idStr = urlParts.pop();
                    const typeStr = urlParts.pop();

                    if (idStr && (typeStr === 'tv' || typeStr === 'movie')) {
                        foundTmdbId = parseInt(idStr, 10);
                        foundMediaType = typeStr;
                    }
                }

                const imdbLink = externalData.find((link: any) => link.name === 'IMDb');
                if (imdbLink && imdbLink.url) {
                    const imdbIdMatch = imdbLink.url.match(/tt\d+/);
                    if (imdbIdMatch) {
                        foundImdbId = imdbIdMatch[0];
                    }
                }
            }
            
            // 2. If no TMDB ID, search TMDB API
            if (!foundTmdbId) {
                const searchMediaType = fullAnimeData.type === 'Movie' ? 'movie' : 'tv';
                const searchRes = await fetch(`https://api.themoviedb.org/3/search/${searchMediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(fullAnimeData.title)}`);
                if(searchRes.ok) {
                    const searchData = await searchRes.json();
                    const potentialMatch = searchData.results.find((r: any) => 
                        (r.genre_ids?.includes(16) || r.origin_country?.includes('JP'))
                    );
                    if (potentialMatch) {
                        foundTmdbId = potentialMatch.id;
                        foundMediaType = searchMediaType;
                    }
                }
            }
            
            // 3. If we found a TMDB ID but still don't have an IMDb ID, fetch from TMDB
            if (foundTmdbId && !foundImdbId && foundMediaType) {
                const externalIdsRes = await fetch(`https://api.themoviedb.org/3/${foundMediaType}/${foundTmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
                if (externalIdsRes.ok) {
                    const externalIdsData = await externalIdsRes.json();
                    if (externalIdsData.imdb_id) foundImdbId = externalIdsData.imdb_id;
                }
            }

            // 4. Final check and state update
            if (foundTmdbId || foundImdbId) {
                 setMediaIds({ tmdb: foundTmdbId, mediaType: foundMediaType, imdb: foundImdbId });
                 
                 // Fetch seasons only if we have a TMDB ID and it's a TV show
                 if (foundMediaType === 'tv' && foundTmdbId) {
                    const tvDetailsRes = await fetch(`https://api.themoviedb.org/3/tv/${foundTmdbId}?api_key=${TMDB_API_KEY}`);
                    if (tvDetailsRes.ok) {
                        const tvDetailsData = await tvDetailsRes.json();
                        const validSeasons = tvDetailsData.seasons
                            .filter((s: any) => s.season_number > 0 && s.episode_count > 0)
                            .map((s:any) => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name }));
                        setSeasons(validSeasons);
                        if (validSeasons.length > 0 && currentSeason === 1) {
                           const hasSeason1 = validSeasons.some(s => s.season_number === 1);
                           if (!hasSeason1) {
                               setCurrentSeason(validSeasons[0].season_number);
                           }
                        }
                    }
                 }
            } else {
                setError(`Could not find a reliable streaming ID for "${fullAnimeData.title}".`);
                setMediaIds({tmdb: null, imdb: null, mediaType: foundMediaType});
            }
            
            const mappedRecommendations: Anime[] = recommendationsData.data.slice(0, 6).map((rec: any) => {
                const recItem = rec.entry;
                return {
                    id: recItem.mal_id,
                    title: recItem.title,
                    thumbnail: recItem.images.jpg.large_image_url, bannerImage: recItem.images.jpg.large_image_url, synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: true, hasDub: false,
                };
            });
            setRelatedAnime(mappedRecommendations);

        } catch (e) {
             if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred while fetching details.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    fetchAnimeDetails();
  }, [anime]);

  useEffect(() => {
    const url = buildSourceUrl(
        mediaIds.mediaType,
        mediaIds.tmdb,
        mediaIds.mediaType === 'tv' ? currentSeason : undefined,
        mediaIds.mediaType === 'tv' ? currentEpisode : undefined
    );
    setSourceUrl(url);
  }, [mediaIds, currentSeason, currentEpisode]);
  
  // Load progress on initial mount for the anime
  useEffect(() => {
    const savedProgress = localStorage.getItem(`anistream-progress-${anime.id}`);
    if (savedProgress) {
        try {
            const { season, episode } = JSON.parse(savedProgress);
            if (season) setCurrentSeason(season);
            if (episode) setCurrentEpisode(episode);
        } catch(e) { /* Fallback to default */ }
    } else {
        setCurrentSeason(1);
        setCurrentEpisode(1);
    }
  }, [anime.id]);

  // Save progress whenever episode or season changes
  useEffect(() => {
    if (playerAnime) {
        localStorage.setItem(`anistream-progress-${playerAnime.id}`, JSON.stringify({
            season: currentSeason,
            episode: currentEpisode
        }));
    }
  }, [currentEpisode, currentSeason, playerAnime]);

  useEffect(() => {
    const fetchSeasonEpisodes = async () => {
      if (mediaIds.mediaType !== 'tv' || !mediaIds.tmdb || !currentSeason) {
        setEpisodes([]);
        return;
      }
      setIsLoadingEpisodes(true);
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${mediaIds.tmdb}/season/${currentSeason}?api_key=${TMDB_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch episode data from TMDB.');
        const data = await res.json();
        setEpisodes(data.episodes || []);
      } catch (e) {
        console.error(e);
        setEpisodes([]);
      } finally {
        setIsLoadingEpisodes(false);
      }
    };
    fetchSeasonEpisodes();
  }, [mediaIds.mediaType, mediaIds.tmdb, currentSeason]);

  const handleNextEpisode = () => {
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
  };

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
  
  if (!playerAnime) {
      return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
             <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8 mx-auto">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" /><span>Back to Browse</span>
            </button>
            <p className="text-xl text-[rgb(var(--color-danger))]">{error || 'Could not load anime details.'}</p>
        </div>
      );
  }
  
  const headerEpisodeText = mediaIds.mediaType === 'tv' ? `S${currentSeason} E${currentEpisode}` : (playerAnime?.totalEpisodes ?? 0) > 1 ? `Episode ${currentEpisode}` : 'Movie';

  return (
    <div className="animate-fade-in">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="mb-6"><button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group"><ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" /><span>Back to Browse</span></button></div>

             <h1 className="text-3xl md:text-5xl font-bold text-[rgb(var(--text-primary))] mb-4" style={{ textShadow: `0 0 10px rgb(var(--shadow-color) / 0.5)` }}>
                {playerAnime.title}
            </h1>

            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-[rgb(var(--bg-gradient-start))/0.5] relative mb-4">
              {sourceUrl ? (
                <iframe
                  // By adding a key, we force the iframe to re-render when the source URL changes
                  key={sourceUrl}
                  src={sourceUrl}
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allowFullScreen
                  referrerPolicy="origin"
                  title={`Player for ${playerAnime.title}`}
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Player Error</p>
                  <p className="text-[rgb(var(--text-muted))]">{error || "Could not generate a valid streaming source for this title."}</p>
                  <p className="text-xs text-gray-500 mt-4">This can happen if no TMDB or IMDb ID was found.</p>
                </div>
              )}
            </div>

            <div className="bg-[rgb(var(--surface-2))/0.5] rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                    {mediaIds.mediaType === 'tv' && seasons.length > 0 ? (
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <button onClick={handlePrevEpisode} disabled={isFirstEpisodeOverall} className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.6] hover:bg-[rgb(var(--surface-4))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Previous Episode">
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <p className="text-[rgb(var(--color-primary-accent))] font-semibold text-lg text-center w-28 tabular-nums">{headerEpisodeText}</p>
                            <button onClick={handleNextEpisode} disabled={isLastEpisodeOverall} className="p-2 rounded-full bg-[rgb(var(--surface-3))/0.6] hover:bg-[rgb(var(--surface-4))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Next Episode">
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <p className="text-[rgb(var(--color-primary-accent))] font-semibold text-lg text-center sm:text-left">{headerEpisodeText}</p>
                    )}
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="hidden md:flex items-center gap-2 text-[rgb(var(--text-muted))] text-xs">
                        <FullscreenIcon className="w-4 h-4" />
                        <span>Use player controls for fullscreen, volume, & speed.</span>
                    </div>
                </div>
            </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-[rgb(var(--surface-2))/0.5] rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>Synopsis</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {playerAnime.genres.map(genre => (<span key={genre} className="px-3 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.3] text-[rgb(var(--text-on-accent))]">{genre}</span>))}
                </div>
                <p className="text-[rgb(var(--text-secondary))] mb-4 text-sm max-h-32 overflow-y-auto">{playerAnime.synopsis}</p>
                <div className="text-sm space-y-2 text-[rgb(var(--text-muted))] border-t border-[rgb(var(--border-color))] pt-4">
                    {playerAnime.releaseYear && <p><span className="font-semibold text-[rgb(var(--text-primary))]">Release:</span> {playerAnime.releaseYear}</p>}
                    <p><span className="font-semibold text-[rgb(var(--text-primary))]">Status:</span> {playerAnime.status}</p>
                    <p><span className="font-semibold text-[rgb(var(--text-primary))]">Studio:</span> {playerAnime.studio}</p>
                    {playerAnime.rating && <p><span className="font-semibold text-[rgb(var(--text-primary))]">Rating:</span> {playerAnime.rating}/10</p>}
                    {mediaIds.tmdb && <p><span className="font-semibold text-[rgb(var(--text-primary))]">TMDB ID:</span> {mediaIds.tmdb}</p>}
                    {mediaIds.imdb && <p><span className="font-semibold text-[rgb(var(--text-primary))]">IMDb ID:</span> {mediaIds.imdb}</p>}
                </div>
            </div>

            {mediaIds.mediaType === 'tv' && (
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Episodes</h3>
                        {seasons.length > 1 && (
                            <div className="flex items-center space-x-2">
                                <label htmlFor="season-select" className="text-sm font-semibold text-[rgb(var(--text-secondary))]">Season:</label>
                                <select 
                                    id="season-select" 
                                    value={currentSeason} 
                                    onChange={(e) => {setCurrentSeason(Number(e.target.value)); setCurrentEpisode(1);}} 
                                    className="text-sm bg-[rgb(var(--surface-input))/0.6] border-0 rounded-md p-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]"
                                >
                                    {seasons.map(season => (<option key={season.season_number} value={season.season_number}>{season.name || `Season ${season.season_number}`}</option>))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                        {isLoadingEpisodes && <p className="text-[rgb(var(--text-muted))]">Loading episodes...</p>}
                        {!isLoadingEpisodes && episodes.length > 0 ? episodes.map(ep => (
                            <button key={ep.episode_number} onClick={() => setCurrentEpisode(ep.episode_number)} className={`flex-shrink-0 w-48 text-left rounded-lg group transition-all duration-300 overflow-hidden ${currentEpisode === ep.episode_number ? 'ring-2 ring-[rgb(var(--border-focus))]' : 'ring-0 ring-transparent hover:ring-2 hover:ring-[rgb(var(--border-focus))]/50'}`}>
                                <div className="aspect-video relative">
                                    <img src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : playerAnime.bannerImage} alt={`Episode ${ep.episode_number}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                </div>
                                <div className="p-2 bg-[rgb(var(--surface-2))/0.7]">
                                    <p className={`font-semibold text-sm truncate ${currentEpisode === ep.episode_number ? 'text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-primary))]'}`}>E{ep.episode_number}: {ep.name}</p>
                                </div>
                            </button>
                        )) : !isLoadingEpisodes && <p className="text-[rgb(var(--text-muted))]">No episode information available for this season.</p>}
                    </div>
                </div>
            )}

            <Comments anime={playerAnime} />
            <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6 text-[rgb(var(--text-primary))]" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>Related Anime</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {relatedAnime.map(relAnime => (<AnimeCard key={relAnime.id} anime={relAnime} onSelect={onSelectRelated} />))}
                </div>
            </div>
        </section>
    </div>
  );
};

export default Player;