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
      } else {
          setComments([]);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [storageKey]);

  const persistComments = (updatedComments: CommentType[]) => {
    setComments(updatedComments);
    localStorage.setItem(storageKey, JSON.stringify(updatedComments));
  }
  
  const handlePostComment = (text: string, parentComment?: CommentType) => {
    if (!text.trim() || !user) return;

    const newComment: CommentType = {
      id: Date.now().toString(),
      animeId: anime.id,
      user: user,
      text: text.trim(),
      timestamp: Date.now(),
      parentId: parentComment?.id,
      replyingTo: parentComment?.user.username,
      animeTitle: anime.title,
      animeThumbnail: anime.thumbnail,
      animeBanner: anime.bannerImage,
      episodeIdentifier: commentScope === 'episode' && currentEpisode ? currentEpisodeIdentifier : undefined,
      likes: 0,
    };
    
    persistComments([newComment, ...comments]);
    addAniTokens(600); // Earn tokens for commenting
    
    if(parentComment && parentComment.user.username !== user.username) {
        addNotification({
            type: 'reply',
            text: `replied to your comment on ${anime.title}.`,
            relatedUser: user,
            animeId: anime.id,
            commentId: parentComment.id,
        }, parentComment.user.username);
    }

    if(replyingTo) {
        setReplyingTo(null);
    }
  };

  const handleLikeComment = (commentId: string) => {
      if (!isLoggedIn) return;
      const updatedComments = comments.map(c => 
          c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
      );
      persistComments(updatedComments);
  }
  
  const { topLevelComments, repliesMap } = useMemo(() => {
    const filteredComments = commentScope === 'episode' && currentEpisode
        ? comments.filter(c => c.episodeIdentifier === currentEpisodeIdentifier || (!c.episodeIdentifier && currentEpisodeIdentifier === 's1e1')) // Show general comments on Ep1
        : comments;

    const topLevel: CommentType[] = [];
    const replies = new Map<string, CommentType[]>();

    for (const comment of filteredComments) {
        if (comment.parentId) {
            if (!replies.has(comment.parentId)) {
                replies.set(comment.parentId, []);
            }
            replies.get(comment.parentId)!.push(comment);
        } else {
            topLevel.push(comment);
        }
    }

    // Sort top-level comments
    if (sortOrder === 'newest') topLevel.sort((a,b) => b.timestamp - a.timestamp);
    else if (sortOrder === 'oldest') topLevel.sort((a,b) => a.timestamp - b.timestamp);
    else if (sortOrder === 'top') topLevel.sort((a,b) => (b.likes || 0) - (a.likes || 0));
    
    // Sort replies by oldest first
    replies.forEach(replyList => replyList.sort((a,b) => a.timestamp - b.timestamp));
    
    return { topLevelComments: topLevel, repliesMap: replies };
  }, [comments, commentScope, currentEpisodeIdentifier, currentEpisode, sortOrder]);


  const renderComment = (comment: CommentType) => {
    const commentReplies = repliesMap.get(comment.id) || [];
    const friendAdded = isFriend(comment.user.username);
    
    return (
        <div key={comment.id} className="flex items-start space-x-3">
            <button onClick={() => onUserSelect(comment.user)} className="flex-shrink-0 transition-transform hover:scale-110">
                <img src={comment.user.avatar} alt={comment.user.username} className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))/0.3] mt-1" />
            </button>
            <div className="flex-1">
                <div className="bg-[rgb(var(--surface-3))/0.5] rounded-[2rem] rounded-tl-xl p-4">
                    <div className="flex items-baseline space-x-2">
                        <button onClick={() => onUserSelect(comment.user)} className="font-semibold text-[rgb(var(--color-primary-accent))] hover:underline">{comment.user.username}</button>
                        <p className="text-xs text-[rgb(var(--text-muted))]">{formatRelativeTime(comment.timestamp)}</p>
                    </div>
                    <p className="text-[rgb(var(--text-secondary))] mt-1 whitespace-pre-wrap">
                        {comment.replyingTo && <span className="text-[rgb(var(--color-primary-accent))] font-semibold">@{comment.replyingTo} </span>}
                        {comment.text}
                    </p>
                </div>
                {isLoggedIn && (
                    <div className="flex items-center gap-4 mt-2 pl-2">
                         <button onClick={() => handleLikeComment(comment.id)} className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                            <ThumbsUpIcon className="w-4 h-4" /> <span>{comment.likes || 0}</span>
                        </button>
                        {user?.username !== comment.user.username && (
                        <>
                            <button onClick={() => setReplyingTo(comment.id)} className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                                Reply
                            </button>
                            <button onClick={() => addFriend(comment.user)} disabled={friendAdded} className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] disabled:text-[rgb(var(--color-secondary-accent))] disabled:cursor-not-allowed">
                                {friendAdded ? <><CheckIcon/> Friend</> : <><UserPlusIcon/> Add Friend</>}
                            </button>
                        </>
                        )}
                    </div>
                )}
                {replyingTo === comment.id && (
                    <div className="mt-2">
                        <CommentForm 
                            onSubmit={(text) => handlePostComment(text, comment)}
                            cta="Post Reply"
                            placeholder={`Replying to ${comment.user.username}...`}
                            onCancel={() => setReplyingTo(null)}
                            autoFocus={true}
                        />
                    </div>
                )}
                <div className="space-y-4 mt-4">
                    {commentReplies.map(renderComment)}
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="mt-12">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Comments</h3>
        <div className="flex items-center gap-2">
            {currentEpisode && (
            <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                <button onClick={() => setCommentScope('episode')} className={`px-4 py-1.5 text-sm rounded-full transition-all ${commentScope === 'episode' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Episode</button>
                <button onClick={() => setCommentScope('all')} className={`px-4 py-1.5 text-sm rounded-full transition-all ${commentScope === 'all' ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>All</button>
            </div>
            )}
            <div className="flex items-center bg-[rgb(var(--surface-3))] rounded-full p-1">
                {(['newest', 'oldest', 'top'] as SortOrder[]).map(sort => (
                    <button key={sort} onClick={() => setSortOrder(sort)} className={`px-3 py-1.5 text-sm rounded-full capitalize transition-all ${sortOrder === sort ? 'bg-[rgb(var(--surface-1))] text-[rgb(var(--text-primary))] font-semibold shadow-md' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>{sort}</button>
                ))}
            </div>
        </div>
      </div>
      <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl rounded-[2rem] p-6">
        {isLoggedIn && user ? (
          <div className="mb-6 flex items-start space-x-3">
            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))/0.3] flex-shrink-0" />
            <div className="flex-1">
                <CommentForm onSubmit={(text) => handlePostComment(text)} cta="Post Comment" placeholder="Add a comment..." />
            </div>
          </div>
        ) : (
          <p className="text-center text-[rgb(var(--text-muted))] mb-6">Please log in to post a comment.</p>
        )}
        <div className="space-y-6">
          {topLevelComments.length > 0 ? topLevelComments.map(comment => renderComment(comment)) : (
            <p className="text-center text-gray-500">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;