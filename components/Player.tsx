import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Anime } from '../types';
import { ChevronLeftIcon, PlusIcon, FlagIcon, PlayCircleIcon } from './icons/Icons';
import { ANIME_DATA } from '../constants';
import AnimeCard from './AnimeCard';


interface PlayerProps {
  anime: Anime;
  onGoBack: () => void;
  onSelectRelated: (anime: Anime) => void;
}

const Player: React.FC<PlayerProps> = ({ anime, onGoBack, onSelectRelated }) => {
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
  const [server, setServer] = useState('vidsrc-embed.ru');

  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when anime changes
    const savedProgress = localStorage.getItem(`anistream-progress-${anime.tmdbId}`);
    if (savedProgress) {
      const { season, episode } = JSON.parse(savedProgress);
      setCurrentSeason(season || 1);
      setCurrentEpisode(episode || 1);
    } else {
      setCurrentSeason(1);
      setCurrentEpisode(1);
    }
    setLanguage('sub'); // Default to sub
  }, [anime.tmdbId]);

  useEffect(() => {
    localStorage.setItem(`anistream-progress-${anime.tmdbId}`, JSON.stringify({ season: currentSeason, episode: currentEpisode }));
  }, [currentSeason, currentEpisode, anime.tmdbId]);

  const streamUrl = `https://${server}/embed/series/${anime.tmdbId}/${currentSeason}/${currentEpisode}${language === 'dub' ? '?lang=dub' : ''}`;

  const relatedAnime = useMemo(() => {
    return ANIME_DATA.filter(
      (a) => a.id !== anime.id && a.genres.some((g) => anime.genres.includes(g))
    ).slice(0, 6);
  }, [anime.id, anime.genres]);

  const totalEpisodesInSeason = anime.seasons.find(s => s.season === currentSeason)?.episodes || 0;
  const episodeList = Array.from({ length: totalEpisodesInSeason }, (_, i) => i + 1);
  
  const handleNextEpisode = () => {
    if (currentEpisode < totalEpisodesInSeason) {
      setCurrentEpisode(currentEpisode + 1);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      setCurrentEpisode(currentEpisode - 1);
    }
  };
  
  const handleSeasonChange = (seasonNumber: number) => {
    setCurrentSeason(seasonNumber);
    setCurrentEpisode(1); // Reset to first episode of new season
  }

  const handleWatchNowClick = () => {
    playerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in">
        {/* Banner Section */}
        <section className="relative h-[60vh] md:h-[70vh] w-full flex items-end p-4 md:p-12 text-white overflow-hidden">
            <div className="absolute inset-0">
                <img src={anime.bannerImage} alt={`${anime.title} banner`} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent"></div>
            </div>
            <div className="relative z-10 flex flex-col items-start max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-bold" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.8)' }}>{anime.title}</h1>
                <p className="text-lg mt-2 text-purple-300">Season {currentSeason} • Episode {currentEpisode}</p>
                <div className="flex items-center gap-3 mt-4">
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-black/50 backdrop-blur-sm border border-white/20">Sub</span>
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-black/50 backdrop-blur-sm border border-white/20">Dub</span>
                </div>
                 <button onClick={handleWatchNowClick} className="mt-6 flex items-center gap-2 px-6 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30">
                    <PlayCircleIcon />
                    <span>Watch Now</span>
                </button>
            </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={playerRef}>
             <div className="mb-6">
                <button
                onClick={onGoBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors duration-300 group"
                >
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Browse</span>
                </button>
            </div>

            {/* Player and Info */}
            <div className="lg:flex lg:space-x-8">
                <div className="lg:w-2/3">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 bg-black">
                        <iframe
                        key={`${anime.tmdbId}-${currentSeason}-${currentEpisode}-${server}-${language}`}
                        src={streamUrl}
                        title={`Player for ${anime.title} - S${currentSeason} E${currentEpisode}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                        ></iframe>
                    </div>

                    {/* Controls */}
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-2xl">
                         <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-300">Server:</span>
                                <select onChange={(e) => setServer(e.target.value)} value={server} className="bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 transition-all">
                                    <option value="vidsrc-embed.ru">VidSrc</option>
                                    <option value="vidsrc.to">VidSrc.to</option>
                                    <option value="vidsrc.pro">VidSrc Pro</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => setLanguage('sub')} className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${language === 'sub' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-700/60 hover:bg-slate-600'}`}>Sub</button>
                                <button onClick={() => setLanguage('dub')} className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${language === 'dub' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-700/60 hover:bg-slate-600'}`}>Dub</button>
                            </div>
                             <div className="flex items-center space-x-2">
                                <button onClick={handlePrevEpisode} disabled={currentEpisode === 1} className="px-4 py-2 bg-slate-700/60 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Prev</button>
                                <button onClick={handleNextEpisode} disabled={currentEpisode === totalEpisodesInSeason} className="px-4 py-2 bg-slate-700/60 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">Next</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Anime Info Side Panel */}
                <div className="lg:w-1/3 mt-8 lg:mt-0">
                    <div className="bg-slate-800/50 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold mb-4 text-white" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>
                            {anime.title}
                        </h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {anime.genres.map(genre => (
                                <span key={genre} className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-800/70 text-purple-200">{genre}</span>
                            ))}
                        </div>
                        <p className="text-gray-300 mb-4 text-sm max-h-24 overflow-y-auto">{anime.synopsis}</p>
                        <div className="text-sm space-y-2 text-gray-400 border-t border-slate-700 pt-4">
                            <p><span className="font-semibold text-gray-200">Release:</span> {anime.releaseYear}</p>
                            <p><span className="font-semibold text-gray-200">Status:</span> {anime.status}</p>
                            <p><span className="font-semibold text-gray-200">Studio:</span> {anime.studio}</p>
                            <p><span className="font-semibold text-gray-200">Rating:</span> {anime.rating}/10</p>
                        </div>
                        <button className="mt-6 w-full flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors shadow-lg shadow-purple-500/30">
                            <PlusIcon />
                            <span>Add to My List</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Episodes Section */}
            <div className="mt-12">
                <div className="flex items-center space-x-4 border-b border-slate-700 mb-4">
                    {anime.seasons.map(season => (
                        <button 
                            key={season.season} 
                            onClick={() => handleSeasonChange(season.season)}
                            className={`py-3 px-2 font-semibold transition-colors ${currentSeason === season.season ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            Season {season.season}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {episodeList.map(ep => (
                         <button key={ep} onClick={() => setCurrentEpisode(ep)} className={`relative overflow-hidden rounded-lg group transition-all duration-300 ${currentEpisode === ep ? 'ring-2 ring-purple-500' : ''}`}>
                             <img src={`https://picsum.photos/seed/ep${anime.id}-${currentSeason}-${ep}/400/225`} alt={`Episode ${ep}`} className="w-full h-auto object-cover aspect-video transition-transform duration-300 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                             <div className="absolute bottom-2 left-3 text-left">
                                <p className={`font-semibold text-sm ${currentEpisode === ep ? 'text-purple-300' : 'text-white'}`}>Episode {ep}</p>
                             </div>
                         </button>
                     ))}
                </div>
            </div>

            {/* Related Anime */}
            <div className="mt-12">
                <h3 className="text-2xl font-bold mb-6 text-white" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>Related Anime</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {relatedAnime.map(relAnime => (
                        <AnimeCard key={relAnime.id} anime={relAnime} onSelect={onSelectRelated} />
                    ))}
                </div>
            </div>

             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
             `}</style>
        </section>
    </div>
  );
};

export default Player;
