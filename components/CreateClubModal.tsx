import React, { useState } from 'react';
import type { Club } from '../types';
import { CloseIcon, UsersIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';

interface CreateClubModalProps {
  onClose: () => void;
  onClubCreated: (club: Club) => void;
}

const CLUB_CREATION_COST = 50000;

const CreateClubModal: React.FC<CreateClubModalProps> = ({ onClose, onClubCreated }) => {
    const { user } = useAuth();
    const { aniTokens, spendAniTokens } = useProfileData();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('anime');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !description.trim()) {
            setError('Club name and description cannot be empty.');
            return;
        }
        if (aniTokens < CLUB_CREATION_COST) {
            setError(`You need ${CLUB_CREATION_COST.toLocaleString()} AniTokens to create a club. You currently have ${aniTokens.toLocaleString()}.`);
            return;
        }

        if (spendAniTokens(CLUB_CREATION_COST)) {
            const newClub: Club = {
                mal_id: -Math.floor(Math.random() * 1000000), // Negative ID for user-created clubs
                name: name.trim(),
                url: '#',
                images: {
                    jpg: {
                        image_url: `https://api.dicebear.com/8.x/shapes/svg?seed=${name.trim()}`,
                    },
                },
                members: 1,
                category: category,
                created: new Date().toISOString(),
                access: 'public',
                description: description.trim(),
                creator: user?.username,
                isUserCreated: true,
            };
            onClubCreated(newClub);
            onClose();
        } else {
            setError("Transaction failed. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-[90%] max-w-lg m-4 p-6 relative animate-modal-pop-in" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <div className="text-center mb-4">
                    <UsersIcon className="mx-auto w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                    <h3 className="text-xl font-bold mt-2 text-[rgb(var(--text-primary))]">Create a New Club</h3>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="club-name" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Club Name</label>
                        <input type="text" id="club-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Isekai Lovers United" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-4 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]" />
                    </div>
                     <div>
                        <label htmlFor="club-desc" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Description</label>
                        <textarea id="club-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is your club about?" required rows={3} className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-4 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]"></textarea>
                    </div>
                     <div>
                        <label htmlFor="club-category" className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">Category</label>
                        <select id="club-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl px-4 py-2 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]">
                            <option value="anime">Anime</option>
                            <option value="manga">Manga</option>
                            <option value="characters">Characters</option>
                            <option value="games">Games</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {error && <p className="text-[rgb(var(--color-danger))] text-sm text-center mt-4">{error}</p>}
                
                <div className="mt-6 border-t border-white/10 pt-4 text-center">
                    <p className="text-sm text-[rgb(var(--text-muted))]">Cost to create club:</p>
                    <p className="text-lg font-bold text-yellow-400">💎 {CLUB_CREATION_COST.toLocaleString()} AniTokens</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">You have: {aniTokens.toLocaleString()} AniTK</p>
                </div>

                <button type="submit" disabled={aniTokens < CLUB_CREATION_COST} className="mt-4 w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirm & Create Club
                </button>
            </form>
        </div>
    );
};

export default CreateClubModal;