
import React, { useState, useEffect, useMemo } from 'react';
import type { Comment as CommentType, Anime } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { MessageCircleIcon, UserPlusIcon, CheckIcon } from './icons/Icons';

interface CommentsProps {
  anime: Anime;
}

const CommentForm: React.FC<{
  onSubmit: (text: string) => void;
  cta: string;
  placeholder: string;
  onCancel?: () => void;
}> = ({ onSubmit, cta, placeholder, onCancel }) => {
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
        className="w-full bg-[rgb(var(--surface-input))/0.6] border border-[rgb(var(--border-color))] rounded-lg p-3 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all"
        rows={2}
        autoFocus
      ></textarea>
      <div className="flex justify-end items-center gap-2 mt-2">
        {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-1.5 bg-[rgb(var(--surface-4))] text-[rgb(var(--text-secondary))] rounded-lg font-semibold hover:bg-[rgb(var(--surface-3))] transition-colors text-sm">
                Cancel
            </button>
        )}
        <button type="submit" className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors text-sm">
            {cta}
        </button>
      </div>
    </form>
  )
}

const Comments: React.FC<CommentsProps> = ({ anime }) => {
  const { isLoggedIn, user } = useAuth();
  const { addFriend, isFriend, addNotification } = useProfileData();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Store parent comment ID
  
  const storageKey = `comments_${anime.id}`;

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
  
  const handlePostComment = (text: string, parentComment?: CommentType) => {
    if (!text.trim() || !user) return;

    const newComment: CommentType = {
      id: Date.now().toString(),
      animeId: anime.id,
      user,
      text: text.trim(),
      timestamp: Date.now(),
      parentId: parentComment?.id,
      replyingTo: parentComment?.user.username
    };
    
    const updatedComments = [newComment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(storageKey, JSON.stringify(updatedComments));
    
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
  
  const { topLevelComments, repliesMap } = useMemo(() => {
    const topLevel: CommentType[] = [];
    const replies = new Map<string, CommentType[]>();

    for (const comment of comments) {
        if (comment.parentId) {
            if (!replies.has(comment.parentId)) {
                replies.set(comment.parentId, []);
            }
            replies.get(comment.parentId)!.push(comment);
        } else {
            topLevel.push(comment);
        }
    }

    // Sort top-level comments by newest first
    topLevel.sort((a,b) => b.timestamp - a.timestamp);
    // Sort replies by oldest first
    replies.forEach(replyList => replyList.sort((a,b) => a.timestamp - b.timestamp));
    
    return { topLevelComments: topLevel, repliesMap: replies };
  }, [comments]);


  const renderComment = (comment: CommentType) => {
    const commentReplies = repliesMap.get(comment.id) || [];
    const friendAdded = isFriend(comment.user.username);
    
    return (
        <div key={comment.id} className="flex items-start space-x-4">
            <img src={comment.user.avatar} alt={comment.user.username} className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))/0.3]" />
            <div className="flex-1">
                <div className="bg-[rgb(var(--surface-3))/0.4] rounded-lg p-3">
                    <div className="flex items-baseline space-x-2">
                        <p className="font-semibold text-[rgb(var(--color-primary-accent))]">{comment.user.username}</p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">{new Date(comment.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-[rgb(var(--text-secondary))] mt-1 whitespace-pre-wrap">
                        {comment.replyingTo && <span className="text-[rgb(var(--color-primary-accent))] font-semibold">@{comment.replyingTo} </span>}
                        {comment.text}
                    </p>
                </div>
                {isLoggedIn && user?.username !== comment.user.username && (
                    <div className="flex items-center gap-4 mt-2 pl-1">
                        <button onClick={() => setReplyingTo(comment.id)} className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                            <MessageCircleIcon /> Reply
                        </button>
                        <button onClick={() => addFriend(comment.user)} disabled={friendAdded} className="flex items-center gap-1 text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] disabled:text-[rgb(var(--color-secondary-accent))] disabled:cursor-not-allowed">
                            {friendAdded ? <><CheckIcon/> Friend</> : <><UserPlusIcon/> Add Friend</>}
                        </button>
                    </div>
                )}
                {replyingTo === comment.id && (
                    <div className="mt-2">
                        <CommentForm 
                            onSubmit={(text) => handlePostComment(text, comment)}
                            cta="Post Reply"
                            placeholder={`Replying to ${comment.user.username}...`}
                            onCancel={() => setReplyingTo(null)}
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
      <h3 className="text-2xl font-bold mb-4 text-[rgb(var(--text-primary))]">Comments</h3>
      <div className="bg-[rgb(var(--surface-2))/0.5] rounded-2xl p-6">
        {isLoggedIn && user ? (
          <div className="mb-6 flex items-start space-x-4">
            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))/0.3]" />
            <div className="flex-1">
                <CommentForm onSubmit={(text) => handlePostComment(text)} cta="Post Comment" placeholder="Add a comment..." />
            </div>
          </div>
        ) : (
          <p className="text-center text-[rgb(var(--text-muted))] mb-6">Please log in to post a comment.</p>
        )}
        <div className="space-y-4">
          {comments.length > 0 ? topLevelComments.map(comment => renderComment(comment)) : (
            <p className="text-center text-gray-500">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;