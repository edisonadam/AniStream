import React, { useState, useEffect } from 'react';
import type { Comment as CommentType, Anime } from '../types';
import { useAuth } from '../hooks/useAuth';

interface CommentsProps {
  anime: Anime;
}

const Comments: React.FC<CommentsProps> = ({ anime }) => {
  const { isLoggedIn, user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const storageKey = `comments_${anime.id}`;

  useEffect(() => {
    try {
      const storedComments = localStorage.getItem(storageKey);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [storageKey]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const comment: CommentType = {
      id: Date.now().toString(),
      animeId: anime.id,
      user,
      text: newComment.trim(),
      timestamp: Date.now(),
    };
    
    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(storageKey, JSON.stringify(updatedComments));
    setNewComment('');
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-4 text-white">Comments</h3>
      <div className="bg-slate-800/50 rounded-2xl p-6">
        {isLoggedIn && user ? (
          <form onSubmit={handlePostComment} className="mb-6">
            <div className="flex items-start space-x-4">
              <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full bg-purple-800" />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-slate-700/60 border border-slate-600 rounded-lg p-3 text-white focus:ring-purple-500 focus:border-purple-500 transition-all"
                  rows={3}
                ></textarea>
                <button type="submit" className="mt-2 px-4 py-2 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm">
                  Post Comment
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="text-center text-gray-400 mb-6">Please log in to post a comment.</p>
        )}
        <div className="space-y-4">
          {comments.length > 0 ? comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-4">
              <img src={comment.user.avatar} alt={comment.user.username} className="w-10 h-10 rounded-full bg-purple-800" />
              <div className="flex-1 bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-baseline space-x-2">
                  <p className="font-semibold text-purple-300">{comment.user.username}</p>
                  <p className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString()}</p>
                </div>
                <p className="text-gray-200 mt-1">{comment.text}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
