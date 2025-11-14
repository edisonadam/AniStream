import React from 'react';
import type { Anime, User } from '../types';
import { CloseIcon } from './icons/Icons';
import Comments from './Comments';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime;
  currentSeason?: number;
  currentEpisode?: number;
  onUserSelect: (user: User) => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, ...props }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-cinematic-fade-in p-4" onClick={onClose}>
      <div 
        className="bg-[rgb(var(--surface-1))/0.9] backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-4xl h-[90vh] relative flex flex-col animate-modal-pop-in" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Comments</h3>
          <button onClick={onClose} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <Comments {...props} isModalMode={true} />
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;