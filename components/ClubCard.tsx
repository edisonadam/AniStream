import React from 'react';
import type { Club } from '../types';
import { UsersIcon } from './icons/Icons';

interface ClubCardProps {
  club: Club;
  onSelect: (club: Club) => void;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(club)}
      className="club-card-touch-target group relative overflow-hidden rounded-[2rem] shadow-lg cursor-pointer bg-[rgb(var(--surface-2))] transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.5] hover:-translate-y-2"
    >
      <div className="aspect-[4/3] w-full bg-[rgb(var(--surface-3))]">
        <img src={club.images.jpg.image_url} alt={club.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-md text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{club.name}</h3>
        <div className="flex items-center justify-between text-sm text-[rgb(var(--text-muted))] mt-2">
            <div className="flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4" />
                <span>{club.members.toLocaleString()}</span>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[rgb(var(--color-primary))/0.2] text-[rgb(var(--color-primary-accent))] capitalize">{club.category.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  );
};

export default ClubCard;