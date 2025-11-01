import React, { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';
import type { Anime, Room } from '../types';
import { CloseIcon, UsersIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';

interface RoomManagerModalProps {
  anime: Anime;
  currentSeason: number;
  currentEpisode: number;
  onClose: () => void;
  onEnterRoom: (roomId: string) => void;
}

const RoomManagerModal: React.FC<RoomManagerModalProps> = ({ anime, currentSeason, currentEpisode, onClose, onEnterRoom }) => {
    const [roomIdInput, setRoomIdInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateRoom = async () => {
        if (!user) {
            setError('You must be logged in to create a room.');
            return;
        }
        setIsLoading(true);
        setError('');
        const newRoomId = generateRoomId();
        const roomRef = ref(db, `rooms/${newRoomId}`);

        const newRoom: Room = {
            hostId: user.uid,
            animeId: anime.id,
            currentSeason: currentSeason,
            currentEpisode: currentEpisode,
            playerState: {
                isPlaying: false,
                currentTime: 0,
                timestamp: Date.now(),
            },
            participants: {},
            chat: {},
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

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-[90%] max-w-sm m-4 p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <div className="text-center mb-6">
                    <UsersIcon className="mx-auto w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                    <h3 className="text-xl font-bold mt-2 text-[rgb(var(--text-primary))]">Watch Together</h3>
                </div>
                
                <div className="space-y-4">
                    <button onClick={handleCreateRoom} disabled={isLoading} className="w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50">
                        {isLoading ? 'Creating...' : 'Create New Room'}
                    </button>
                    
                    <div className="relative my-4 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <span className="relative bg-[rgb(var(--surface-2))] px-3 text-sm text-[rgb(var(--text-muted))]">OR</span>
                    </div>

                    <div>
                        <input type="text" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value)} placeholder="Enter Room ID" className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-full px-4 py-3 text-center uppercase tracking-widest text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]" />
                        <button onClick={handleJoinRoom} disabled={isLoading} className="mt-3 w-full py-3 bg-white/10 text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-white/20 disabled:opacity-50">
                            {isLoading ? 'Joining...' : 'Join Room'}
                        </button>
                    </div>
                </div>

                {error && <p className="text-[rgb(var(--color-danger))] text-sm text-center mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default RoomManagerModal;
