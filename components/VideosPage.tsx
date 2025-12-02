
import React, { useState, useEffect } from 'react';
import type { Anime, NewsPromo } from '../types';
import { fetchWithRetry } from '../api';
import { PlayIcon, ChevronLeftIcon, CloseIcon, ExclamationTriangleIcon } from './icons/Icons';

interface VideosPageProps {
  onGoBack: () => void;
  onAnimeSelect: (anime: Anime) => void;
}

type SortOrder = 'newest' | 'trending';
type ActiveTab = 'trailers' | 'intros';

const VideosPage: React.FC<VideosPageProps> = ({ onGoBack, onAnimeSelect }) => {
  const [trailers, setTrailers] = useState<NewsPromo[]>([]);
  const [introsOutros, setIntrosOutros] = useState<any[]>([]);
  
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(true);
  const [isLoadingIntrosOutros, setIsLoadingIntrosOutros] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<{ key: string, type: 'youtube' | 'direct' } | null>(null);
  
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activeTab, setActiveTab] = useState<ActiveTab>('trailers');
  
  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== activeTab) {
        setActiveTab(tab);
        setSortOrder('newest'); // Reset sort order on tab change for consistency
    }
  };

  useEffect(() => {
    if (activeTab !== 'trailers') return;

    const getTrailers = async () => {
      setIsLoadingTrailers(true);
      setError(null);
      setTrailers([]);
      try {
        const url = sortOrder === 'trending'
          ? 'https://api.jikan.moe/v4/seasons/now?limit=25'
          : 'https://api.jikan.moe/v4/watch/promos?limit=50';
        
        const res = await fetchWithRetry(url);
        if (!res.ok) throw new Error('Failed to fetch latest promos.');
        const data = await res.json();

        if (sortOrder === 'trending') {
            const promosFromTrending = (data.data || []).map((anime: any): NewsPromo | null => {
                if (!anime.trailer?.youtube_id) return null;
                return {
                    title: anime.trailer.title || 'Official Trailer',
                    trailer: { youtube_id: anime.trailer.youtube_id, url: anime.trailer.url, embed_url: anime.trailer.embed_url },
                    entry: { mal_id: anime.mal_id, url: anime.url, images: anime.images, title: anime.title }
                };
            }).filter((p): p is NewsPromo => p !== null);
            setTrailers(promosFromTrending);
        } else {
            setTrailers(data.data || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setIsLoadingTrailers(false);
      }
    };
    getTrailers();
  }, [sortOrder, activeTab]);

   useEffect(() => {
        if (activeTab !== 'intros') return;

        const getIntrosOutros = async () => {
            setIsLoadingIntrosOutros(true);
            setError(null);
            setIntrosOutros([]);

            try {
                // Using AnimeThemes API
                const url = `https://api.animethemes.moe/animetheme?sort=-created_at&page[size]=24&include=song,anime,animethemeentries.videos`;
                const res = await fetchWithRetry(url);
                
                if (!res.ok) throw new Error('Failed to fetch newest intros/outros from AnimeThemes.');
                const themesData = await res.json();
                
                // AnimeThemes uses a JSON:API structure, need to map included resources manually
                const includedMap = new Map<string, Map<string, any>>();
                (themesData.included || []).forEach((item: any) => {
                    if (!includedMap.has(item.type)) includedMap.set(item.type, new Map());
                    includedMap.get(item.type)!.set(item.id, item);
                });
                const findIncluded = (type: string, id: string) => includedMap.get(type)?.get(id);

                const parsedThemes = (themesData.data || []).map((theme: any) => {
                    const animeRel = theme.relationships.anime.data;
                    const songRel = theme.relationships.song.data;
                    const entriesRel = theme.relationships.animethemeentries.data;

                    if (!animeRel || !songRel || !entriesRel || entriesRel.length === 0) return null;
                    
                    const anime = findIncluded('anime', animeRel.id);
                    const song = findIncluded('song', songRel.id);
                    const entry = findIncluded('animethemeentry', entriesRel[0].id);
                    if (!anime || !song || !entry) return null;

                    const videosRel = entry.relationships.videos.data;
                    if (!videosRel || videosRel.length === 0) return null;

                    // Prefer NC (creditless) videos
                    const videos = videosRel.map((v_rel: any) => findIncluded('video', v_rel.id)).filter(Boolean);
                    const bestVideo = videos.find((v: any) => v.attributes.tags?.includes('NC')) || videos[0];

                    if (!bestVideo) return null;
                    
                    // Try to find MAL ID for linking
                    const malResource = anime.attributes.resources?.find((r: any) => r.site === 'MyAnimeList');

                    return {
                        id: theme.id,
                        type: theme.attributes.type,
                        sequence: theme.attributes.sequence,
                        song_title: song.attributes.title,
                        anime_name: anime.attributes.name,
                        anime_mal_id: malResource?.external_id,
                        anime_image: anime.attributes.images?.find((img: any) => img.facet === 'Large Cover')?.link || `https://api.dicebear.com/8.x/shapes/svg?seed=${anime.attributes.name}`,
                        video_link: bestVideo.attributes.link,
                        video_tags: bestVideo.attributes.tags,
                    };
                }).filter(Boolean);
                
                setIntrosOutros(parsedThemes);

            } catch (e) {
                console.error(e);
                setError(e instanceof Error ? e.message : 'An error occurred while fetching intros/outros.');
            } finally {
                setIsLoadingIntrosOutros(false);
            }
        };

        getIntrosOutros();

    }, [activeTab, sortOrder]);

  const createAnimeStub = (entry: { mal_id: number; title: string; images: { jpg: { image_url: string } } }): Anime => ({
      id: entry.mal_id,
      title: entry.title,
      title_english: entry.title,
      title_japanese: '',
      thumbnail: entry.images.jpg.image_url,
      bannerImage: entry.images.jpg.image_url,
      synopsis: 'No synopsis available.',
      genres: [], releaseYear: null, status: 'Upcoming', totalEpisodes: null, rating: null, type: null, studio: 'Unknown',
      hasSub: true, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false,
      seasons_count: null, episodes_count: null,
  });

  const handleAnimeClick = (promo: NewsPromo) => { onAnimeSelect(createAnimeStub(promo.entry)); };
  
  const handleAnimeClickFromTheme = (theme: any) => {
    onAnimeSelect({
        id: theme.anime_mal_id, title: theme.anime_name, thumbnail: theme.anime_image, bannerImage: theme.anime_image,
        ...({} as Omit<Anime, 'id' | 'title' | 'thumbnail' | 'bannerImage'>)
    });
  };

  const CardSkeleton: React.FC = () => (
    <div className="bg-[rgb(var(--surface-2))] rounded-2xl animate-pulse">
      <div className="aspect-video w-full bg-[rgb(var(--surface-3))] rounded-t-2xl"></div>
      <div className="p-4"><div className="h-5 bg-[rgb(var(--surface-4))] rounded w-3/4 mb-3"></div><div className="h-4 bg-[rgb(var(--surface-4))] rounded w-1/2"></div></div>
    </div>
  );
  
  const IntroOutroCard: React.FC<{ theme: any }> = ({ theme }) => (
    <div className="group bg-[rgb(var(--surface-2))] rounded-2xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:-translate-y-1">
        <div className="aspect-video w-full relative">
            <img loading="lazy" src={theme.anime_image} alt={theme.anime_name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <button onClick={() => setPlayingVideo({ key: theme.video_link, type: 'direct' })} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                <PlayIcon className="w-12 h-12 text-white" />
            </button>
        </div>
        <div className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))] mb-1 truncate">{`${theme.type}${theme.sequence || ''} - ${theme.song_title}`}</p>
            <button onClick={() => theme.anime_mal_id && handleAnimeClickFromTheme(theme)} className="font-bold text-[rgb(var(--text-primary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors text-left truncate w-full disabled:cursor-default" disabled={!theme.anime_mal_id}>
                {theme.anime_name}
            </button>
        </div>
    </div>
  );

  return (
    <>
      {playingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-cinematic-fade-in p-4" onClick={() => setPlayingVideo(null)}>
            <div className="bg-black rounded-2xl w-full max-w-4xl aspect-video relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setPlayingVideo(null)} className="absolute -top-10 right-0 text-white hover:text-[rgb(var(--color-primary-accent))] z-10"><CloseIcon /></button>
                {playingVideo.type === 'youtube' ? (
                    <iframe src={`https://www.youtube.com/embed/${playingVideo.key}?autoplay=1`} title="Trailer" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen className="w-full h-full rounded-2xl" />
                ) : (
                    <video src={playingVideo.key} controls autoPlay className="w-full h-full rounded-2xl bg-black" />
                )}
            </div>
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
          <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
              <ChevronLeftIcon className="w-6 h-6" /><span>Back</span>
          </button>
          
          <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-2" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>Trailers & Intros/Outros</h1>
          <p className="text-[rgb(var(--text-muted))] mb-6">Discover the latest promotional videos and theme songs.</p>
          
          <div className="flex justify-center border-b border-white/10 mb-8">
              <button onClick={() => handleTabChange('trailers')} className={`flex items-center gap-2 px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'trailers' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>
                Trailers
              </button>
              <button onClick={() => handleTabChange('intros')} className={`flex items-center gap-2 px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'intros' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>
                Intros & Outros
              </button>
          </div>

          <div key={activeTab} className="animate-cinematic-fade-in">
              {(activeTab === 'trailers' || activeTab === 'intros') && (
                <div className="flex justify-end mb-6">
                    <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                        <button onClick={() => setSortOrder('newest')} className={`px-3 py-1 text-sm rounded-full ${sortOrder === 'newest' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold' : 'text-[rgb(var(--text-muted))]'}`}>Newest</button>
                        <button onClick={() => setSortOrder('trending')} className={`px-3 py-1 text-sm rounded-full ${sortOrder === 'trending' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold' : 'text-[rgb(var(--text-muted))]'}`}>Trending</button>
                    </div>
                </div>
              )}

              {activeTab === 'trailers' && (
                  <>
                    {error && <p className="col-span-full text-center text-red-500">{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoadingTrailers ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />) : trailers.map(promo => {
                            const youtubeId = promo.trailer?.youtube_id;
                            if (!youtubeId) return null;
                            return (
                                <div key={promo.entry.mal_id + promo.title} className="group bg-[rgb(var(--surface-2))] rounded-2xl shadow-lg overflow-hidden">
                                    <div className="aspect-video w-full relative">
                                        <img loading="lazy" src={promo.entry.images.jpg.image_url} alt={promo.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                        <button onClick={() => setPlayingVideo({ key: youtubeId, type: 'youtube' })} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50"><PlayIcon className="w-12 h-12 text-white" /></button>
                                    </div>
                                    <div className="p-4"><p className="text-sm text-[rgb(var(--text-muted))] mb-1 truncate">{promo.title}</p><button onClick={() => handleAnimeClick(promo)} className="font-bold text-[rgb(var(--text-primary))] hover:text-[rgb(var(--color-primary-accent))] text-left truncate w-full">{promo.entry.title}</button></div>
                                </div>
                            );
                        }).filter(Boolean)}
                    </div>
                  </>
              )}
              {activeTab === 'intros' && (
                  <>
                    {error && <p className="col-span-full text-center text-red-500">{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoadingIntrosOutros ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />) : introsOutros.length > 0 ? introsOutros.map(theme => <IntroOutroCard key={theme.id} theme={theme} />) : <p className="col-span-full text-center py-12 text-[rgb(var(--text-muted))]">No intros or outros found for this selection.</p>}
                    </div>
                  </>
              )}
          </div>
      </div>
    </>
  );
};

export default VideosPage;
