
import React, { useState, useEffect } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';
import type { Anime, Room } from '../types';
import { CloseIcon, UsersIcon, EyeIcon, EyeOffIcon, VideoCameraIcon, MicrophoneIcon, SearchIcon, ChevronLeftIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { fetchWithRetry, mapJikanToAnime } from '../api';
import { getDisplayTitle } from '../utils';
import { useSettings } from '../hooks/useSettings';

interface RoomManagerModalProps {
  anime?: Anime;
  currentSeason?: number;
  currentEpisode?: number;
  onClose: () => void;
  onEnterRoom: (roomId: string) => void;
}

const RoomManagerModal: React.FC<RoomManagerModalProps> = ({ anime: initialAnime, currentSeason = 1, currentEpisode = 1, onClose, onEnterRoom }) => {
    const [anime, setAnime] = useState<Anime | undefined>(initialAnime);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Room Config State
    const [roomIdInput, setRoomIdInput] = useState('');
    const [roomName, setRoomName] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [allowCamera, setAllowCamera] = useState(false);
    const [allowMicrophone, setAllowMicrophone] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const { settings } = useSettings();

    // Handle Anime Search
    useEffect(() => {
        if (!searchQuery.trim() || anime) {
            setSearchResults([]);
            return;
        }
        
        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const sfwQuery = settings.restrictAdultContent ? '&sfw' : '';
                const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=5${sfwQuery}`);
                if (res.ok) {
                    const data = await res.json();
                    const mapped = data.data.map(mapJikanToAnime).filter(Boolean);
                    setSearchResults(mapped);
                }
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, anime, settings.restrictAdultContent]);

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateRoom = async () => {
        if (!user) {
            setError('You must be logged in to create a room.');
            return;
        }
        if (!anime) {
            setError('Please select an anime first.');
            return;
        }

        setIsLoading(true);
        setError('');
        const newRoomId = generateRoomId();
        const roomRef = ref(db, `rooms/${newRoomId}`);

        const newRoom: Room = {
            hostId: user.uid,
            hostUsername: user.username,
            roomName: roomName.trim() || `${user.username}'s Room`,
            animeId: anime.id,
            animeTitle: anime.title,
            animeImage: anime.thumbnail,
            currentSeason: currentSeason,
            currentEpisode: currentEpisode,
            playerState: {
                isPlaying: false,
                currentTime: 0,
                timestamp: Date.now(),
            },
            participants: {},
            chat: {},
            isPublic: isPublic,
            allowCamera: allowCamera,
            allowMicrophone: allowMicrophone,
            createdAt: Date.now(),
        };

        try {
            await set(roomRef, newRoom);
            onEnterRoom(newRoomId);
        } catch (e) {
            setError('Failed to create room. Please try again.');
            setIsLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        const roomId = roomIdInput.trim().toUpperCase();
        if (!roomId) {
            setError('Please enter a Room ID.');
            return;
        }
        setIsLoading(true);
        setError('');

        const roomRef = ref(db, `rooms/${roomId}`);
        try {
            const snapshot = await get(roomRef);
            if (snapshot.exists()) {
                onEnterRoom(roomId);
            } else {
                setError('Room not found. Please check the ID and try again.');
                setIsLoading(false);
            }
        } catch (e) {
            setError('Failed to connect to the room. Please check your connection.');
            setIsLoading(false);
        }
    };

    const Toggle: React.FC<{ label: string; icon: React.ReactNode; checked: boolean; onChange: () => void }> = ({ label, icon, checked, onChange }) => (
        <button 
            type="button"
            onClick={onChange} 
            className={`flex items-center justify-between w-full p-3 rounded-xl border transition-colors ${checked ? 'bg-[rgb(var(--color-primary))/0.2] border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-accent))]' : 'bg-[rgb(var(--surface-3))] border-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]'}`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-semibold text-sm">{label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-[rgb(var(--color-primary))]' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </button>
    );

    const renderAnimeSelection = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-center">Select Anime</h3>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon /></div>
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search for an anime..." 
                    autoFocus
                    className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]" 
                />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
                {isSearching ? (
                    <div className="text-center p-4 text-[rgb(var(--text-muted))]">Searching...</div>
                ) : searchResults.length > 0 ? (
                    searchResults.map(result => (
                        <button 
                            key={result.id}
                            onClick={() => setAnime(result)}
                            className="flex items-center gap-3 w-full p-2 hover:bg-[rgb(var(--surface-3))] rounded-lg transition-colors text-left"
                        >
                            <img src={result.thumbnail} alt={result.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="font-semibold text-sm text-[rgb(var(--text-primary))] truncate">{getDisplayTitle(result, settings)}</p>
                                <p className="text-xs text-[rgb(var(--text-muted))]">{result.releaseYear || 'Unknown'}</p>
                            </div>
                        </button>
                    ))
                ) : searchQuery ? (
                    <div className="text-center p-4 text-[rgb(var(--text-muted))]">No results found.</div>
                ) : null}
            </div>
        </div>
    );

    const renderRoomConfig = () => (
        <div className="space-y-4">
            {/* Selected Anime Preview */}
            <div className="flex items-center gap-3 bg-[rgb(var(--surface-3))/0.5] p-3 rounded-xl mb-4 relative group">
                <img src={anime!.thumbnail} alt={anime!.title} className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{getDisplayTitle(anime!, settings)}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">Starting S{currentSeason} E{currentEpisode}</p>
                </div>
                {!initialAnime && (
                    <button onClick={() => { setAnime(undefined); setSearchQuery(''); }} className="text-xs bg-[rgb(var(--surface-4))] hover:bg-white/10 px-2 py-1 rounded absolute right-2 top-2">Change</button>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-[rgb(var(--text-secondary))] mb-1">Room Name (Optional)</label>
                <input 
                    type="text" 
                    value={roomName} 
                    onChange={e => setRoomName(e.target.value)} 
                    placeholder={`${user?.username || 'User'}'s Room`}
                    className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-4 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]" 
                />
            </div>

            <div className="space-y-2">
                <Toggle 
                    label="Public Room" 
                    icon={isPublic ? <EyeIcon className="w-5 h-5"/> : <EyeOffIcon className="w-5 h-5"/>} 
                    checked={isPublic} 
                    onChange={() => setIsPublic(!isPublic)} 
                />
                <Toggle 
                    label="Allow Cameras" 
                    icon={<VideoCameraIcon className="w-5 h-5"/>} 
                    checked={allowCamera} 
                    onChange={() => setAllowCamera(!allowCamera)} 
                />
                <Toggle 
                    label="Allow Microphone" 
                    icon={<MicrophoneIcon className="w-5 h-5"/>} 
                    checked={allowMicrophone} 
                    onChange={() => setAllowMicrophone(!allowMicrophone)} 
                />
            </div>

            <button onClick={handleCreateRoom} disabled={isLoading} className="w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50">
                {isLoading ? 'Creating...' : 'Create New Room'}
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-[90%] max-w-md m-4 p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <div className="text-center mb-6">
                    <UsersIcon className="mx-auto w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                    <h3 className="text-xl font-bold mt-2 text-[rgb(var(--text-primary))]">Watch Together</h3>
                </div>
                
                {/* Conditionally render Search or Config */}
                {!anime ? renderAnimeSelection() : renderRoomConfig()}

                {!anime && (
                    <>
                        <div className="relative my-4 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <span className="relative bg-[rgb(var(--surface-2))] px-3 text-sm text-[rgb(var(--text-muted))]">OR JOIN</span>
                        </div>

                        <div>
                            <input type="text" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value)} placeholder="Enter Room ID" className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-full px-4 py-3 text-center uppercase tracking-widest text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]" />
                            <button onClick={handleJoinRoom} disabled={isLoading} className="mt-3 w-full py-3 bg-white/10 text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-white/20 disabled:opacity-50">
                                {isLoading ? 'Joining...' : 'Join Room'}
                            </button>
                        </div>
                    </>
                )}

                {error && <p className="text-[rgb(var(--color-danger))] text-sm text-center mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default RoomManagerModal;
