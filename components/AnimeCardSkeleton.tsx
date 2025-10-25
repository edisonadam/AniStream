
import React from 'react';

const AnimeCardSkeleton: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-lg shadow-lg bg-[rgb(var(--surface-2))]">
      <div className="animate-pulse">
        <div className="aspect-[2/3] w-full bg-[rgb(var(--surface-3))]"></div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="h-4 bg-[rgb(var(--surface-4))] rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default AnimeCardSkeleton;
