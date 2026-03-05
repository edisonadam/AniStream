

import React, { useState, useEffect, useMemo } from 'react';
import type { Comment as CommentType, Anime, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { useToast } from '../hooks/useToast';
import { MessageCircleIcon, UserPlusIcon, CheckIcon, ThumbsUpIcon, ArrowTopRightOnSquareIcon, VerifiedIcon, TrashIcon, PencilIcon, FlagIcon, DotsVerticalIcon, ShareIcon, CloseIcon } from './icons/Icons';
import { formatRelativeTime, getCanonicalId } from '../utils';
import { db } from '../firebase';
import { ref, onValue, push, serverTimestamp, runTransaction, remove, update } from 'firebase/database';
import { motion, AnimatePresence } from 'motion/react';

interface CommentsProps {
  anime: Anime;
  currentSeason?: number;
  currentEpisode?: number;
  onUserSelect: (user: User) => void;
  isModalMode?: boolean;
  onOpenInModal?: () => void;
  insertText?: string | null;
}

type SortOrder = 'newest' | 'oldest' | 'top';

const ReportModal: React.FC<{ onClose: () => void; onReport: (reason: string) => void }> = ({ onClose, onReport }) => {
    const [reason, setReason] = useState('');
    const reasons = ['Spoilers', 'Harassment', 'Hate Speech', 'Spam', 'Inappropriate Content', 'Other'];

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={onClose}
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-[rgb(var(--surface-2))] rounded-2xl shadow-2xl p-6 border border-white/10"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FlagIcon className="w-5 h-5 text-red-500" />
                    Report Comment
                </h3>
                <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">Why are you reporting this comment?</p>
                
                <div className="space-y-2 mb-6">
                    {reasons.map(r => (
                        <button 
                            key={r} 
                            onClick={() => setReason(r)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${reason === r ? 'bg-[rgb(var(--color-primary))]/20 border-[rgb(var(--color-primary))] text-[rgb(var(--text-primary))]' : 'bg-[rgb(var(--surface-3))] border-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition-colors">Cancel</button>
                    <button 
                        disabled={!reason}
                        onClick={() => onReport(reason)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Report
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Spoiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    return isRevealed ? (
        <div className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1">{children}</div>
    ) : (
        <button onClick={() => setIsRevealed(true)} className="w-full text-left p-3 bg-[rgb(var(--surface-3))] rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-4))] transition-colors">
            This comment contains spoilers. Click to reveal.
        </button>
    );
};

const CommentForm: React.FC<{
  user: User;
  onSubmit: (text: string, isSpoiler: boolean) => void;
  cta: string;
  placeholder: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  initialText?: string;
}> = ({ user, onSubmit, cta, placeholder, onCancel, autoFocus = false, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
      if (initialText && !initialText.startsWith('@')) {
          setText(prev => {
              if (prev.endsWith(initialText)) return prev;
              const prefix = prev && !prev.endsWith(' ') ? prev + ' ' : prev;
              return prefix + initialText;
          });
      }
  }, [initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim(), isSpoiler);
    setText('');
    setIsSpoiler(false);
  };

  return (
    <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover border-2 border-white/5" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[rgb(var(--surface-2))] rounded-full"></div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <div className={`relative rounded-2xl border transition-all duration-300 ${isFocused ? 'bg-[rgb(var(--surface-3))] border-[rgb(var(--color-primary))] shadow-[0_0_20px_rgba(var(--color-primary),0.15)]' : 'bg-[rgb(var(--surface-input))/0.2] border-white/10'}`}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="w-full bg-transparent p-4 text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))] outline-none resize-none min-h-[100px]"
                autoFocus={autoFocus}
            ></textarea>
            
            <div className="flex items-center justify-between p-3 border-t border-white/5 bg-white/[0.02] rounded-b-2xl">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-muted))] cursor-pointer hover:text-[rgb(var(--text-secondary))] transition-colors">
                        <input 
                            type="checkbox" 
                            checked={isSpoiler} 
                            onChange={e => setIsSpoiler(e.target.checked)} 
                            className="h-4 w-4 rounded bg-white/5 border-white/10 text-[rgb(var(--color-primary))] focus:ring-0 focus:ring-offset-0" 
                        />
                        Mark as spoiler
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="px-4 py-2 text-sm font-bold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={!text.trim()}
                        className="px-6 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-[rgb(var(--color-primary))/0.2]"
                    >
                        {cta}
                    </button>
                </div>
            </div>
          </div>
        </form>
    </div>
  )
}

const Comments: React.FC<CommentsProps> = ({ anime, currentSeason, currentEpisode, onUserSelect, isModalMode = false, onOpenInModal, insertText }) => {
  const { isLoggedIn, user } = useAuth();
  const { addFriend, isFriend, addNotification, addAniTokens, isUserBlocked } = useProfileData();
  const { addToast } = useToast();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Store parent comment ID
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentScope, setCommentScope] = useState<'episode' | 'all'>('episode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  
  const currentEpisodeIdentifier = `s${currentSeason}e${currentEpisode}`;
  const canonicalId = useMemo(() => getCanonicalId(anime), [anime]);

  useEffect(() => {
    const commentsRef = ref(db, `comments/${encodeURIComponent(canonicalId)}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const commentsList: CommentType[] = Object.entries(data).map(([id, value]) => ({
                id,
                ...(value as Omit<CommentType, 'id'>),
            }));
            setComments(commentsList);
        } else {
            setComments([]);
        }
    });

    return () => unsubscribe();
  }, [canonicalId]);

  const handleAddComment = (text: string, isSpoiler: boolean, parentId?: string) => {
    if (!user) return;
    const commentsRef = ref(db, `comments/${encodeURIComponent(canonicalId)}`);
    const newComment: Omit<CommentType, 'id'> = {
      animeId: anime.id,
      episodeIdentifier: commentScope === 'episode' ? currentEpisodeIdentifier : undefined,
      user: user,
      text: text,
      timestamp: serverTimestamp() as any,
      likes: 0,
      animeTitle: anime.title,
      animeThumbnail: anime.thumbnail,
      animeBanner: anime.bannerImage,
      isSpoiler: isSpoiler,
      parentId: parentId,
    };
    push(commentsRef, newComment);
    addAniTokens(parentId ? 300 : 600); // Award tokens for commenting/replying
    
    if (parentId) {
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment && parentComment.user.uid !== user.uid) {
            addNotification({
                type: 'reply',
                text: `replied to your comment on ${anime.title}`,
                relatedUser: user,
                animeId: anime.id,
                commentId: parentId,
            }, parentComment.user.username);
        }
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!user) return;
    const commentRef = ref(db, `comments/${encodeURIComponent(canonicalId)}/${commentId}`);
    remove(commentRef).then(() => {
        addToast("Comment deleted", "success");
    }).catch(err => {
        console.error("Failed to delete comment", err);
        addToast("Failed to delete comment", "error");
    });
  };

  const handleEditComment = (commentId: string, newText: string, isSpoiler: boolean) => {
    if (!user) return;
    const commentRef = ref(db, `comments/${encodeURIComponent(canonicalId)}/${commentId}`);
    update(commentRef, {
        text: newText,
        isSpoiler: isSpoiler,
        isEdited: true,
    }).then(() => {
        addToast("Comment updated", "success");
        setEditingCommentId(null);
    }).catch(err => {
        console.error("Failed to update comment", err);
        addToast("Failed to update comment", "error");
    });
  };

  const handleReportComment = (commentId: string, reason: string) => {
    addToast(`Comment reported for ${reason}. Our moderators will review it.`, "info");
    setReportingCommentId(null);
    setActiveMenuId(null);
  };

  const handleCopyCommentLink = (commentId: string) => {
    const url = `${window.location.origin}/?animeId=${anime.id}&commentId=${commentId}`;
    navigator.clipboard.writeText(url).then(() => {
        addToast("Comment link copied to clipboard", "success");
    });
    setActiveMenuId(null);
  };
  
  const commentTree = useMemo(() => {
    const filtered = comments.filter(c => !isUserBlocked(c.user.uid));
    
    if (commentScope === 'episode') {
        // For episode scope, we show comments for this episode OR comments with no episode identifier (general)
        // But we also need to make sure replies to those comments are shown.
    }

    const topLevelComments = filtered.filter(c => !c.parentId);
    const replies = filtered.filter(c => c.parentId);

    const filteredTopLevel = topLevelComments.filter(c => {
        if (commentScope === 'episode') {
            return c.episodeIdentifier === currentEpisodeIdentifier || !c.episodeIdentifier;
        }
        return true;
    });

    if (sortOrder === 'newest') {
        filteredTopLevel.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'oldest') {
        filteredTopLevel.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'top') {
        filteredTopLevel.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return filteredTopLevel.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parentId === comment.id).sort((a, b) => a.timestamp - b.timestamp)
    }));
  }, [comments, commentScope, currentEpisodeIdentifier, sortOrder, isUserBlocked]);
  
  const handleLike = (commentId: string) => {
    if (!isLoggedIn) {
        onOpenInModal && onOpenInModal(); // Trigger login prompt via modal if available
        return;
    }
    const commentLikesRef = ref(db, `comments/${encodeURIComponent(canonicalId)}/${commentId}/likes`);
    runTransaction(commentLikesRef, (currentLikes) => {
        return (currentLikes || 0) + 1;
    });
  };

  const handleAddFriend = (friend: User) => {
    if(addFriend(friend)) {
        if (user) {
             addNotification({
                type: 'friend_request',
                text: 'accepted your friend request!',
                relatedUser: user,
                animeId: anime.id,
            }, friend.username);
        }
    }
  };


  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-[rgb(var(--text-primary))]">Comments</h3>
      <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
        {/* Comment controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                <button onClick={() => setCommentScope('episode')} className={`px-3 py-1 text-sm rounded-full transition-all ${commentScope === 'episode' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>This Episode</button>
                <button onClick={() => setCommentScope('all')} className={`px-3 py-1 text-sm rounded-full transition-all ${commentScope === 'all' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>All Comments</button>
            </div>
            <div className="flex items-center gap-2">
                 <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                    {(['newest', 'oldest', 'top'] as SortOrder[]).map(sort => (
                        <button key={sort} onClick={() => setSortOrder(sort)} className={`px-3 py-1 text-xs sm:text-sm rounded-full capitalize transition-all ${sortOrder === sort ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{sort}</button>
                    ))}
                </div>
                {!isModalMode && onOpenInModal && (
                    <button onClick={onOpenInModal} title="View in full page" className="p-2 bg-[rgb(var(--surface-3))] rounded-full text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>

        {isLoggedIn && user ? (
          <div className="mb-6">
            <CommentForm user={user} onSubmit={handleAddComment} cta="Post Comment" placeholder="Add a public comment..." initialText={insertText || ''} />
          </div>
        ) : (
          <div className="text-center p-4 mb-6 bg-[rgb(var(--surface-3))] rounded-xl">
              <p className="text-[rgb(var(--text-secondary))]">Please log in to comment and interact.</p>
          </div>
        )}
        
        {commentTree.length > 0 ? (
          <div className="space-y-6">
            {commentTree.map(comment => (
              <div key={comment.id} className="group">
                <div className="flex items-start gap-4">
                    <img loading="lazy" src={comment.user.avatar} alt={comment.user.username} className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onUserSelect(comment.user)} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-bold text-[rgb(var(--text-primary))] cursor-pointer flex items-center gap-1.5 hover:text-[rgb(var(--color-primary-accent))] transition-colors" onClick={() => onUserSelect(comment.user)}>
                                {comment.user.username}
                                {comment.user.isVip && <VerifiedIcon className="w-4 h-4 text-yellow-400" title="VIP Member" />}
                            </div>
                            {isFriend(comment.user.username) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Friend</span>
                            )}
                            <span className="text-xs text-[rgb(var(--text-muted))]">{formatRelativeTime(comment.timestamp)}</span>
                        </div>
                        {comment.isSpoiler ? (
                            <Spoiler>
                                <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1 leading-relaxed">{comment.text}</p>
                            </Spoiler>
                        ) : (
                            editingCommentId === comment.id ? (
                                <div className="mt-2">
                                    <CommentForm 
                                        user={user!} 
                                        onSubmit={(text, isSpoiler) => handleEditComment(comment.id, text, isSpoiler)} 
                                        cta="Save" 
                                        placeholder="Edit your comment..." 
                                        initialText={comment.text}
                                        onCancel={() => setEditingCommentId(null)}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1 leading-relaxed">
                                    {comment.text}
                                    {comment.isEdited && <span className="text-[10px] text-[rgb(var(--text-muted))] ml-2 italic">(edited)</span>}
                                </p>
                            )
                        )}
                        <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => handleLike(comment.id)} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">
                                <ThumbsUpIcon className="w-4 h-4" /> <span>{comment.likes || 0}</span>
                            </button>
                            <button onClick={() => setReplyingTo(comment.id)} className="text-sm font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Reply</button>
                            {isLoggedIn && user?.uid !== comment.user.uid && (
                                !isFriend(comment.user.username) && (
                                    <button onClick={() => handleAddFriend(comment.user)} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] transition-colors"><UserPlusIcon className="w-4 h-4" /> Add Friend</button>
                                )
                            )}
                            
                            {/* Comment Actions Menu */}
                            <div className="relative ml-auto">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(activeMenuId === comment.id ? null : comment.id);
                                    }} 
                                    className={`p-2 rounded-full transition-all ${activeMenuId === comment.id ? 'bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--text-muted))] hover:bg-white/5 hover:text-[rgb(var(--text-primary))]'}`}
                                >
                                    <DotsVerticalIcon className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                    {activeMenuId === comment.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute right-0 bottom-full mb-2 w-48 bg-[rgb(var(--surface-2))] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 overflow-hidden backdrop-blur-xl"
                                            >
                                                <div className="p-1.5">
                                                    {user?.uid === comment.user.uid ? (
                                                        <>
                                                            <button onClick={() => { setEditingCommentId(comment.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-[rgb(var(--text-primary))] rounded-xl transition-all">
                                                                <PencilIcon className="w-4 h-4" /> Edit Comment
                                                            </button>
                                                            <button onClick={() => { if(window.confirm("Delete this comment?")) handleDeleteComment(comment.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                                                                <TrashIcon className="w-4 h-4" /> Delete Comment
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => { setReportingCommentId(comment.id); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                                                            <FlagIcon className="w-4 h-4" /> Report Comment
                                                        </button>
                                                    )}
                                                    <div className="h-px bg-white/5 my-1 mx-2"></div>
                                                    <button onClick={() => handleCopyCommentLink(comment.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-white/5 hover:text-[rgb(var(--text-primary))] rounded-xl transition-all">
                                                        <ShareIcon className="w-4 h-4" /> Copy Link
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        
                        {/* Replies */}
                        {comment.replies.length > 0 && (
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-white/5">
                                {comment.replies.map(reply => (
                                    <div key={reply.id} className="flex items-start gap-3 group/reply">
                                        <img loading="lazy" src={reply.user.avatar} alt={reply.user.username} className="w-8 h-8 rounded-full cursor-pointer" onClick={() => onUserSelect(reply.user)} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="font-bold text-sm text-[rgb(var(--text-primary))] cursor-pointer flex items-center gap-1" onClick={() => onUserSelect(reply.user)}>
                                                    {reply.user.username}
                                                    {reply.user.isVip && <VerifiedIcon className="w-3.5 h-3.5 text-yellow-400" />}
                                                </div>
                                                <span className="text-[10px] text-[rgb(var(--text-muted))]">{formatRelativeTime(reply.timestamp)}</span>
                                            </div>
                                            {editingCommentId === reply.id ? (
                                                <div className="mt-2">
                                                    <CommentForm 
                                                        user={user!} 
                                                        onSubmit={(text, isSpoiler) => handleEditComment(reply.id, text, isSpoiler)} 
                                                        cta="Save" 
                                                        placeholder="Edit your reply..." 
                                                        initialText={reply.text}
                                                        onCancel={() => setEditingCommentId(null)}
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-0.5">
                                                    {reply.text}
                                                    {reply.isEdited && <span className="text-[10px] text-[rgb(var(--text-muted))] ml-2 italic">(edited)</span>}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <button onClick={() => handleLike(reply.id)} className="flex items-center gap-1 text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                                                    <ThumbsUpIcon className="w-3.5 h-3.5" /> <span>{reply.likes || 0}</span>
                                                </button>
                                                
                                                {/* Reply Actions */}
                                                <div className="relative opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                    <button onClick={() => setActiveMenuId(activeMenuId === reply.id ? null : reply.id)} className="p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
                                                        <DotsVerticalIcon className="w-3 h-3" />
                                                    </button>
                                                    {activeMenuId === reply.id && (
                                                        <div className="absolute left-0 top-full mt-1 w-36 bg-[rgb(var(--surface-2))] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-modal-pop-in">
                                                            {user?.uid === reply.user.uid ? (
                                                                <>
                                                                    <button onClick={() => { setEditingCommentId(reply.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[rgb(var(--text-secondary))] hover:bg-white/5 transition-colors">
                                                                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                                                                    </button>
                                                                    <button onClick={() => { if(window.confirm("Delete this reply?")) handleDeleteComment(reply.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors">
                                                                        <TrashIcon className="w-3.5 h-3.5" /> Delete
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button onClick={() => handleReportComment(reply.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors">
                                                                    <FlagIcon className="w-3.5 h-3.5" /> Report
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {replyingTo === comment.id && user && (
                            <div className="mt-4 pl-4 border-l-2 border-[rgb(var(--color-primary))]/30">
                                <CommentForm 
                                    user={user}
                                    onSubmit={(text, isSpoiler) => { handleAddComment(text, isSpoiler, comment.id); setReplyingTo(null); }}
                                    cta="Post Reply"
                                    placeholder={`Replying to ${comment.user.username}...`}
                                    onCancel={() => setReplyingTo(null)}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[rgb(var(--text-muted))]">
            <MessageCircleIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="font-semibold">No comments yet.</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
      
      <AnimatePresence>
          {reportingCommentId && (
              <ReportModal 
                  onClose={() => setReportingCommentId(null)} 
                  onReport={(reason) => handleReportComment(reportingCommentId, reason)} 
              />
          )}
      </AnimatePresence>
    </div>
  );
};

export default Comments;