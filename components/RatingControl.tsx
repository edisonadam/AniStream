import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StarIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, ViewGridIcon, ViewCarouselIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { db } from '../firebase';
import { ref, runTransaction, onValue, set, push } from 'firebase/database';
import { useToast } from '../hooks/useToast';
import type { Review } from '../types';
import { formatRelativeTime } from '../utils';

interface RatingControlProps {
    animeId: number;
    animeTitle: string;
}

const RATING_LABELS: Record<number, { text: string; color: string; gradient: string }> = {
    0: { text: 'Unrated', color: 'text-gray-400', gradient: 'from-gray-500 to-gray-700' },
    1: { text: 'Appalling', color: 'text-red-600', gradient: 'from-red-700 to-red-900' },
    2: { text: 'Horrible', color: 'text-red-500', gradient: 'from-red-600 to-red-800' },
    3: { text: 'Very Bad', color: 'text-orange-600', gradient: 'from-orange-600 to-red-600' },
    4: { text: 'Bad', color: 'text-orange-500', gradient: 'from-orange-500 to-orange-700' },
    5: { text: 'Average', color: 'text-yellow-500', gradient: 'from-yellow-500 to-yellow-700' },
    6: { text: 'Fine', color: 'text-yellow-400', gradient: 'from-yellow-400 to-yellow-600' },
    7: { text: 'Good', color: 'text-lime-500', gradient: 'from-lime-500 to-green-600' },
    8: { text: 'Very Good', color: 'text-green-500', gradient: 'from-green-500 to-emerald-600' },
    9: { text: 'Great', color: 'text-cyan-400', gradient: 'from-cyan-400 to-blue-600' },
    10: { text: 'Masterpiece', color: 'text-purple-400', gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500' },
};

const RatingControl: React.FC<RatingControlProps> = ({ animeId, animeTitle }) => {
    const { user, isLoggedIn } = useAuth();
    const { rateAnime, getRating } = useProfileData();
    const { addToast } = useToast();
    
    const userRating = getRating(animeId) || 0;
    const [hoverRating, setHoverRating] = useState(0);
    const [globalStats, setGlobalStats] = useState<{ count: number; average: number }>({ count: 0, average: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [reviewText, setReviewText] = useState('');
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch global stats
    useEffect(() => {
        const statsRef = ref(db, `site-ratings/${animeId}`);
        const unsubscribe = onValue(statsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const avg = data.count > 0 ? data.totalScore / data.count : 0;
                setGlobalStats({ count: data.count, average: parseFloat(avg.toFixed(1)) });
            }
        });
        return () => unsubscribe();
    }, [animeId]);

    // Fetch reviews
    useEffect(() => {
        const reviewsRef = ref(db, `reviews/${animeId}`);
        const unsubscribe = onValue(reviewsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list: Review[] = Object.values(data);
                setReviews(list.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setReviews([]);
            }
        });
        return () => unsubscribe();
    }, [animeId]);

    const handleRate = async (rating: number) => {
        if (!isLoggedIn || !user) {
            addToast("Please log in to rate this anime.", "warning");
            return;
        }
        
        // Optimistic update locally
        const previousRating = userRating;
        rateAnime(animeId, rating);
        
        // Open review input if not already reviewed this session
        if (!isReviewOpen) setIsReviewOpen(true);
        
        if (rating === previousRating) return;
        
        if (isSubmitting) return;
        setIsSubmitting(true);
        
        try {
            const statsRef = ref(db, `site-ratings/${animeId}`);
            await runTransaction(statsRef, (currentData) => {
                if (currentData === null) {
                    return { totalScore: rating, count: 1 };
                }
                
                let newTotal = currentData.totalScore;
                let newCount = currentData.count;

                if (previousRating > 0) {
                    // Update existing rating
                    newTotal = newTotal - previousRating + rating;
                } else {
                    // New rating
                    newTotal = newTotal + rating;
                    newCount = newCount + 1;
                }

                return { totalScore: newTotal, count: newCount };
            });
            
            addToast(`Rated "${animeTitle}" ${rating}/10`, "success");
        } catch (e) {
            console.error("Failed to submit rating", e);
            addToast("Failed to submit rating to server.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitReview = async () => {
        if (!user || !reviewText.trim()) return;
        
        const reviewId = user.uid; // One review per user per anime
        const reviewRef = ref(db, `reviews/${animeId}/${reviewId}`);
        
        const newReview: Review = {
            id: reviewId,
            userId: user.uid,
            username: user.username,
            userAvatar: user.avatar,
            animeId: animeId,
            rating: userRating,
            text: reviewText.trim(),
            timestamp: Date.now(),
            likes: 0,
        };

        try {
            await set(reviewRef, newReview);
            addToast("Review posted!", "success");
            setReviewText('');
            setIsReviewOpen(false);
        } catch (e) {
            addToast("Failed to post review.", "error");
        }
    };

    const scrollReviews = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const displayRating = hoverRating || userRating;
    const activeLabel = RATING_LABELS[Math.round(displayRating)] || RATING_LABELS[0];

    return (
        <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-6 rounded-2xl mb-8 animate-subtle-fade-in-up">
            
            {/* Rating Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                
                <div className="flex flex-col items-center md:items-start gap-2">
                    <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Rate this Anime</h3>
                    <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => handleRate(star)}
                                className={`transition-transform duration-200 hover:scale-110 focus:outline-none p-0.5 ${star <= displayRating ? activeLabel.color : 'text-gray-700'}`}
                            >
                                <StarIcon 
                                    className="w-6 h-6 md:w-8 md:h-8"
                                    fill={star <= displayRating ? 'currentColor' : 'none'}
                                />
                            </button>
                        ))}
                    </div>
                    <div className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${activeLabel.color}`}>
                        {displayRating > 0 ? `${displayRating} - ${activeLabel.text}` : 'Click to Rate'}
                    </div>
                </div>

                <div className="hidden md:block w-px h-16 bg-white/10"></div>

                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">Manual Input</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" min="0" max="10" 
                            value={userRating > 0 ? userRating : ''} 
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 10) handleRate(val);
                            }}
                            placeholder="-"
                            className="w-16 text-center bg-[rgb(var(--surface-3))] border border-white/10 rounded-xl py-2 text-lg font-bold focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
                        />
                        <span className="text-[rgb(var(--text-muted))]">/ 10</span>
                    </div>
                </div>

                <div className="hidden md:block w-px h-16 bg-white/10"></div>

                <div className="flex flex-col items-center md:items-end min-w-[120px]">
                    <span className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide mb-1">Website Rating</span>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-3xl font-black text-[rgb(var(--text-primary))] leading-none">
                                {globalStats.average > 0 ? globalStats.average : '--'}
                            </div>
                            <div className="text-xs text-[rgb(var(--text-muted))] mt-1">
                                {globalStats.count.toLocaleString()} votes
                            </div>
                        </div>
                         <div className="w-12 h-12 rounded-full bg-[rgb(var(--surface-3))] flex items-center justify-center">
                            <ChartBarIcon className="w-6 h-6 text-[rgb(var(--color-primary-accent))]" />
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Progress Bar Visual */}
            {globalStats.count > 0 && (
                <div className="mt-2 mb-6">
                    <div className="flex justify-between text-xs text-[rgb(var(--text-muted))] mb-1">
                        <span>Community Score</span>
                        <span>{globalStats.average} / 10</span>
                    </div>
                    <div className="w-full h-2 bg-[rgb(var(--surface-3))] rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r ${RATING_LABELS[Math.round(globalStats.average)]?.gradient || 'from-blue-500 to-purple-500'}`} 
                            style={{ width: `${(globalStats.average / 10) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Write a Review */}
            {isReviewOpen && isLoggedIn && (
                <div className="mt-6 bg-[rgb(var(--surface-3))/0.5] p-4 rounded-xl animate-subtle-fade-in-up">
                    <p className="text-sm font-semibold mb-2 text-[rgb(var(--text-secondary))]">Write a short review (Optional)</p>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder={`What did you think of ${animeTitle}?`}
                        className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-lg p-3 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))]"
                        rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsReviewOpen(false)} className="px-3 py-1.5 text-xs text-[rgb(var(--text-muted))] hover:text-white">Cancel</button>
                        <button onClick={submitReview} className="px-4 py-1.5 bg-[rgb(var(--color-primary))] text-white text-xs font-bold rounded-lg hover:bg-[rgb(var(--color-primary-hover))]">Post Review</button>
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
                <div className="mt-8 border-t border-white/10 pt-6 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider flex items-center gap-2">
                            Community Reviews <span className="bg-[rgb(var(--surface-3))] px-2 py-0.5 rounded text-xs text-[rgb(var(--text-primary))]">{reviews.length}</span>
                        </h4>
                        <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-lg p-1">
                             <button onClick={() => setViewMode('carousel')} className={`p-1.5 rounded ${viewMode === 'carousel' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`} title="Carousel View"><ViewCarouselIcon className="w-4 h-4"/></button>
                             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`} title="View All"><ViewGridIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                    
                    {viewMode === 'carousel' ? (
                        <div className="relative group">
                            <button onClick={() => scrollReviews('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgb(var(--color-primary))]"><ChevronLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => scrollReviews('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgb(var(--color-primary))]"><ChevronRightIcon className="w-5 h-5"/></button>
                            
                            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                {reviews.map((review) => (
                                    <div key={review.id} className="snap-start flex-shrink-0 w-72 bg-[rgb(var(--surface-3))] p-4 rounded-xl border border-white/5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <img src={review.userAvatar} alt={review.username} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{review.username}</p>
                                                    <p className="text-[10px] text-[rgb(var(--text-muted))]">{formatRelativeTime(review.timestamp)}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-xs font-bold ${RATING_LABELS[review.rating]?.color} bg-black/20`}>
                                                {review.rating}/10
                                            </div>
                                        </div>
                                        <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-3 leading-relaxed">"{review.text}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                             {reviews.map((review) => (
                                <div key={review.id} className="bg-[rgb(var(--surface-3))] p-4 rounded-xl border border-white/5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <img src={review.userAvatar} alt={review.username} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <p className="text-sm font-bold text-[rgb(var(--text-primary))]">{review.username}</p>
                                                <p className="text-[10px] text-[rgb(var(--text-muted))]">{formatRelativeTime(review.timestamp)}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-xs font-bold ${RATING_LABELS[review.rating]?.color} bg-black/20`}>
                                            {review.rating}/10
                                        </div>
                                    </div>
                                    <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">"{review.text}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RatingControl;