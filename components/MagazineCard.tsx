import React from 'react';
import type { Magazine } from '../types';
import { BookOpenIcon } from './icons/Icons';

interface MagazineCardProps {
  magazine: Magazine;
}

const MagazineCard: React.FC<MagazineCardProps> = ({ magazine }) => {
  return (
    <a
      href={magazine.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-6 bg-[rgb(var(--surface-2))] rounded-[2rem] shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.5] hover:-translate-y-2"
    >
      <h3 className="font-bold text-lg text-[rgb(var(--text-primary))] truncate group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{magazine.name}</h3>
      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))] mt-3">
        <BookOpenIcon className="w-4 h-4" />
        <span>{magazine.count.toLocaleString()} titles</span>
      </div>
    </a>
  );
};

export default MagazineCard;