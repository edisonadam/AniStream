import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Anime, Comment } from '../types';
import { getAllComments, formatRelativeTime } from '../utils';
import { ChevronLeftIcon, ChevronRightIcon, ThumbsUpIcon } from './icons/Icons';

interface RecentCommentsCarouselProps {
    onAnimeSelect: (anime: Anime) => void;
}

type SortOrder = 'newest' | 'oldest' | 'top';

const RecentCommentsCarousel: React.FC<RecentCommentsCarouselProps> = ({ onAnimeSelect }) => {
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

    useEffect(() => {
        const all = getAllComments();
        setAllComments(all);
    }, []);

    const sortedAndFilteredComments = useMemo(() => {
        let sorted = [...allComments];
        if (sortOrder === 'newest') {
            sorted.sort((a, b) => b.timestamp - a.timestamp);
        } else if (sortOrder === 'oldest') {
            sorted.sort((a, b) => a.timestamp - b.timestamp);
        } else if (sortOrder === 'top') {
            sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        }
        const uniqueAnimeComments = Array.from(new Map(sorted.map(c => [c.animeId, c])).values());
        return uniqueAnimeComments.slice(0, 10);
    }, [allComments, sortOrder]);
    
    const comments = sortedAndFilteredComments;

    const nextSlide = useCallback(() => {
        if (comments.length === 0) return;
        setCurrentIndex(prev => (prev + 1) % comments.length);
    }, [comments.length]);

    const prevSlide = () => {
        if (comments.length === 0) return;
        setCurrentIndex(prev => (prev - 1 + comments.length) % comments.length);
    };

    useEffect(() => {
        setCurrentIndex(0); // Reset index when sort order changes
    }, [sortOrder]);

    useEffect(() => {
        if (comments.length <= 1) return;
        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [comments.length, nextSlide]);
    
    const handleCommentClick = (comment: Comment) => {
        const partialAnime: Anime = {
            id: comment.animeId, title: comment.animeTitle, thumbnail: comment.animeThumbnail, bannerImage: comment.animeBanner,
            synopsis: '', genres: [], releaseYear: null, status: 'Completed', totalEpisodes: null, rating: null, type: null, studio: '',
            hasSub: true, hasDub: false, runtime: null, avgEpisodeDuration: null, isAdult: false, title_english: comment.animeTitle, title_japanese: '',
        };
        onAnimeSelect(partialAnime);
    };

    if (comments.length === 0) return null;

    return (
        <section className="relative w-full h-[50vh] min-h-[400px] group overflow-hidden my-8">
            {comments.map((comment, index) => (
                <div 
                    key={comment.id + sortOrder}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                    <img loading="lazy" src={comment.animeBanner} alt={comment.animeTitle} className={`w-full h-full object-cover ${index === currentIndex ? 'animate-ken-burns' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                </div>
            ))}

             <div className="absolute top-0 left-0 container mx-auto px-4 sm:px-6 lg:px-8 py-6 z-20 flex justify-between items-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ textShadow: `0 2px 8px rgba(0,0,0,0.8)` }}>
                    Community Buzz
                </h2>
                <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                    {(['newest', 'oldest', 'top'] as SortOrder[]).map(sort => (
                        <button key={sort} onClick={() => setSortOrder(sort)} className={`px-3 py-1 text-xs sm:text-sm rounded-full capitalize transition-all ${sortOrder === sort ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{sort}</button>
                    ))}
                </div>
            </div>

            <div className="relative h-full flex flex-col justify-end container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
                 <div key={currentIndex + sortOrder} className="animate-subtle-fade-in-up" onClick={() => handleCommentClick(comments[currentIndex])}>
                    <p className="text-xl sm:text-2xl italic font-light line-clamp-3 max-w-3xl cursor-pointer">"{comments[currentIndex].text}"</p>
                    <div className="flex items-center gap-3 mt-4">
                        <img loading="lazy" src={comments[currentIndex].user.avatar} alt={comments[currentIndex].user.username} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <p className="font-semibold">{comments[currentIndex].user.username}</p>
                            <p className="text-sm text-gray-300">
                                on <span className="font-bold text-[rgb(var(--color-primary-accent))]">{comments[currentIndex].animeTitle}</span>
                                <span className="text-gray-400"> &bull; {formatRelativeTime(comments[currentIndex].timestamp)}</span>
                            </p>
                        </div>
                        {comments[currentIndex].likes > 0 && (
                            <div className="flex items-center gap-1.5 text-lg font-bold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                                <ThumbsUpIcon className="w-5 h-5 text-[rgb(var(--color-primary-accent))]"/>
                                <span>{comments[currentIndex].likes}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button onClick={prevSlide} className="absolute top-1/2 left-4 transform -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgb(var(--color-primary))] z-20"><ChevronLeftIcon/></button>
            <button onClick={nextSlide} className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgb(var(--color-primary))] z-20"><ChevronRightIcon/></button>
            
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {comments.map((_, index) => (
                  <button 
                    key={index} 
                    onClick={() => setCurrentIndex(index)} 
                    className={`w-6 h-1.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-[rgb(var(--color-primary-accent))]' : 'bg-gray-500/50 hover:bg-gray-400'}`}
                  ></button>
                ))}
            </div>
        </section>
    );
};

export default RecentCommentsCarousel;