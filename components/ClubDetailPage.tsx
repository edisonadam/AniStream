import React, { useState, useEffect, useCallback } from 'react';
import type { Anime, Club, ClubMember, ClubStaff, ClubRelations, MalUrl, ClubPicture } from '../types';
import { ChevronLeftIcon, UsersIcon, CalendarIcon, CloseIcon } from './icons/Icons';
import AnimeCard from './AnimeCard';

// Helper to map a relation item to a minimal Anime object for selection
const mapRelationToAnime = (relation: MalUrl): Anime => ({
    id: relation.mal_id,
    title: relation.name,
    thumbnail: relation.images?.jpg.image_url || '',
    // Fill with default/empty values for other required fields
    title_english: null,
    title_japanese: '',
    bannerImage: relation.images?.jpg.image_url || '',
    synopsis: '',
    genres: [],
    releaseYear: null,
    status: 'Completed',
    totalEpisodes: null,
    rating: null,
    // FIX: The type 'anime' from the relation object is not a valid `Anime['type']`.
    // Setting it to null is a safe fallback as the specific type is not provided.
    type: null,
    studio: '',
    hasSub: true,
    hasDub: false,
    runtime: null,
    avgEpisodeDuration: null,
    isAdult: false,
});

const MemberCard: React.FC<{ member: ClubMember }> = ({ member }) => (
    <a href={member.url} target="_blank" rel="noopener noreferrer" className="bg-[rgb(var(--surface-3))/0.5] rounded-2xl flex items-center p-3 gap-3 text-left hover:bg-[rgb(var(--surface-3))] transition-colors group">
        <img src={member.image_url} alt={member.username} className="w-12 h-12 object-cover rounded-full flex-shrink-0" />
        <p className="font-bold text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{member.username}</p>
    </a>
);

const RelationCard: React.FC<{ relation: MalUrl }> = ({ relation }) => (
    <a href={relation.url} target="_blank" rel="noopener noreferrer" className="group flex-shrink-0 w-32 sm:w-36 text-center">
        <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md bg-[rgb(var(--surface-3))] transform transition-transform duration-300 group-hover:scale-105">
            {relation.images?.jpg.image_url ? (
                <img src={relation.images.jpg.image_url} alt={relation.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center p-2 text-xs text-[rgb(var(--text-muted))]">{relation.name}</div>
            )}
        </div>
        <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-secondary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{relation.name}</p>
    </a>
);

interface ClubDetailPageProps {
  club: Club;
  onGoBack: () => void;
  onSelectAnime: (anime: Anime) => void;
}

const ClubDetailPage: React.FC<ClubDetailPageProps> = ({ club, onGoBack, onSelectAnime }) => {
    const [pictures, setPictures] = useState<ClubPicture[]>([]);
    const [members, setMembers] = useState<ClubMember[]>([]);
    const [staff, setStaff] = useState<ClubStaff[]>([]);
    const [relations, setRelations] = useState<ClubRelations | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pictures' | 'relations' | 'members' | 'staff'>('pictures');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const fetchClubDetails = useCallback(async (clubId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoints = [
                `https://api.jikan.moe/v4/clubs/${clubId}/pictures`,
                `https://api.jikan.moe/v4/clubs/${clubId}/members`,
                `https://api.jikan.moe/v4/clubs/${clubId}/staff`,
                `https://api.jikan.moe/v4/clubs/${clubId}/relations`
            ];

            const requests = endpoints.map(url => fetch(url).then(res => {
                if (res.status === 429) return new Promise(r => setTimeout(r, 1000)).then(() => fetch(url));
                return res;
            }).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed request to ${url}`))));

            const [picturesRes, membersRes, staffRes, relationsRes] = await Promise.allSettled(requests);
            
            if (picturesRes.status === 'fulfilled' && picturesRes.value.data) {
                const pics = picturesRes.value.data;
                setPictures(pics);
                if (pics.length > 0) {
                    setActiveTab('pictures');
                } else {
                    setActiveTab('relations');
                }
            } else {
                setActiveTab('relations');
            }

            if (membersRes.status === 'fulfilled' && membersRes.value.data) setMembers(membersRes.value.data);
            if (staffRes.status === 'fulfilled' && staffRes.value.data) setStaff(staffRes.value.data);
            if (relationsRes.status === 'fulfilled' && relationsRes.value.data) setRelations(relationsRes.value.data);

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClubDetails(club.mal_id);
    }, [club.mal_id, fetchClubDetails]);
    
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxImage(null);
            }
        };
        if (lightboxImage) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [lightboxImage]);


    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-12 text-[rgb(var(--text-muted))]">Loading club details...</div>;
        }
        if (error) {
            return <div className="text-center p-12 text-[rgb(var(--color-danger))]">{error}</div>;
        }

        switch(activeTab) {
            case 'pictures':
                return pictures.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {pictures.map((pic, index) => (
                            <div key={index} onClick={() => setLightboxImage(pic.jpg.image_url)} className="aspect-video w-full bg-[rgb(var(--surface-3))] rounded-xl overflow-hidden cursor-pointer group transition-transform duration-300 hover:scale-105">
                                <img src={pic.jpg.image_url} alt={`Club gallery image ${index + 1}`} className="w-full h-full object-cover"/>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-center text-[rgb(var(--text-muted))] p-8">No pictures found for this club.</p>;
            case 'relations':
                return (
                    <div className="space-y-8">
                        {relations?.anime && relations.anime.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--text-primary))]">Related Anime</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                                    {relations.anime.map(item => <AnimeCard key={item.mal_id} anime={mapRelationToAnime(item)} onSelect={onSelectAnime} />)}
                                </div>
                            </div>
                        )}
                        {relations?.manga && relations.manga.length > 0 && (
                             <div>
                                <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--text-primary))]">Related Manga</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
                                    {relations.manga.map(item => <RelationCard key={item.mal_id} relation={item} />)}
                                </div>
                            </div>
                        )}
                        {relations?.characters && relations.characters.length > 0 && (
                             <div>
                                <h3 className="text-xl font-semibold mb-4 text-[rgb(var(--text-primary))]">Related Characters</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
                                    {relations.characters.map(item => <RelationCard key={item.mal_id} relation={item} />)}
                                </div>
                            </div>
                        )}
                        {(!relations?.anime?.length && !relations?.manga?.length && !relations?.characters?.length) && <p className="text-center text-[rgb(var(--text-muted))] p-8">No relations found for this club.</p>}
                    </div>
                );
            case 'members':
                return members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {members.map(member => <MemberCard key={member.username} member={member} />)}
                    </div>
                ) : <p className="text-center text-[rgb(var(--text-muted))] p-8">No members to display.</p>;
            case 'staff':
                 return staff.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {staff.map(s => (
                             <a key={s.username} href={s.url} target="_blank" rel="noopener noreferrer" className="bg-[rgb(var(--surface-3))/0.5] rounded-2xl p-3 text-center hover:bg-[rgb(var(--surface-3))] transition-colors group">
                                <p className="font-bold text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{s.username}</p>
                            </a>
                        ))}
                    </div>
                ) : <p className="text-center text-[rgb(var(--text-muted))] p-8">No staff to display.</p>;
            default:
                return null;
        }
    }
    
    const bannerImage = pictures[0]?.jpg.image_url || club.images.jpg.image_url;

    return (
    <>
        {lightboxImage && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={() => setLightboxImage(null)}>
                <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 text-white hover:text-[rgb(var(--color-primary-accent))] transition-colors"><CloseIcon /></button>
                <img src={lightboxImage} alt="Club image" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
            </div>
        )}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back to Clubs</span>
            </button>

            <div className="relative w-full h-48 md:h-64 rounded-[2rem] overflow-hidden bg-[rgb(var(--surface-2))]">
                <img src={bannerImage} alt={club.name} className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                    <h1 className="text-3xl md:text-5xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>{club.name}</h1>
                </div>
            </div>

            <div className="my-6 p-4 bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl rounded-3xl flex flex-wrap items-center justify-center sm:justify-around gap-4 text-center">
                <div className="flex items-center gap-2 text-lg">
                    <UsersIcon className="w-6 h-6 text-[rgb(var(--color-primary-accent))]" />
                    <div>
                        <p className="font-bold text-white">{club.members.toLocaleString()}</p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">Members</p>
                    </div>
                </div>
                <div>
                    <p className="font-bold text-white capitalize">{club.category.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Category</p>
                </div>
                <div className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="w-5 h-5 text-[rgb(var(--color-primary-accent))]" />
                    <div>
                        <p className="font-bold text-white">{new Date(club.created).toLocaleDateString()}</p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">Created</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-white/10 mb-6">
                <div className="flex justify-center gap-4">
                    <button onClick={() => setActiveTab('pictures')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'pictures' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Pictures</button>
                    <button onClick={() => setActiveTab('relations')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'relations' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Relations</button>
                    <button onClick={() => setActiveTab('members')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'members' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Members</button>
                    <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'staff' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Staff</button>
                </div>
            </div>

            <div key={activeTab} className="animate-cinematic-fade-in">
            {renderContent()}
            </div>
        </div>
    </>
  );
};

export default ClubDetailPage;