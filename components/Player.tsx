import React, { useState, useEffect, useRef } from 'react';
import type { Anime } from '../types';
import { ChevronLeftIcon, PlusIcon, StarIcon, PlayCircleIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';
import Comments from './Comments';
import { useContinueWatching } from '../hooks/useContinueWatching';


interface PlayerProps {
  anime: Anime;
  onGoBack: () => void;
  onSelectRelated: (anime: Anime) => void;
}

const Player: React.FC<PlayerProps> = ({ anime, onGoBack, onSelectRelated }) => {
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [relatedAnime, setRelatedAnime] = useState<Anime[]>([]);
  const [episodeThumbnails, setEpisodeThumbnails] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
  const [server, setServer] = useState('vidsrc-embed.ru');

  const { updateProgress } = useContinueWatching();
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
        if (!anime) return;
        window.scrollTo(0, 0);
        setIsLoading(true);
        setError(null);
        setPlayerAnime(null);
        setTmdbId(null);
        setEpisodeThumbnails({});

        try {
            const [fullDetailsRes, externalLinksRes, recommendationsRes, videosRes] = await Promise.all([
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/full`),
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/external`),
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/recommendations`),
                fetch(`https://api.jikan.moe/v4/anime/${anime.id}/videos`),
            ]);

            if (!fullDetailsRes.ok || !externalLinksRes.ok || !recommendationsRes.ok) {
                throw new Error('Failed to fetch detailed anime data from Jikan.');
            }

            const fullDetailsData = await fullDetailsRes.json();
            const externalLinksData = await externalLinksRes.json();
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

            if (videosRes.ok) {
                const videosData = await videosRes.json();
                 if (videosData.data.episodes) {
                    const thumbnails = videosData.data.episodes.reduce((acc: Record<number, string>, ep: any) => {
                        if (ep.mal_id && ep.images?.jpg?.image_url) {
                            acc[ep.mal_id] = ep.images.jpg.image_url;
                        }
                        return acc;
                    }, {});
                    setEpisodeThumbnails(thumbnails);
                }
            } else {
                console.warn(`Could not fetch episode thumbnails for anime ID ${anime.id}`);
            }

            const tmdbLink = externalLinksData.data.find((link: any) => link.name === 'TheMovieDB');
            if (tmdbLink) {
                const idFromUrl = tmdbLink.url.split('/').pop();
                setTmdbId(parseInt(idFromUrl, 10));
            } else {
                 setError(`Streaming not available: No TMDB ID found for ${anime.title}.`);
            }
            
            const mappedRecommendations: Anime[] = recommendationsData.data.slice(0, 6).map((rec: any) => {
                const recItem = rec.entry;
                return {
                    id: recItem.mal_id,
                    title: recItem.title,
                    thumbnail: recItem.images.jpg.large_image_url,
                    bannerImage: recItem.images.jpg.large_image_url,
                    synopsis: '', genres: [], releaseYear: null, status: 'Ongoing', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: true, hasDub: false,
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
    
    const savedProgress = localStorage.getItem(`anistream-progress-${anime.id}`);
    if (savedProgress) {
        const { episode } = JSON.parse(savedProgress);
        setCurrentEpisode(episode || 1);
    } else {
        setCurrentEpisode(1);
    }
    setLanguage('sub');

  }, [anime]);

  useEffect(() => {
    if (playerAnime) {
        updateProgress(playerAnime.id, currentEpisode, playerAnime.totalEpisodes || 1);
    }
  }, [currentEpisode, playerAnime, updateProgress]);

  const streamUrl = tmdbId ? `https://${server}/embed/series/${tmdbId}/1/${currentEpisode}${language === 'dub' ? '?lang=dub' : ''}` : '';

  const totalEpisodes = playerAnime?.totalEpisodes || 0;
  const episodeList = Array.from({ length: totalEpisodes }, (_, i) => i + 1);
  
  const handleNextEpisode = () => {
    if (currentEpisode < totalEpisodes) setCurrentEpisode(currentEpisode + 1);
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) setCurrentEpisode(currentEpisode - 1);
  };

  const handleWatchNowClick = () => {
    playerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) return <div className="text-center p-20 text-xl font-semibold text-purple-300">Loading Player...</div>;
  
  if (!playerAnime) {
      return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
             <button onClick={onGoBack} className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors group mb-8 mx-auto">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Browse</span>
            </button>
            <p className="text-xl text-red-400">{error || 'Could not load anime details.'}</p>
        </div>
      );
  }

  return (
    <div className="animate-fade-in">
        <section className="relative h-[60vh] md:h-[70vh] w-full flex items-end p-4 md:p-12 text-white overflow-hidden">
            <div className="absolute inset-0">
                <img src={playerAnime.bannerImage} alt={`${playerAnime.title} banner`} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent"></div>
            </div>
            <div className="relative z-10 flex flex-col items-start max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-bold" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>{playerAnime.title}</h1>
                <p className="text-lg mt-2 text-purple-300">Episode {currentEpisode}</p>
                 <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-4 text-gray-300 text-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      {playerAnime.hasSub && <span className="px-3 py-1 bg-purple-600/80 text-white rounded-full text-xs backdrop-blur-sm">Sub</span>}
                      {playerAnime.hasDub && <span className="px-3 py-1 bg-indigo-600/80 text-white rounded-full text-xs backdrop-blur-sm">Dub</span>}
                    </div>
                    {playerAnime.rating && (<div className="flex items-center gap-1"><StarIcon /><span className="font-semibold">{playerAnime.rating}</span></div>)}
                    {playerAnime.type && (<span className="font-semibold">{playerAnime.type}</span>)}
                    <span className="font-semibold">{playerAnime.status}</span>
                </div>
                 <button onClick={handleWatchNowClick} className="mt-6 flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30">
                    <PlayCircleIcon /><span>Watch Now</span>
                </button>
            </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div ref={playerRef} className="mb-6">
                <button onClick={onGoBack} className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors group">
                    <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Browse</span>
                </button>
            </div>

            <div className="lg:flex lg:space-x-8">
                <div className="lg:w-2/3">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 bg-black flex items-center justify-center">
                        {streamUrl ? (
                             <iframe key={`${playerAnime.id}-${currentEpisode}-${server}-${language}`} src={streamUrl} title={`Player for ${playerAnime.title} - E${currentEpisode}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0"></iframe>
                        ) : (
                            <div className="text-center text-gray-400 p-4">{error || "Select an episode to begin."}</div>
                        )}
                    </div>
                    
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-2xl">
                         <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-300">Server:</span>
                                <select onChange={(e) => setServer(e.target.value)} value={server} className="bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 transition-all">
                                    <option value="vidsrc-embed.ru">VidSrc</option><option value="vidsrc.to">VidSrc.to</option><option value="vidsrc.pro">VidSrc Pro</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setLanguage('sub')} className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${language === 'sub' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-700/60 hover:bg-slate-600'}`}>Sub</button>
                                <button onClick={() => setLanguage('dub')} className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${language === 'dub' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-700/60 hover:bg-slate-600'}`}>Dub</button>
                            </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={handlePrevEpisode} disabled={currentEpisode === 1} className="px-4 py-2 bg-slate-700/60 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Prev</button>
                                <button onClick={handleNextEpisode} disabled={currentEpisode === totalEpisodes} className="px-4 py-2 bg-slate-700/60 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Next</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3 mt-8 lg:mt-0">
                    <div className="bg-slate-800/50 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4 text-white" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>{playerAnime.title}</h2>
                        <div className="flex flex-wrap gap-2 mb-4">{playerAnime.genres.map(genre => (<span key={genre} className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-800/70 text-purple-200">{genre}</span>))}</div>
                        <p className="text-gray-300 mb-4 text-sm max-h-24 overflow-y-auto">{playerAnime.synopsis}</p>
                        <div className="text-sm space-y-2 text-gray-400 border-t border-slate-700 pt-4">
                            {playerAnime.releaseYear && <p><span className="font-semibold text-gray-200">Release:</span> {playerAnime.releaseYear}</p>}
                            <p><span className="font-semibold text-gray-200">Status:</span> {playerAnime.status}</p>
                            <p><span className="font-semibold text-gray-200">Studio:</span> {playerAnime.studio}</p>
                            {playerAnime.rating && <p><span className="font-semibold text-gray-200">Rating:</span> {playerAnime.rating}/10</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-2xl font-bold mb-4 text-white">Episodes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {episodeList.length > 0 ? episodeList.map(ep => (
                         <button key={ep} onClick={() => setCurrentEpisode(ep)} className={`relative overflow-hidden rounded-lg group transition-all duration-300 ${currentEpisode === ep ? 'ring-2 ring-purple-500' : 'ring-0 ring-transparent hover:ring-2 hover:ring-purple-500/50'}`}>
                             <img src={episodeThumbnails[ep] || `https://picsum.photos/seed/ep${playerAnime.id}-${ep}/400/225`} alt={`Episode ${ep}`} className="w-full h-auto object-cover aspect-video transition-transform duration-300 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                             <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                                <p className={`font-semibold text-sm ${currentEpisode === ep ? 'text-purple-300' : 'text-white'}`}>Episode {ep}</p>
                             </div>
                         </button>
                     )) : <p className="text-gray-400 col-span-full">No episode information available.</p>}
                </div>
            </div>

            <Comments anime={playerAnime} />

            <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6 text-white" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>Related Anime</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {relatedAnime.map(relAnime => (
                        <AnimeCard key={relAnime.id} anime={relAnime} onSelect={onSelectRelated} />
                    ))}
                </div>
            </div>
        </section>
    </div>
  );
};

export default Player;
