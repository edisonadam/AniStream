import React, { useState, useEffect } from 'react';
import type { Anime } from '../types';
import { mapJikanToAnime } from '../api';
import { getFranchiseTitle } from '../utils';

// Consumet API response type
interface RecentEpisode {
    id: string;
    episodeId: string;
    episodeNumber: number;
    title: string;
    image: string;
    url: string;
}

interface FeaturedSlideshowProps {
  onAnimeSelect: (anime: Anime) => void;
  allAnime: Anime[];
}

const FeaturedSlideshow: React.FC<FeaturedSlideshowProps> = ({ onAnimeSelect, allAnime }) => {
    const [recentEpisodes, setRecentEpisodes] = useState<RecentEpisode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecent = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('https://api.consumet.org/anime/gogoanime/recent-episodes');
                if (!res.ok) throw new Error('Failed to fetch recent episodes from Consumet API');
                const data = await res.json();

                const uniqueEpisodesMap = new Map();
                data.results.forEach((ep: any) => {
                    const franchiseTitle = getFranchiseTitle(ep.title);
                    if (!uniqueEpisodesMap.has(franchiseTitle)) {
                        uniqueEpisodesMap.set(franchiseTitle, ep);
                    }
                });
                
                const uniqueEpisodes = Array.from(uniqueEpisodesMap.values());
                setRecentEpisodes(uniqueEpisodes.slice(0, 20) as RecentEpisode[]);
            } catch (error) {
                console.error("Error fetching recent episodes:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecent();
    }, []);

    const handleEpisodeClick = async (episode: RecentEpisode) => {
        setIsNavigating(episode.id);
        try {
            const knownAnime = allAnime.find(a => a.title.toLowerCase() === episode.title.toLowerCase());
            if (knownAnime) {
                onAnimeSelect(knownAnime);
                return;
            }

            const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(episode.title)}&limit=1`);
            if (!res.ok) throw new Error('Anime not found on Jikan API');
            
            const searchData = await res.json();
            const item = searchData.data[0];

            if (item) {
                const mappedAnime = mapJikanToAnime(item);
                if (mappedAnime) {
                    onAnimeSelect(mappedAnime);
                } else {
                    console.warn(`Could not map anime matching "${episode.title}"`);
                    setIsNavigating(null);
                }
            } else {
                console.warn(`Could not find anime matching "${episode.title}"`);
                setIsNavigating(null);
            }
        } catch (error) {
            console.error("Error navigating to anime:", error);
            setIsNavigating(null);
        }
    };

    if (isLoading) {
        return (
            <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="h-8 bg-[rgb(var(--surface-3))] rounded-md w-1/3 mb-6 animate-pulse"></div>
                <div className="flex gap-4 md:gap-6 overflow-x-hidden">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-48 animate-pulse">
                            <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))] rounded-[2rem]"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
    
    if(recentEpisodes.length === 0) return null;

    return (
         <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] mb-6" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                Recently Aired
            </h2>
             <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: 'thin' }}>
                {recentEpisodes.map(ep => (
                    <div key={ep.id} onClick={() => handleEpisodeClick(ep)} className="slideshow-card-touch-target group flex-shrink-0 w-48 cursor-pointer">
                        <div 
                            className="relative aspect-[2/3] w-full overflow-hidden rounded-[2rem] shadow-lg transform transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-[rgb(var(--shadow-color))/0.5] group-hover:-translate-y-2 group-hover:scale-[1.03]"
                        >
                           <img src={ep.image} alt={ep.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                           
                           <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                               <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-black/60 text-white backdrop-blur-md">
                                   Ep {ep.episodeNumber}
                               </span>
                           </div>

                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                                {isNavigating === ep.id ? (
                                    <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                                )}
                           </div>

                           <div className="absolute bottom-0 left-0 right-0 p-3">
                               <h3 className="text-white font-bold text-sm truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                                   {ep.title}
                               </h3>
                           </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeaturedSlideshow;