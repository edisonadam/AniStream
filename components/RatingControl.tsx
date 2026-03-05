import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StarIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, ViewGridIcon, ViewCarouselIcon, PencilIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { db } from '../firebase';
import { ref, runTransaction, onValue, set, push } from 'firebase/database';
import { useToast } from '../hooks/useToast';
import type { Review } from '../types';
import { formatRelativeTime } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

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
        <div className="bg-[rgb(var(--surface-2))/0.4] backdrop-blur-xl border border-white/5 p-8 rounded-3xl mb-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--color-primary))]/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            
            {/* Rating Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 relative z-10">
                
                <div className="flex flex-col items-center md:items-start gap-3">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <StarIcon className="w-5 h-5 text-[rgb(var(--color-primary-accent))]" />
                        Rate this Anime
                    </h3>
                    <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <motion.button
                                key={star}
                                whileHover={{ scale: 1.2, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => handleRate(star)}
                                className={`transition-all duration-300 focus:outline-none p-0.5 ${star <= displayRating ? activeLabel.color : 'text-white/10'}`}
                            >
                                <StarIcon 
                                    className="w-7 h-7 md:w-9 md:h-9"
                                    fill={star <= displayRating ? 'currentColor' : 'none'}
                                />
                            </motion.button>
                        ))}
                    </div>
                    <div className={`text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 py-1 px-3 rounded-full bg-white/5 border border-white/5 ${activeLabel.color}`}>
                        {displayRating > 0 ? `${displayRating} / 10 • ${activeLabel.text}` : 'Select your rating'}
                    </div>
                </div>

                <div className="hidden md:block w-px h-20 bg-white/10"></div>

                <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-black tracking-widest">Manual Score</span>
                    <div className="flex items-center gap-3">
                        <input 
                            type="number" min="0" max="10" 
                            value={userRating > 0 ? userRating : ''} 
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 0 && val <= 10) handleRate(val);
                            }}
                            placeholder="-"
                            className="w-20 text-center bg-[rgb(var(--surface-3))] border border-white/10 rounded-2xl py-3 text-2xl font-black text-white focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all outline-none"
                        />
                        <span className="text-lg font-bold text-[rgb(var(--text-muted))]">/ 10</span>
                    </div>
                </div>

                <div className="hidden md:block w-px h-20 bg-white/10"></div>

                <div className="flex flex-col items-center md:items-end min-w-[140px]">
                    <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase font-black tracking-widest mb-2">AniStream Rating</span>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-4xl font-black text-white leading-none tracking-tighter">
                                {globalStats.average > 0 ? globalStats.average : '--'}
                            </div>
                            <div className="text-[10px] font-bold text-[rgb(var(--text-muted))] mt-1.5 uppercase tracking-wider">
                                {globalStats.count.toLocaleString()} votes
                            </div>
                        </div>
                         <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--color-primary))]/10 flex items-center justify-center border border-[rgb(var(--color-primary))]/20 shadow-lg shadow-[rgb(var(--color-primary))]/5">
                            <ChartBarIcon className="w-7 h-7 text-[rgb(var(--color-primary-accent))]" />
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Progress Bar Visual */}
            {globalStats.count > 0 && (
                <div className="mt-4 mb-8 relative z-10">
                    <div className="flex justify-between text-[10px] font-black text-[rgb(var(--text-muted))] uppercase tracking-widest mb-2">
                        <span>Community Sentiment</span>
                        <span className="text-white">{globalStats.average} / 10</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(globalStats.average / 10) * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${RATING_LABELS[Math.round(globalStats.average)]?.gradient || 'from-blue-500 to-purple-500'} shadow-[0_0_15px_rgba(var(--color-primary),0.3)]`} 
                        ></motion.div>
                    </div>
                </div>
            )}

            {/* Write a Review */}
            <AnimatePresence>
                {isReviewOpen && isLoggedIn && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, y: 20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: 20 }}
                        className="mt-8 bg-white/5 p-6 rounded-3xl border border-white/5 relative z-10 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <PencilIcon className="w-4 h-4 text-[rgb(var(--color-primary-accent))]" />
                            <p className="text-sm font-bold text-white">Share your thoughts</p>
                        </div>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder={`What did you think of ${animeTitle}?`}
                            className="w-full bg-[rgb(var(--surface-input))] border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all outline-none placeholder:text-white/20"
                            rows={3}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setIsReviewOpen(false)} className="px-5 py-2 text-xs font-bold text-[rgb(var(--text-muted))] hover:text-white transition-colors">Cancel</button>
                            <button onClick={submitReview} className="px-6 py-2.5 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] text-xs font-black rounded-xl hover:bg-[rgb(var(--color-primary-hover))] transition-all active:scale-95 shadow-lg shadow-[rgb(var(--color-primary))]/20">Post Review</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews Section */}
            {reviews.length > 0 && (
                <div className="mt-10 border-t border-white/5 pt-10 relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-[rgb(var(--text-muted))] uppercase tracking-[0.2em] flex items-center gap-3">
                            Community Reviews 
                            <span className="bg-white/5 px-2.5 py-1 rounded-lg text-[10px] text-white border border-white/5">{reviews.length}</span>
                        </h4>
                        <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
                             <button onClick={() => setViewMode('carousel')} className={`p-2 rounded-xl transition-all ${viewMode === 'carousel' ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`} title="Carousel View"><ViewCarouselIcon className="w-4 h-4"/></button>
                             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`} title="View All"><ViewGridIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                    
                    {viewMode === 'carousel' ? (
                        <div className="relative group">
                            <button onClick={() => scrollReviews('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 p-3 bg-black/80 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgb(var(--color-primary))] border border-white/10 shadow-2xl"><ChevronLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => scrollReviews('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 p-3 bg-black/80 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgb(var(--color-primary))] border border-white/10 shadow-2xl"><ChevronRightIcon className="w-5 h-5"/></button>
                            
                            <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-6 -mx-2 px-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                {reviews.map((review) => (
                                    <motion.div 
                                        key={review.id} 
                                        whileHover={{ y: -5 }}
                                        className="snap-start flex-shrink-0 w-80 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-xl"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img src={review.userAvatar} alt={review.username} className="w-10 h-10 rounded-full border-2 border-white/10" />
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[rgb(var(--surface-3))]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{review.username}</p>
                                                    <p className="text-[10px] font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider">{formatRelativeTime(review.timestamp)}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${RATING_LABELS[review.rating]?.color} bg-black/40 border border-white/5`}>
                                                {review.rating} / 10
                                            </div>
                                        </div>
                                        <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-4 leading-relaxed italic">"{review.text}"</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                             {reviews.map((review) => (
                                <motion.div 
                                    key={review.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-xl"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src={review.userAvatar} alt={review.username} className="w-10 h-10 rounded-full border-2 border-white/10" />
                                            <div>
                                                <p className="text-sm font-bold text-white">{review.username}</p>
                                                <p className="text-[10px] font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider">{formatRelativeTime(review.timestamp)}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${RATING_LABELS[review.rating]?.color} bg-black/40 border border-white/5`}>
                                            {review.rating} / 10
                                        </div>
                                    </div>
                                    <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed italic">"{review.text}"</p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RatingControl;
