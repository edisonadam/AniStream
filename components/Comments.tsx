
import React, { useState, useEffect, useMemo } from 'react';
import type { Comment as CommentType, Anime, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { MessageCircleIcon, UserPlusIcon, CheckIcon, ThumbsUpIcon, ArrowTopRightOnSquareIcon } from './icons/Icons';
import { formatRelativeTime, getCanonicalId } from '../utils';
import { db } from '../firebase';
import { ref, onValue, push, serverTimestamp, runTransaction } from 'firebase/database';

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

  useEffect(() => {
      if (initialText) {
          setText(prev => {
              // Avoid duplicating if re-renders happen quickly
              if (prev.endsWith(initialText)) return prev;
              // If text is not empty and doesn't end with space, add a space
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
        <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl p-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
            rows={2}
            autoFocus={autoFocus}
          ></textarea>
          <div className="flex justify-between items-center gap-2 mt-2">
            <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))] cursor-pointer">
                <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[rgb(var(--color-primary))]" />
                Mark as spoiler
            </label>
            <div className="flex items-center gap-2">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-white/10 text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-white/20 transition-colors text-sm">
                        Cancel
                    </button>
                )}
                <button type="submit" className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors text-sm">
                    {cta}
                </button>
            </div>
          </div>
        </form>
    </div>
  )
}

const Comments: React.FC<CommentsProps> = ({ anime, currentSeason, currentEpisode, onUserSelect, isModalMode = false, onOpenInModal, insertText }) => {
  const { isLoggedIn, user } = useAuth();
  const { addFriend, isFriend, addNotification, addAniTokens, isUserBlocked } = useProfileData();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Store parent comment ID
  const [commentScope, setCommentScope] = useState<'episode' | 'all'>('episode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
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

  const handleAddComment = (text: string, isSpoiler: boolean) => {
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
    };
    push(commentsRef, newComment);
    addAniTokens(600); // Award tokens for commenting
  };
  
  const filteredComments = useMemo(() => {
    let filtered = comments.filter(c => !isUserBlocked(c.user.uid));

    if (commentScope === 'episode') {
        filtered = filtered.filter(c => c.episodeIdentifier === currentEpisodeIdentifier || !c.episodeIdentifier); // Also show comments not tied to an episode
    }
    
    if (sortOrder === 'newest') {
        filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'oldest') {
        filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'top') {
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return filtered;
  }, [comments, commentScope, currentEpisodeIdentifier, sortOrder, isUserBlocked]);
  
  const handleLike = (commentId: string) => {
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
        
        {filteredComments.length > 0 ? (
          <div className="space-y-6">
            {filteredComments.map(comment => (
              <div key={comment.id} className="flex items-start gap-4">
                <img loading="lazy" src={comment.user.avatar} alt={comment.user.username} className="w-10 h-10 rounded-full cursor-pointer" onClick={() => onUserSelect(comment.user)} />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-[rgb(var(--text-primary))] cursor-pointer" onClick={() => onUserSelect(comment.user)}>{comment.user.username}</span>
                    <span className="text-xs text-[rgb(var(--text-muted))]">{formatRelativeTime(comment.timestamp)}</span>
                  </div>
                  {comment.isSpoiler ? (
                    <Spoiler>
                        <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1">{comment.text}</p>
                    </Spoiler>
                  ) : (
                    <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1">{comment.text}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                     <button onClick={() => handleLike(comment.id)} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                        <ThumbsUpIcon className="w-4 h-4" /> <span>{comment.likes || 0}</span>
                    </button>
                    <button onClick={() => setReplyingTo(comment.id)} className="text-sm font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">Reply</button>
                    {isLoggedIn && user?.uid !== comment.user.uid && (
                        isFriend(comment.user.username) ? (
                            <div className="flex items-center gap-1 text-sm text-green-400"><CheckIcon className="w-4 h-4" /> Friend</div>
                        ) : (
                            <button onClick={() => handleAddFriend(comment.user)} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><UserPlusIcon className="w-4 h-4" /> Add Friend</button>
                        )
                    )}
                  </div>
                   {replyingTo === comment.id && user && (
                    <div className="mt-4">
                        <CommentForm 
                            user={user}
                            onSubmit={(text, isSpoiler) => { /* Reply logic to be implemented */ setReplyingTo(null); }}
                            cta="Post Reply"
                            placeholder={`Replying to ${comment.user.username}...`}
                            onCancel={() => setReplyingTo(null)}
                            autoFocus
                        />
                    </div>
                  )}
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
    </div>
  );
};

export default Comments;
