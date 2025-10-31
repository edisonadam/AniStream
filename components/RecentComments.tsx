
import React, { useState, useEffect } from 'react';
import type { Anime, Comment } from '../types';
import { getRecentComments } from '../utils';
import { mapJikanToAnime } from '../api';

interface RecentCommentsProps {
    onAnimeSelect: (anime: Anime) => void;
}

const RecentComments: React.FC<RecentCommentsProps> = ({ onAnimeSelect }) => {
    const [comments, setComments] = useState<Comment[]>([]);

    useEffect(() => {
        const recent = getRecentComments(20);
        // Filter for unique anime comments to avoid showing multiple from the same show
        const uniqueAnimeComments = Array.from(new Map(recent.map(c => [c.animeId, c])).values());
        setComments(uniqueAnimeComments);
    }, []);

    const handleCommentClick = (comment: Comment) => {
        // We need to create a minimal Anime object to pass to the player
        const partialAnime: Anime = {
            id: comment.animeId,
            title: comment.animeTitle,
            thumbnail: comment.animeThumbnail,
            bannerImage: '',
            synopsis: '',
            genres: [],
            releaseYear: null,
            status: 'Completed',
            totalEpisodes: null,
            rating: null,
            type: null,
            studio: '',
            hasSub: true,
            hasDub: false,
            runtime: null,
            avgEpisodeDuration: null,
            isAdult: false,
            title_english: comment.animeTitle,
            title_japanese: '',
        };
        onAnimeSelect(partialAnime);
    };
    
    if(comments.length === 0) return null;

    return (
        <section className="py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))] mb-6" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Recent Comments
                </h2>
            </div>
             <div className="flex gap-6 overflow-x-auto pb-4 pl-4 sm:pl-6 lg:pl-8" style={{ scrollbarWidth: 'thin' }}>
                {comments.map(comment => (
                    <div 
                        key={comment.id}
                        onClick={() => handleCommentClick(comment)}
                        className="group flex-shrink-0 w-80 sm:w-96 bg-[rgb(var(--surface-2))] rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:shadow-2xl hover:shadow-[rgb(var(--shadow-color))/0.5] hover:-translate-y-2"
                    >
                        <div className="relative h-24 sm:h-28 rounded-t-2xl overflow-hidden">
                             <img src={comment.animeThumbnail} alt={comment.animeTitle} className="w-full h-full object-cover opacity-50 transition-opacity duration-300 group-hover:opacity-80" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                             <h3 className="absolute bottom-2 left-4 font-bold text-white truncate max-w-[90%] group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                                {comment.animeTitle}
                            </h3>
                        </div>
                        <div className="p-4">
                            <p className="text-[rgb(var(--text-secondary))] text-sm italic line-clamp-2">"{comment.text}"</p>
                            <div className="flex items-center gap-2 mt-3">
                                <img src={comment.user.avatar} alt={comment.user.username} className="w-8 h-8 rounded-full" />
                                <span className="font-semibold text-sm text-[rgb(var(--text-muted))]">{comment.user.username}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RecentComments;
