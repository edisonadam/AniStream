

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ref, onValue, set, push, serverTimestamp, onDisconnect, remove, get, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import type { Anime, Room, ChatMessage, RoomParticipant } from '../types';
import { fetchWithRetry, mapJikanToAnime } from '../api';
import Player from './Player';
import { formatRelativeTime } from '../utils';
import { UsersIcon, CloseIcon, VideoCameraIcon, VideoCameraOffIcon, MicrophoneIcon, MicrophoneOffIcon, SearchIcon, ChevronLeftIcon, PlusIcon } from './icons/Icons';
import { useSettings } from '../hooks/useSettings';
import RoomManagerModal from './RoomManagerModal';

interface WatchTogetherPageProps {
  roomId: string | null;
  onExit: () => void;
}

// --- Chat Component ---
const ChatPane: React.FC<{
    messages: ChatMessage[];
    participants: Record<string, RoomParticipant>;
    isHost: boolean;
    onSendMessage: (text: string) => void;
    onKickUser: (userId: string) => void;
}> = ({ messages, participants, isHost, onSendMessage, onKickUser }) => {
    const [messageText, setMessageText] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageText.trim()) {
            onSendMessage(messageText.trim());
            setMessageText('');
        }
    };

    return (
        <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 rounded-2xl h-full flex flex-col">
            <h2 className="text-xl font-bold p-4 border-b border-white/10">Room Chat</h2>
            
            {/* Participants */}
            <div className="p-4 border-b border-white/10 max-h-48 overflow-y-auto">
                <h3 className="font-semibold text-sm text-[rgb(var(--text-muted))] mb-2 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4"/> In Room ({Object.keys(participants).length})
                </h3>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(participants).map(([uid, rawParticipant]) => {
                        const participant = rawParticipant as RoomParticipant;
                        return (
                            <div key={uid} className="group relative flex items-center gap-2 bg-[rgb(var(--surface-3))] p-1 pr-3 rounded-full">
                                <img src={participant.avatar} alt={participant.username} className="w-6 h-6 rounded-full" />
                                <span className="text-sm font-medium">{participant.username}</span>
                                <div className="flex gap-1 ml-1 text-xs text-[rgb(var(--text-muted))]">
                                    {participant.isCamOn ? <VideoCameraIcon className="w-3 h-3 text-green-400"/> : <VideoCameraOffIcon className="w-3 h-3"/>}
                                    {participant.isMicOn ? <MicrophoneIcon className="w-3 h-3 text-green-400"/> : <MicrophoneOffIcon className="w-3 h-3"/>}
                                </div>
                                {isHost && user?.uid !== uid && (
                                    <button onClick={() => onKickUser(uid)} className="absolute inset-0 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CloseIcon className="w-4 h-4 text-white"/>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className="flex items-start gap-3">
                        <img src={msg.user.avatar} alt={msg.user.username} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-[rgb(var(--color-primary-accent))]">{msg.user.username}</span>
                                <span className="text-xs text-[rgb(var(--text-muted))]">{formatRelativeTime(msg.timestamp)}</span>
                            </div>
                            <p className="text-sm text-[rgb(var(--text-secondary))]">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <form onSubmit={handleSend}>
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Say something..."
                        className="w-full bg-[rgb(var(--surface-input))/0.5] border border-white/10 rounded-full py-2 px-4 text-[rgb(var(--text-primary))]"
                    />
                </form>
            </div>
        </div>
    );
};

// --- Video Strip Component ---
const ParticipantVideoStrip: React.FC<{
    localStream: MediaStream | null;
    isMicOn: boolean;
    isCamOn: boolean;
    participants: Record<string, RoomParticipant>;
    currentUserId: string | undefined;
}> = ({ localStream, isMicOn, isCamOn, participants, currentUserId }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x">
            {/* Local User */}
            <div className="flex-shrink-0 w-48 aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg snap-start border border-white/10">
                <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${!isCamOn ? 'hidden' : ''}`} />
                {!isCamOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--surface-3))]">
                        <div className="w-12 h-12 rounded-full bg-[rgb(var(--surface-4))] flex items-center justify-center">
                            <VideoCameraOffIcon className="w-6 h-6 text-[rgb(var(--text-muted))]" />
                        </div>
                    </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-xs text-white font-semibold flex items-center gap-1">
                    You {!isMicOn && <MicrophoneOffIcon className="w-3 h-3 text-red-400"/>}
                </div>
            </div>

            {/* Remote Participants (Simulated/State-based) */}
            {Object.entries(participants).filter(([uid]) => uid !== currentUserId).map(([uid, rawP]) => {
                const p = rawP as RoomParticipant;
                return (
                    <div key={uid} className="flex-shrink-0 w-48 aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg snap-start border border-white/10">
                        {/* Since we don't have a signaling server for P2P video, we show their avatar/status */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgb(var(--surface-3))]">
                            <img src={p.avatar} alt={p.username} className={`w-16 h-16 rounded-full mb-2 ${p.isCamOn ? 'ring-2 ring-green-400' : 'opacity-50'}`} />
                            <p className="text-xs text-[rgb(var(--text-muted))]">{p.isCamOn ? 'Camera On' : 'Camera Off'}</p>
                        </div>
                        
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-xs text-white font-semibold flex items-center gap-1">
                            {p.username} {!p.isMicOn && <MicrophoneOffIcon className="w-3 h-3 text-red-400"/>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Active Room Component ---
const ActiveRoom: React.FC<{ roomId: string; onExit: () => void }> = ({ roomId, onExit }) => {
    const { user, isLoggedIn } = useAuth();
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [anime, setAnime] = useState<Anime | null>(null);
    const [artplayer, setArtplayer] = useState<any>(null);
    const { settings, updateSettings } = useSettings();
    const [error, setError] = useState<string | null>(null);
    
    // Media State
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [permissionError, setPermissionError] = useState<string|null>(null);

    const isHost = user?.uid === roomData?.hostId;
    const isSyncing = useRef(false);

    // Initial Fetch
    useEffect(() => {
        const roomRef = ref(db, `rooms/${roomId}`);
        get(roomRef).then(async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as Room;
                setRoomData(data);
                const animeRes = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${data.animeId}/full`);
                if (animeRes.ok) {
                    const animeData = await animeRes.json();
                    setAnime(mapJikanToAnime(animeData.data));
                }
            } else {
                setError("Room not found or closed.");
            }
        }).catch(e => setError(e.message));
    }, [roomId]);

    // Real-time Sync
    useEffect(() => {
        if (!user || !roomId) return;
        const roomRef = ref(db, `rooms/${roomId}`);
        const participantRef = ref(db, `rooms/${roomId}/participants/${user.uid}`);
        
        // Initial set
        set(participantRef, { 
            username: user.username, 
            avatar: user.avatar,
            isMicOn: false,
            isCamOn: false
        });
        onDisconnect(participantRef).remove();

        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                setRoomData(snapshot.val() as Room);
            } else {
                setError("The host has closed the room.");
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }
                setTimeout(onExit, 3000);
            }
        });

        return () => {
            unsubscribe();
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            remove(participantRef);
        };
    }, [roomId, user]);

    // Media Controls
    const toggleMedia = async (type: 'audio' | 'video') => {
        if (!roomData) return;
        if (type === 'video' && !roomData.allowCamera) return;
        if (type === 'audio' && !roomData.allowMicrophone) return;

        try {
            if (!localStream) {
                // Initial Request
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video' || isCamOn,
                    audio: type === 'audio' || isMicOn
                });
                setLocalStream(stream);
                
                // Update State
                if (type === 'video') {
                    setIsCamOn(true);
                    update(ref(db, `rooms/${roomId}/participants/${user?.uid}`), { isCamOn: true });
                }
                if (type === 'audio') {
                    setIsMicOn(true);
                    update(ref(db, `rooms/${roomId}/participants/${user?.uid}`), { isMicOn: true });
                }
            } else {
                // Toggle existing tracks
                if (type === 'video') {
                    const videoTrack = localStream.getVideoTracks()[0];
                    if (videoTrack) {
                        videoTrack.enabled = !videoTrack.enabled;
                        setIsCamOn(videoTrack.enabled);
                        update(ref(db, `rooms/${roomId}/participants/${user?.uid}`), { isCamOn: videoTrack.enabled });
                    } else {
                        // Request video track if missing
                         const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
                         const newVideoTrack = newStream.getVideoTracks()[0];
                         localStream.addTrack(newVideoTrack);
                         setIsCamOn(true);
                         update(ref(db, `rooms/${roomId}/participants/${user?.uid}`), { isCamOn: true });
                    }
                }
                if (type === 'audio') {
                    const audioTrack = localStream.getAudioTracks()[0];
                    if (audioTrack) {
                        audioTrack.enabled = !audioTrack.enabled;
                        setIsMicOn(audioTrack.enabled);
                        update(ref(db, `rooms/${roomId}/participants/${user?.uid}`), { isMicOn: audioTrack.enabled });
                    } else {
                         const newStream = await navigator.mediaDevices.getUserMedia({ video: isCamOn, audio: true });
                         const newAudioTrack = newStream.getAudioTracks()[0];
                         localStream.addTrack(newAudioTrack);
                         setIsMicOn(true);
                         update(ref(db, `rooms/${roomId}/participants/${user?.uid}`), { isMicOn: true });
                    }
                }
            }
            setPermissionError(null);
        } catch (e) {
            console.error(e);
            setPermissionError("Permission denied or device unavailable.");
        }
    };

    // Player Sync (Same as before)
    useEffect(() => {
        if (!artplayer || !roomData) return;
        const playerStateRef = ref(db, `rooms/${roomId}/playerState`);
        const unsubscribe = onValue(playerStateRef, (snapshot) => {
            if (!snapshot.exists() || isHost) return;
            isSyncing.current = true;
            const state = snapshot.val();
            if (Math.abs(state.currentTime - artplayer.currentTime) > 2) artplayer.seek = state.currentTime;
            if (state.isPlaying !== artplayer.playing) state.isPlaying ? artplayer.play() : artplayer.pause();
            setTimeout(() => { isSyncing.current = false; }, 200);
        });

        if (isHost) {
            const updateState = () => {
                if (isSyncing.current) return;
                set(playerStateRef, { isPlaying: artplayer.playing, currentTime: artplayer.currentTime, timestamp: serverTimestamp() });
            };
            artplayer.on('play', updateState);
            artplayer.on('pause', updateState);
            artplayer.on('seek', updateState);
        }
        return () => unsubscribe();
    }, [artplayer, roomId, roomData, isHost]);

    if (error) return <div className="h-screen flex items-center justify-center flex-col gap-4"><h2 className="text-2xl text-red-500">{error}</h2><button onClick={onExit} className="px-4 py-2 bg-white/10 rounded-lg">Exit</button></div>;
    if (!anime || !roomData) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div></div>;

    const messages = Object.entries(roomData.chat || {})
        .map(([id, msg]) => ({ ...(msg as ChatMessage), id } as ChatMessage))
        .sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[rgb(var(--bg-gradient-start))] text-[rgb(var(--text-primary))] p-4 gap-4 overflow-hidden">
            <div className="flex-grow flex flex-col min-w-0">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold truncate text-[rgb(var(--color-primary-accent))]">
                            {roomData.roomName || `${roomData.hostUsername || 'Someone'}'s Room`}
                        </h1>
                        <p className="text-xs text-[rgb(var(--text-muted))] truncate">Watching: {anime.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {roomData.allowCamera && (
                            <button onClick={() => toggleMedia('video')} className={`p-2 rounded-full transition-colors ${isCamOn ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>
                                {isCamOn ? <VideoCameraIcon className="w-5 h-5"/> : <VideoCameraOffIcon className="w-5 h-5"/>}
                            </button>
                        )}
                        {roomData.allowMicrophone && (
                            <button onClick={() => toggleMedia('audio')} className={`p-2 rounded-full transition-colors ${isMicOn ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>
                                {isMicOn ? <MicrophoneIcon className="w-5 h-5"/> : <MicrophoneOffIcon className="w-5 h-5"/>}
                            </button>
                        )}
                        <button onClick={onExit} className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-xl font-semibold hover:bg-[rgb(var(--color-danger))]/40">Leave</button>
                    </div>
                </div>
                {permissionError && <div className="text-red-400 text-xs text-center mb-2">{permissionError}</div>}

                {/* Player */}
                <div className="flex-1 min-h-0 relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <Player
                        anime={anime}
                        onGoBack={onExit}
// @FIX: Pass the onExit function to the required onGoHome prop to ensure type safety.
                        onGoHome={onExit}
                        onSelectRelated={() => {}}
                        allAnime={[]}
                        onGenreSelect={() => {}}
                        onStudioSelect={() => {}}
                        onUserSelect={() => {}}
                        onEnterRoom={() => {}}
                        isWatchTogetherSession={true}
                        isHost={isHost}
                        onEpisodeChangeByHost={(s, e) => {
                            if (!isHost) return;
                            set(ref(db, `rooms/${roomId}/currentSeason`), s);
                            set(ref(db, `rooms/${roomId}/currentEpisode`), e);
                        }}
                        onPlayerReady={setArtplayer}
                        settings={settings}
                        updateSettings={updateSettings}
                        isLoggedIn={isLoggedIn}
                        onLoginRequest={() => {}}
                        getEpisodeStatus={() => ({isNew: false, episodeNumber: null})}
                    />
                </div>

                {/* Participant Video Strip */}
                <div className="mt-4 flex-shrink-0 h-32">
                    <ParticipantVideoStrip 
                        localStream={localStream} 
                        isMicOn={isMicOn} 
                        isCamOn={isCamOn} 
                        participants={roomData.participants || {}} 
                        currentUserId={user?.uid}
                    />
                </div>
            </div>

            {/* Chat */}
            <div className="w-full lg:w-80 flex-shrink-0 h-[40vh] lg:h-auto">
                <ChatPane 
                    messages={messages}
                    participants={roomData.participants || {}}
                    isHost={isHost}
                    onSendMessage={(text) => {
                        push(ref(db, `rooms/${roomId}/chat`), {
                            user: { uid: user?.uid, username: user?.username, avatar: user?.avatar },
                            text,
                            timestamp: serverTimestamp(),
                        });
                    }}
                    onKickUser={(uid) => isHost && remove(ref(db, `rooms/${roomId}/participants/${uid}`))}
                />
            </div>
        </div>
    );
};

// --- Room List (Discovery) ---
const RoomList: React.FC<{ onJoin: (roomId: string) => void, onBack: () => void }> = ({ onJoin, onBack }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCam, setFilterCam] = useState(false);
    const [filterMic, setFilterMic] = useState(false);
    const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const roomsRef = ref(db, 'rooms');
        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomList = Object.entries(data).map(([id, val]) => ({ id, ...(val as Room) }));
                setRooms(roomList.filter(r => r.isPublic));
            } else {
                setRooms([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredRooms = useMemo(() => {
        let result = rooms.filter(r => {
            if (filterCam && !r.allowCamera) return false;
            if (filterMic && !r.allowMicrophone) return false;
            
            if (searchQuery) {
                const lowerQ = searchQuery.toLowerCase();
                const matchRoom = r.roomName?.toLowerCase().includes(lowerQ);
                const matchAnime = r.animeTitle?.toLowerCase().includes(lowerQ);
                const matchUser = r.hostUsername?.toLowerCase().includes(lowerQ);
                const matchParticipant = Object.values(r.participants || {}).some((p: RoomParticipant) => p.username.toLowerCase().includes(lowerQ));
                
                if (!matchRoom && !matchAnime && !matchUser && !matchParticipant) return false;
            }
            return true;
        });

        if (sortBy === 'latest') {
            result.sort((a, b) => b.createdAt - a.createdAt);
        } else {
            result.sort((a, b) => Object.keys(b.participants || {}).length - Object.keys(a.participants || {}).length);
        }
        return result;
    }, [rooms, filterCam, filterMic, sortBy, searchQuery]);

    return (
        <div className="container mx-auto px-4 py-8 animate-subtle-fade-in-up">
            {isCreateModalOpen && (
                <RoomManagerModal 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onEnterRoom={(id) => { setIsCreateModalOpen(false); onJoin(id); }} 
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))]">
                    <ChevronLeftIcon className="w-5 h-5"/> Back
                </button>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-full font-bold hover:bg-[rgb(var(--color-primary-hover))] shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
                    <PlusIcon className="w-5 h-5"/> Create Room
                </button>
            </div>
            
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Public Rooms</h1>
                <p className="text-[rgb(var(--text-muted))]">Join active watch parties</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-[rgb(var(--surface-2))/0.6] p-4 rounded-xl border border-white/10">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon className="w-4 h-4"/></div>
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search rooms, users, or anime..." 
                        className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))]"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                        <span className="text-sm font-semibold text-[rgb(var(--text-muted))]">Sort:</span>
                        <button onClick={() => setSortBy('latest')} className={`px-3 py-1 rounded-full text-sm ${sortBy === 'latest' ? 'bg-[rgb(var(--color-primary))] text-white' : 'hover:bg-white/10'}`}>Latest</button>
                        <button onClick={() => setSortBy('popular')} className={`px-3 py-1 rounded-full text-sm ${sortBy === 'popular' ? 'bg-[rgb(var(--color-primary))] text-white' : 'hover:bg-white/10'}`}>Popular</button>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={filterCam} onChange={(e) => setFilterCam(e.target.checked)} className="rounded bg-gray-700 text-[rgb(var(--color-primary))]"/>
                        <VideoCameraIcon className="w-4 h-4"/> Cam
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={filterMic} onChange={(e) => setFilterMic(e.target.checked)} className="rounded bg-gray-700 text-[rgb(var(--color-primary))]"/>
                        <MicrophoneIcon className="w-4 h-4"/> Mic
                    </label>
                </div>
            </div>

            {loading ? <div className="text-center py-12">Loading rooms...</div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRooms.map(room => (
                        <div key={room.id} onClick={() => room.id && onJoin(room.id)} className="bg-[rgb(var(--surface-2))] rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform border border-white/5 shadow-lg group">
                            <div className="aspect-video relative">
                                <img src={room.animeImage} alt={room.animeTitle} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="bg-[rgb(var(--color-primary))] p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0">
                                        <UsersIcon className="w-6 h-6 text-white"/>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    {room.allowCamera && <div className="bg-black/60 p-1 rounded"><VideoCameraIcon className="w-3 h-3 text-white"/></div>}
                                    {room.allowMicrophone && <div className="bg-black/60 p-1 rounded"><MicrophoneIcon className="w-3 h-3 text-white"/></div>}
                                </div>
                                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                    S{room.currentSeason} E{room.currentEpisode}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold truncate text-[rgb(var(--color-primary-accent))]">{room.roomName || "Untitled Room"}</h3>
                                <p className="text-xs text-[rgb(var(--text-secondary))] truncate mb-2">Watching: {room.animeTitle}</p>
                                <div className="flex justify-between items-center text-xs text-[rgb(var(--text-muted))] pt-2 border-t border-white/5">
                                    <span className="truncate max-w-[60%]">Host: {room.hostUsername || 'Unknown'}</span>
                                    <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3"/> {Object.keys(room.participants || {}).length}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredRooms.length === 0 && <div className="col-span-full text-center py-12 text-[rgb(var(--text-muted))]">No active rooms found matching filters.</div>}
                </div>
            )}
        </div>
    );
};

// --- Main Page Wrapper ---
const WatchTogetherPage: React.FC<WatchTogetherPageProps> = ({ roomId, onExit }) => {
    // If a roomId is provided, we are in the Active Room
    if (roomId) {
        return <ActiveRoom roomId={roomId} onExit={onExit} />;
    }
    // Fallback: If roomId is present, show ActiveRoom.
    return <ActiveRoom roomId={roomId!} onExit={onExit} />;
};

export { RoomList }; // Exporting for potential use if I modify App.tsx
export default WatchTogetherPage;