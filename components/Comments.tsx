import React, { useState, useEffect, useMemo } from 'react';
import type { Comment as CommentType, Anime, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { MessageCircleIcon, UserPlusIcon, CheckIcon, ThumbsUpIcon } from './icons/Icons';
import { formatRelativeTime } from '../utils';

interface CommentsProps {
  anime: Anime;
  currentSeason?: number;
  currentEpisode?: number;
  onUserSelect: (user: User) => void;
}

type SortOrder = 'newest' | 'oldest' | 'top';

const CommentForm: React.FC<{
  onSubmit: (text: string) => void;
  cta: string;
  placeholder: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}> = ({ onSubmit, cta, placeholder, onCancel, autoFocus = false }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl p-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
        rows={2}
        autoFocus={autoFocus}
      ></textarea>
      <div className="flex justify-end items-center gap-2 mt-2">
        {onCancel && (
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-white/10 text-[rgb(var(--text-secondary))] rounded-full font-semibold hover:bg-white/20 transition-colors text-sm">
                Cancel
            </button>
        )}
        <button type="submit" className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors text-sm">
            {cta}
        </button>
      </div>
    </form>
  )
}

const Comments: React.FC<CommentsProps> = ({ anime, currentSeason, currentEpisode, onUserSelect }) => {
  const { isLoggedIn, user } = useAuth();
  const { addFriend, isFriend, addNotification, addAniTokens } = useProfileData();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Store parent comment ID
  const [commentScope, setCommentScope] = useState<'episode' | 'all'>('episode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
  const storageKey = `comments_${anime.id}`;
  const currentEpisodeIdentifier = `s${currentSeason}e${currentEpisode}`;

  useEffect(() => {
    try {
      const storedComments = localStorage.getItem(storageKey);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      }
    } catch (e) {
      console.error("Failed to load comments", e);
    }
  }, [storageKey]);

  const persistComments = (newComments: CommentType[]) => {
    setComments(newComments);
    localStorage.setItem(storageKey, JSON.stringify(newComments));
  };

  const handleAddComment = (text: string) => {
    if (!user) return;
    const newComment: CommentType = {
      id: Date.now().toString(),
      animeId: anime.id,
      episodeIdentifier: commentScope === 'episode' ? currentEpisodeIdentifier : undefined,
      user: user,
      text: text,
      timestamp: Date.now(),
      likes: 0,
      animeTitle: anime.title,
      animeThumbnail: anime.thumbnail,
      animeBanner: anime.bannerImage,
    };
    persistComments([newComment, ...comments]);
    addAniTokens(600); // Award tokens for commenting
  };
  
  const filteredComments = useMemo(() => {
    let filtered = [...comments];
    if (commentScope === 'episode') {
        filtered = comments.filter(c => c.episodeIdentifier === currentEpisodeIdentifier || !c.episodeIdentifier); // Also show comments not tied to an episode
    }
    
    if (sortOrder === 'newest') {
        filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOrder === 'oldest') {
        filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOrder === 'top') {
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return filtered;
  }, [comments, commentScope, currentEpisodeIdentifier, sortOrder]);
  
  const handleLike = (commentId: string) => {
    const updatedComments = comments.map(c => 
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    );
    persistComments(updatedComments);
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
        {isLoggedIn && user ? (
          <div className="mb-6">
            <CommentForm onSubmit={handleAddComment} cta="Post Comment" placeholder="Add a public comment..." />
          </div>
        ) : (
          <div className="text-center p-4 mb-6 bg-[rgb(var(--surface-3))] rounded-xl">
              <p className="text-[rgb(var(--text-secondary))]">Please log in to comment and interact.</p>
          </div>
        )}
        
        {/* Comment controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                <button onClick={() => setCommentScope('episode')} className={`px-3 py-1 text-sm rounded-full transition-all ${commentScope === 'episode' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>This Episode</button>
                <button onClick={() => setCommentScope('all')} className={`px-3 py-1 text-sm rounded-full transition-all ${commentScope === 'all' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>All Comments</button>
            </div>
             <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                {(['newest', 'oldest', 'top'] as SortOrder[]).map(sort => (
                    <button key={sort} onClick={() => setSortOrder(sort)} className={`px-3 py-1 text-xs sm:text-sm rounded-full capitalize transition-all ${sortOrder === sort ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{sort}</button>
                ))}
            </div>
        </div>

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
                  <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1">{comment.text}</p>
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
                   {replyingTo === comment.id && (
                    <div className="mt-4">
                        <CommentForm 
                            onSubmit={(text) => { /* Reply logic to be implemented */ setReplyingTo(null); }}
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