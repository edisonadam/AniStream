import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { CommunityPost, CommunityUser, Club, User, Anime } from '../types';
import { formatRelativeTime } from '../utils';
import { SearchIcon } from './icons/Icons';
import ClubsPage from './ClubsPage';
import CreateClubModal from './CreateClubModal';
import RecentCommentsCarousel from './RecentComments';
import { useProfileData } from '../hooks/useProfileData';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const COMMUNITY_POSTS_KEY = 'anistream-community-posts';

interface CommunityPageProps {
  onLoginClick: () => void;
  onClubSelect: (club: Club) => void;
  onUserSelect: (user: User) => void;
  onAnimeSelect: (anime: Anime) => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ onLoginClick, onClubSelect, onUserSelect, onAnimeSelect }) => {
    const { user, isLoggedIn } = useAuth();
    const { isUserBlocked } = useProfileData();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [users, setUsers] = useState<CommunityUser[]>([]);
    const [postText, setPostText] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'feed' | 'clubs'>('feed');
    const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);
    
    const [userCreatedClubs, setUserCreatedClubs] = useState<Club[]>([]);

    useEffect(() => {
        try {
            const storedPosts = localStorage.getItem(COMMUNITY_POSTS_KEY);
            const storedUserClubs = localStorage.getItem('anistream-user-clubs');
            if (storedPosts) setPosts(JSON.parse(storedPosts).sort((a:CommunityPost, b:CommunityPost) => b.timestamp - a.timestamp));
            if (storedUserClubs) setUserCreatedClubs(JSON.parse(storedUserClubs));

            // Fetch users from Firebase
            const usersRef = ref(db, 'users');
            const unsubscribe = onValue(usersRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const usersList: CommunityUser[] = Object.values(data);
                    setUsers(usersList);
                }
            });
            return () => unsubscribe();

        } catch (e) {
            console.error('Failed to load community data', e);
        }
    }, []);

    const handlePost = () => {
        if (!postText.trim() || !user) return;
        const newPost: CommunityPost = {
            id: Date.now().toString(),
            user: { uid: user.uid, username: user.username, avatar: user.avatar },
            text: postText.trim(),
            timestamp: Date.now(),
        };
        const updatedPosts = [newPost, ...posts];
        setPosts(updatedPosts);
        localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(updatedPosts));
        setPostText('');
    };
    
    const handleClubCreated = (newClub: Club) => {
        const updatedClubs = [...userCreatedClubs, newClub];
        setUserCreatedClubs(updatedClubs);
        localStorage.setItem('anistream-user-clubs', JSON.stringify(updatedClubs));
        onClubSelect(newClub);
    };

    const filteredUsers = useMemo(() => {
        if (!userSearchQuery.trim()) return [];
        return users.filter(u => u.username.toLowerCase().includes(userSearchQuery.toLowerCase()));
    }, [userSearchQuery, users]);

    if (!isLoggedIn) {
        return (
            <div className="container mx-auto text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Join the Community</h2>
                <p className="text-[rgb(var(--text-muted))] mb-6">You need to be logged in to view posts and interact with other users.</p>
                <button onClick={onLoginClick} className="px-6 py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-transform duration-300 hover:scale-105">
                    Log In or Sign Up
                </button>
            </div>
        );
    }
    
    const FeedContent = () => (
        <div>
            <div className="mb-8">
                <RecentCommentsCarousel onAnimeSelect={onAnimeSelect} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-[rgb(var(--surface-2))/0.6] p-4 rounded-2xl">
                        <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="What's on your mind?" className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-xl p-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]" rows={3} />
                        <div className="text-right mt-2"><button onClick={handlePost} className="px-5 py-2 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Post</button></div>
                    </div>
                    {posts.filter(post => !isUserBlocked(post.user.uid)).map(post => (
                        <div key={post.id} className="bg-[rgb(var(--surface-2))/0.6] p-4 rounded-2xl flex items-start gap-4">
                            <button onClick={() => onUserSelect(post.user as User)} className="flex-shrink-0 transition-transform hover:scale-110"><img loading="lazy" src={post.user.avatar} alt={post.user.username} className="w-12 h-12 rounded-full" /></button>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <button onClick={() => onUserSelect(post.user as User)} className="font-bold text-[rgb(var(--color-primary-accent))] hover:underline">{post.user.username}</button>
                                    <p className="text-xs text-[rgb(var(--text-muted))]">{formatRelativeTime(post.timestamp)}</p>
                                </div>
                                <p className="text-[rgb(var(--text-secondary))] whitespace-pre-wrap mt-1">{post.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-[rgb(var(--surface-2))/0.6] p-4 rounded-2xl">
                        <h3 className="text-xl font-bold mb-4">Find Users</h3>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon /></div>
                            <input type="text" value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Search for users..." className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-[rgb(var(--text-primary))]" />
                        </div>
                        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                            {filteredUsers.map(u => (
                                <div key={u.uid} className="flex items-center gap-3 p-2 rounded-lg bg-[rgb(var(--surface-3))]">
                                    <img loading="lazy" src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full" />
                                    <p className="font-semibold text-[rgb(var(--text-secondary))]">{u.username}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            {isCreateClubModalOpen && <CreateClubModal onClose={() => setIsCreateClubModalOpen(false)} onClubCreated={handleClubCreated} />}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
                <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-8" style={{ textShadow: `0 0 8px rgb(var(--shadow-color) / 0.5)` }}>
                    Community Hub
                </h1>
                <div className="border-b border-white/10 mb-6">
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'feed' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Feed</button>
                        <button onClick={() => setActiveTab('clubs')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'clubs' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'}`}>Clubs</button>
                    </div>
                </div>
                <div key={activeTab} className="animate-cinematic-fade-in">
                    {activeTab === 'feed' ? <FeedContent /> : (
                        <ClubsPage 
                            onClubSelect={onClubSelect} 
                            isTabbed={true}
                            onCreateClub={() => setIsCreateClubModalOpen(true)}
                            userCreatedClubs={userCreatedClubs}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default CommunityPage;