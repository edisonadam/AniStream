import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ref, onValue, set, push, serverTimestamp, onDisconnect, remove, get } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import type { Anime, Room, ChatMessage } from '../types';
import { fetchWithRetry, mapJikanToAnime } from '../api';
import Player from './Player';
import { formatRelativeTime } from '../utils';
import { UsersIcon, CloseIcon } from './icons/Icons';
import { useSettings } from '../hooks/useSettings';

interface WatchTogetherPageProps {
  roomId: string;
  onExit: () => void;
}

const ChatPane: React.FC<{
    messages: ChatMessage[];
    participants: Room['participants'];
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
            <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold text-sm text-[rgb(var(--text-muted))] mb-2 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4"/> In Room ({Object.keys(participants).length})
                </h3>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(participants).map(([uid, participantVal]) => {
                        const participant = participantVal as { avatar: string; username: string };
                        return (
                        <div key={uid} className="group relative flex items-center gap-2 bg-[rgb(var(--surface-3))] p-1 pr-2 rounded-full">
                            <img src={participant.avatar} alt={participant.username} className="w-6 h-6 rounded-full" />
                            <span className="text-sm font-medium">{participant.username}</span>
                            {isHost && user?.uid !== uid && (
                                <button onClick={() => onKickUser(uid)} className="absolute inset-0 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CloseIcon className="w-4 h-4 text-white"/>
                                </button>
                            )}
                        </div>
                    )})}
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


const WatchTogetherPage: React.FC<WatchTogetherPageProps> = ({ roomId, onExit }) => {
    const { user, isLoggedIn } = useAuth();
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [anime, setAnime] = useState<Anime | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [artplayer, setArtplayer] = useState<any>(null);
    const { settings, updateSettings } = useSettings();

    const isHost = user?.uid === roomData?.hostId;
    const isSyncing = useRef(false);

    // Fetch initial room data and anime details
    useEffect(() => {
        const roomRef = ref(db, `rooms/${roomId}`);
        get(roomRef).then(async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as Room;
                setRoomData(data);
                const animeRes = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${data.animeId}/full`);
                if (animeRes.ok) {
                    const animeData = await animeRes.json();
                    const mapped = mapJikanToAnime(animeData.data);
                    if (mapped) {
                        setAnime(mapped);
                    } else {
                        throw new Error("Could not map anime data.");
                    }
                } else {
                     throw new Error("Failed to fetch anime details.");
                }
            } else {
                setError("This room does not exist or has been closed.");
            }
        }).catch(e => setError(e.message)).finally(() => setIsLoading(false));
    }, [roomId]);

    // Setup real-time listeners and presence
    useEffect(() => {
        if (!user || !roomId) return;
        const roomRef = ref(db, `rooms/${roomId}`);
        const participantRef = ref(db, `rooms/${roomId}/participants/${user.uid}`);
        
        // Add user to participants list
        set(participantRef, { username: user.username, avatar: user.avatar });
        // Set up disconnection logic
        onDisconnect(participantRef).remove();

        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data && typeof data === 'object') {
                    setRoomData(data as Room);
                }
            } else {
                // Room was deleted
                setError("The host has closed the room.");
                setTimeout(onExit, 3000);
            }
        });

        return () => {
            unsubscribe();
            remove(participantRef);
        };
    }, [roomId, user, onExit]);

    // Player sync logic
    useEffect(() => {
        if (!artplayer || !roomData) return;

        // Listen for Firebase state changes and update player
        const playerStateRef = ref(db, `rooms/${roomId}/playerState`);
        const unsubscribe = onValue(playerStateRef, (snapshot) => {
            if (!snapshot.exists() || isHost) return;
            
            isSyncing.current = true;
            const state = snapshot.val();
            const timeDiff = Math.abs(state.currentTime - artplayer.currentTime);

            if (timeDiff > 2) {
                artplayer.seek = state.currentTime;
            }
            if (state.isPlaying !== artplayer.playing) {
                if (state.isPlaying) artplayer.play();
                else artplayer.pause();
            }
            setTimeout(() => { isSyncing.current = false; }, 200);
        });

        // If host, listen to player events and update Firebase
        const setupHostListeners = () => {
            const updateState = () => {
                if (isSyncing.current) return;
                set(playerStateRef, {
                    isPlaying: artplayer.playing,
                    currentTime: artplayer.currentTime,
                    timestamp: serverTimestamp(),
                });
            };
            artplayer.on('play', updateState);
            artplayer.on('pause', updateState);
            artplayer.on('seek', updateState);
            return () => {
                artplayer.off('play', updateState);
                artplayer.off('pause', updateState);
                artplayer.off('seek', updateState);
            };
        };

        let cleanupHostListeners = () => {};
        if (isHost) {
            cleanupHostListeners = setupHostListeners();
        }

        return () => {
            unsubscribe();
            cleanupHostListeners();
        };

    }, [artplayer, roomId, roomData, isHost]);

    const handleEpisodeChange = (season: number, episode: number) => {
        if (!isHost) return;
        set(ref(db, `rooms/${roomId}/currentSeason`), season);
        set(ref(db, `rooms/${roomId}/currentEpisode`), episode);
    };
    
    const handleSendMessage = (text: string) => {
        if (!user) return;
        const chatRef = ref(db, `rooms/${roomId}/chat`);
        push(chatRef, {
            user: { uid: user.uid, username: user.username, avatar: user.avatar },
            text,
            timestamp: serverTimestamp(),
        });
    };
    
    const handleKickUser = (userId: string) => {
        if (!isHost) return;
        const participantRef = ref(db, `rooms/${roomId}/participants/${userId}`);
        remove(participantRef);
    };

    if (isLoading) return <div className="h-screen w-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[rgb(var(--color-primary))]"></div></div>;
    if (error) return <div className="h-screen w-screen flex flex-col items-center justify-center text-center p-4"><h2 className="text-2xl font-bold text-[rgb(var(--color-danger))]">{error}</h2><button onClick={onExit} className="mt-4 px-4 py-2 bg-white/10 rounded-lg">Go Home</button></div>;
    if (!anime || !roomData) return null;

    // FIX: The original type predicate was invalid, causing TypeScript to infer 'unknown' and fail on the `.map()` call. The predicate has been corrected to use `ChatMessage`, and destructuring in the filter's type guard has been removed to align with best practices.
    const messages = useMemo(() => {
        const chatData = roomData?.chat;
        if (chatData && typeof chatData === 'object') {
            return Object.entries(chatData)
                .filter((entry): entry is [string, ChatMessage] => {
                    const msg = entry[1];
                    return Boolean(msg && typeof msg === 'object' && msg !== null && 'user' in msg && 'text' in msg && 'timestamp' in msg);
                })
                .map(([id, msg]) => ({ ...msg, id }))
                .sort((a, b) => a.timestamp - b.timestamp);
        }
        return [];
    }, [roomData?.chat]);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[rgb(var(--bg-gradient-start))] text-[rgb(var(--text-primary))] p-4 gap-4">
            <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold truncate">Watching: {anime.title}</h1>
                    <button onClick={onExit} className="px-4 py-2 bg-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))] rounded-xl font-semibold hover:bg-[rgb(var(--color-danger))]/40">
                        Leave Room
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <Player
                        anime={anime}
                        onGoBack={onExit}
                        onSelectRelated={() => {}}
                        allAnime={[]}
                        onGenreSelect={() => {}}
                        onStudioSelect={() => {}}
                        onUserSelect={() => {}}
                        onEnterRoom={() => {}}
                        isWatchTogetherSession={true}
                        isHost={isHost}
                        onEpisodeChangeByHost={handleEpisodeChange}
                        onPlayerReady={setArtplayer}
                        settings={settings}
                        updateSettings={updateSettings}
                        isLoggedIn={isLoggedIn}
                        onLoginRequest={() => {}}
                        getEpisodeStatus={() => ({isNew: false, episodeNumber: null})}
                    />
                </div>
            </div>
            <div className="w-full lg:w-96 flex-shrink-0 h-[50vh] lg:h-auto">
                <ChatPane 
                    messages={messages}
                    participants={roomData?.participants || {}}
                    isHost={isHost}
                    onSendMessage={handleSendMessage}
                    onKickUser={handleKickUser}
                />
            </div>
        </div>
    );
};

export default WatchTogetherPage;
