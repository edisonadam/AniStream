


import React, { useState, useEffect } from 'react';
import { fetchWithRetry } from '../api';
import { ChevronLeftIcon, ExternalLinkIcon, HeartIcon } from './icons/Icons';
import type { Anime } from '../types';
import { mapJikanToAnime } from '../api';

interface VoiceActorPageProps {
    voiceActorId: number;
    onGoBack: () => void;
    onAnimeSelect: (anime: Anime) => void;
}

const VoiceActorPage: React.FC<VoiceActorPageProps> = ({ voiceActorId, onGoBack, onAnimeSelect }) => {
    const [actorData, setActorData] = useState<any>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);

    useEffect(() => {
        const fetchActorData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetchWithRetry(`https://api.jikan.moe/v4/people/${voiceActorId}/full`);
                if (!res.ok) throw new Error('Failed to fetch voice actor details');
                const data = await res.json();
                
                if (!data || !data.data) {
                    throw new Error('No data found for this voice actor.');
                }

                setActorData(data.data);
                
                // Sort roles: Main characters first, then Supporting.
                const rawRoles = data.data.voices || [];
                const sortedRoles = rawRoles.sort((a: any, b: any) => {
                    const roleA = a.role === 'Main' ? 1 : 0;
                    const roleB = b.role === 'Main' ? 1 : 0;
                    return roleB - roleA; // Descending order (1 before 0)
                });
                setRoles(sortedRoles);
            } catch (e) {
                console.error(e);
                setError(e instanceof Error ? e.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        if (voiceActorId) {
            fetchActorData();
        }
    }, [voiceActorId]);

    const handleAnimeClick = (role: any) => {
        if (!role?.anime?.mal_id) return;
        // Create a partial anime object to navigate. 
        // We ensure essential fields are present for mapJikanToAnime to work reasonably well or create a stub.
        const anime = mapJikanToAnime(role.anime);
        if (anime) {
            onAnimeSelect(anime);
        } else {
            // Fallback stub if mapping fails
            onAnimeSelect({
                id: role.anime.mal_id,
                title: role.anime.title || 'Unknown Title',
                title_english: role.anime.title,
                title_japanese: '',
                thumbnail: role.anime.images?.jpg?.large_image_url || role.anime.images?.jpg?.image_url || '',
                bannerImage: role.anime.images?.jpg?.large_image_url || role.anime.images?.jpg?.image_url || '',
                synopsis: '', genres: [], releaseYear: null, status: 'Completed', totalEpisodes: null, rating: null, type: null, studio: '', hasSub: true, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, seasons_count: null, episodes_count: null
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 animate-pulse">
                <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] mb-8">
                    <ChevronLeftIcon className="w-6 h-6" /><span>Back</span>
                </button>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-72 h-96 bg-[rgb(var(--surface-3))] rounded-2xl"></div>
                    <div className="flex-1 space-y-4">
                        <div className="h-10 bg-[rgb(var(--surface-3))] rounded w-1/2"></div>
                        <div className="h-6 bg-[rgb(var(--surface-3))] rounded w-1/4"></div>
                        <div className="h-48 bg-[rgb(var(--surface-3))] rounded w-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !actorData) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-red-400 text-lg mb-4">{error || 'Voice actor not found'}</p>
                <button onClick={onGoBack} className="px-6 py-2 bg-[rgb(var(--surface-3))] rounded-full hover:bg-[rgb(var(--surface-4))] transition-colors">Go Back</button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>

            <div className="flex flex-col md:flex-row gap-8 mb-12">
                <div className="w-full md:w-72 flex-shrink-0">
                    <img 
                        src={actorData.images?.jpg?.image_url} 
                        alt={actorData.name} 
                        className="w-full h-auto rounded-2xl shadow-xl object-cover"
                    />
                    <div className="mt-4 space-y-2 text-sm text-[rgb(var(--text-secondary))]">
                        {actorData.birthday && (
                            <div className="flex justify-between p-3 bg-[rgb(var(--surface-2))/0.5] rounded-xl">
                                <span className="text-[rgb(var(--text-muted))]">Birthday</span>
                                <span className="font-semibold">{new Date(actorData.birthday).toLocaleDateString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between p-3 bg-[rgb(var(--surface-2))/0.5] rounded-xl">
                            <span className="text-[rgb(var(--text-muted))]">Favorites</span>
                            <span className="font-semibold flex items-center gap-1"><HeartIcon className="w-4 h-4 text-red-400"/> {actorData.favorites?.toLocaleString() || 0}</span>
                        </div>
                        {actorData.website_url && (
                            <a href={actorData.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full p-3 bg-[rgb(var(--color-primary))/0.1] hover:bg-[rgb(var(--color-primary))/0.2] text-[rgb(var(--color-primary-accent))] rounded-xl font-semibold transition-colors">
                                <ExternalLinkIcon className="w-4 h-4" /> Official Website
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h1 className="text-4xl md:text-5xl font-bold text-[rgb(var(--text-primary))] mb-2">{actorData.name}</h1>
                    {(actorData.given_name || actorData.family_name) && (
                        <h2 className="text-xl text-[rgb(var(--text-muted))] mb-6">
                            {actorData.family_name} {actorData.given_name} {actorData.alternate_names?.length > 0 && `(${actorData.alternate_names.join(', ')})`}
                        </h2>
                    )}

                    {actorData.about && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[rgb(var(--color-primary-accent))] mb-3">About</h3>
                            <div className={`text-[rgb(var(--text-secondary))] whitespace-pre-wrap leading-relaxed relative ${!isAboutExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
                                {actorData.about}
                                {!isAboutExpanded && actorData.about.length > 300 && (
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgb(var(--bg-gradient-start))] to-transparent"></div>
                                )}
                            </div>
                            {actorData.about.length > 300 && (
                                <button 
                                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                    className="mt-2 text-sm font-bold text-[rgb(var(--color-primary-accent))] hover:underline"
                                >
                                    {isAboutExpanded ? 'Show Less' : 'Read More'}
                                </button>
                            )}
                        </div>
                    )}

                    <div>
                        <h3 className="text-2xl font-bold text-[rgb(var(--color-primary-accent))] mb-6 flex items-center gap-2">
                            Voice Acting Roles <span className="text-sm font-normal text-[rgb(var(--text-muted))] bg-[rgb(var(--surface-3))] px-2 py-1 rounded-full">{roles.length}</span>
                        </h3>
                        
                        {roles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {roles.map((role: any, index: number) => (
                                    <div key={`${role.anime.mal_id}-${role.character.mal_id}-${index}`} className="flex bg-[rgb(var(--surface-2))/0.6] rounded-xl overflow-hidden hover:bg-[rgb(var(--surface-3))] transition-colors group border border-white/5">
                                        <div className="w-20 cursor-pointer relative flex-shrink-0" onClick={() => handleAnimeClick(role)}>
                                            <img src={role.anime.images?.jpg?.image_url} alt={role.anime.title} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ExternalLinkIcon className="w-6 h-6 text-white"/>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                            <div className="mb-2">
                                                <p className="font-bold text-sm text-[rgb(var(--text-primary))] truncate cursor-pointer hover:text-[rgb(var(--color-primary-accent))]" onClick={() => handleAnimeClick(role)} title={role.anime.title}>
                                                    {role.anime.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <img src={role.character.images?.jpg?.image_url} alt={role.character.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-[rgb(var(--text-secondary))] truncate" title={role.character.name}>{role.character.name}</p>
                                                        <p className="text-[10px] text-[rgb(var(--text-muted))] truncate">{role.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[rgb(var(--text-muted))]">No voice acting roles found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceActorPage;