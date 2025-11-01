import React, { useState } from 'react';
import type { User, Anime } from '../types';
import { CloseIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { getDisplayTitle } from '../utils';
import { useSettings } from '../hooks/useSettings';

interface InviteFriendModalProps {
  anime: Anime;
  onClose: () => void;
}

const InviteFriendModal: React.FC<InviteFriendModalProps> = ({ anime, onClose }) => {
    const { user } = useAuth();
    const { friends, addNotification } = useProfileData();
    const { settings } = useSettings();
    const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
    const [inviteSent, setInviteSent] = useState(false);

    const handleToggleFriend = (username: string) => {
        setSelectedFriends(prev => {
            const newSet = new Set(prev);
            if (newSet.has(username)) newSet.delete(username);
            else newSet.add(username);
            return newSet;
        });
    };

    const handleSendInvites = () => {
        if (!user) return;
        selectedFriends.forEach(username => {
            addNotification({
                type: 'share', // Using 'share' type for invites
                text: `invited you to watch ${getDisplayTitle(anime, settings)} together!`,
                relatedUser: user,
                animeId: anime.id,
            }, username);
        });
        setInviteSent(true);
        setTimeout(onClose, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-[90%] max-w-md m-4 p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <h3 className="text-xl font-bold mb-4 text-[rgb(var(--text-primary))]">Invite Friend</h3>
                {inviteSent ? (
                    <div className="text-center py-8">
                        <p className="text-lg font-semibold text-[rgb(var(--color-secondary-accent))]">Invites Sent!</p>
                    </div>
                ) : friends.length > 0 ? (
                    <>
                        <p className="text-sm text-[rgb(var(--text-muted))] mb-4">Select friends to send an invitation to watch <span className="font-bold">{getDisplayTitle(anime, settings)}</span>.</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {friends.map(friend => (
                                <label key={friend.username} htmlFor={`friend-${friend.username}`} className="flex items-center gap-3 p-2 rounded-xl text-left hover:bg-[rgb(var(--surface-3))] transition-colors cursor-pointer">
                                    <input type="checkbox" id={`friend-${friend.username}`} checked={selectedFriends.has(friend.username)} onChange={() => handleToggleFriend(friend.username)} className="h-5 w-5 rounded bg-[rgb(var(--surface-4))] border-[rgb(var(--border-color))] text-[rgb(var(--color-primary))]" />
                                    <img src={friend.avatar} alt={friend.username} className="w-10 h-10 rounded-full" />
                                    <span className="font-semibold text-[rgb(var(--text-secondary))]">{friend.username}</span>
                                </label>
                            ))}
                        </div>
                        <button onClick={handleSendInvites} disabled={selectedFriends.size === 0} className="mt-6 w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50">
                            Send Invites ({selectedFriends.size})
                        </button>
                    </>
                ) : (
                    <p className="text-center text-[rgb(var(--text-muted))] py-8">You have no friends to invite.</p>
                )}
            </div>
        </div>
    );
}

export default InviteFriendModal;
