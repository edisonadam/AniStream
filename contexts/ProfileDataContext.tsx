import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Rating, Anime, User, Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ProfileDataContextType {
  ratings: Rating[];
  friends: User[];
  notifications: Notification[];
  aniTokens: number;
  blockedUsers: string[];
  rateAnime: (animeId: number, rating: number) => void;
  getRating: (animeId: number) => number | null;
  addFriend: (friend: User) => boolean;
  removeFriend: (username: string) => void;
  isFriend: (username: string) => boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, targetUsername?: string) => void;
  markNotificationsAsRead: () => void;
  markSingleNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addAniTokens: (amount: number) => void;
  spendAniTokens: (amount: number) => boolean;
  blockUser: (userToBlock: User) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
}


export const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);

interface ProfileDataProviderProps {
  children: ReactNode;
}

export const ProfileDataProvider: React.FC<ProfileDataProviderProps> = ({ children }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aniTokens, setAniTokens] = useState<number>(0);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const { user } = useAuth();

  const isUserBlocked = useCallback((userId: string) => {
    return blockedUsers.includes(userId);
  }, [blockedUsers]);

  const persistNotifications = useCallback((list: Notification[], userId: string) => {
      localStorage.setItem(`notifications-${userId}`, JSON.stringify(list));
  }, []);

  useEffect(() => {
    if (user) {
      try {
        const storedRatings = localStorage.getItem(`ratings-${user.uid}`);
        setRatings(storedRatings ? JSON.parse(storedRatings) : []);
        
        const storedFriends = localStorage.getItem(`friends-${user.uid}`);
        setFriends(storedFriends ? JSON.parse(storedFriends) : []);

        const storedBlockedUsers = localStorage.getItem(`blocked-users-${user.uid}`);
        setBlockedUsers(storedBlockedUsers ? JSON.parse(storedBlockedUsers) : []);

        const storedNotifications = localStorage.getItem(`notifications-${user.uid}`);
        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications));
        } else {
          // Add mock notifications for new users
          const mockNotifications: Notification[] = [
              { id: '1', type: 'system', text: 'Welcome to ANISTREAM! Explore and enjoy.', timestamp: Date.now() - 10000, read: false },
              { id: '2', type: 'watchlist', text: 'You added "Jujutsu Kaisen" to your watchlist.', timestamp: Date.now() - 60000, read: false, animeId: 40748, animeTitle: 'Jujutsu Kaisen' },
              { id: '3', type: 'favorites', text: 'You favorited "Solo Leveling".', timestamp: Date.now() - 120000, read: true, animeId: 52299, animeTitle: 'Solo Leveling' },
              { id: '4', type: 'mal_sync', text: 'MyAnimeList sync was successful.', timestamp: Date.now() - 300000, read: true },
              { id: '5', type: 'general', text: 'A new episode of "Frieren: Beyond Journey\'s End" is out!', timestamp: Date.now() - 600000, read: true, animeId: 52991, animeTitle: 'Frieren: Beyond Journey\'s End' }
          ];
          setNotifications(mockNotifications);
          persistNotifications(mockNotifications, user.uid);
        }

        const storedTokens = localStorage.getItem(`aniTokens-${user.uid}`);
        setAniTokens(storedTokens ? parseInt(storedTokens, 10) : 100000); // Start with 100k tokens

      } catch (e) {
        console.error("Failed to load profile data", e);
        setRatings([]);
        setFriends([]);
        setNotifications([]);
        setAniTokens(0);
        setBlockedUsers([]);
      }
    } else {
      // Clear data on logout
      setRatings([]);
      setFriends([]);
      setNotifications([]);
      setAniTokens(0);
      setBlockedUsers([]);
    }
  }, [user, persistNotifications]);

  const persistRatings = useCallback((list: Rating[]) => {
    if (user) localStorage.setItem(`ratings-${user.uid}`, JSON.stringify(list));
  }, [user]);

  const persistFriends = useCallback((list: User[]) => {
      if (user) localStorage.setItem(`friends-${user.uid}`, JSON.stringify(list));
  }, [user]);
  
  const persistTokens = useCallback((tokens: number) => {
      if (user) localStorage.setItem(`aniTokens-${user.uid}`, tokens.toString());
  }, [user]);

  const persistBlockedUsers = useCallback((list: string[]) => {
    if (user) localStorage.setItem(`blocked-users-${user.uid}`, JSON.stringify(list));
  }, [user]);

  const addAniTokens = useCallback((amount: number) => {
      if (!user) return;
      setAniTokens(prev => {
          const newTotal = prev + amount;
          persistTokens(newTotal);
          return newTotal;
      });
  }, [user, persistTokens]);

  const spendAniTokens = useCallback((amount: number) => {
      if (!user || aniTokens < amount) return false;
      setAniTokens(prev => {
          const newTotal = prev - amount;
          persistTokens(newTotal);
          return newTotal;
      });
      return true;
  }, [user, aniTokens, persistTokens]);


  const rateAnime = useCallback((animeId: number, rating: number) => {
    if (!user) return;
    setRatings(prev => {
      const newList = prev.filter(item => item.animeId !== animeId);
      const newItem: Rating = { animeId, rating };
      const updatedList = [newItem, ...newList];
      persistRatings(updatedList);
      return updatedList;
    });
  }, [user, persistRatings]);

  const getRating = useCallback((animeId: number) => {
    const found = ratings.find(r => r.animeId === animeId);
    return found ? found.rating : null;
  }, [ratings]);

  const addFriend = useCallback((friend: User): boolean => {
    if (!user || user.username === friend.username) return false;
    let success = false;
    setFriends(prev => {
        if (prev.some(f => f.username === friend.username)) {
            return prev;
        }
        const newList = [...prev, friend];
        persistFriends(newList);
        success = true;
        return newList;
    });
    return success;
  }, [user, persistFriends]);

  const removeFriend = useCallback((username: string) => {
      setFriends(prev => {
          const newList = prev.filter(f => f.username !== username);
          persistFriends(newList);
          return newList;
      });
  }, [persistFriends]);

  const isFriend = useCallback((username: string) => {
      return friends.some(f => f.username === username);
  }, [friends]);
  
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>, targetUsername?: string) => {
    const sourceUserId = notificationData.relatedUser?.uid;
    if (sourceUserId && isUserBlocked(sourceUserId)) {
        return; // Don't add notification from a user you've blocked.
    }

    const targetUser = friends.find(f => f.username === targetUsername) || user;
    if (!targetUser) return;

    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      read: false,
    };
    
    if (targetUser.uid === user?.uid) {
        setNotifications(prev => {
            const newList = [newNotification, ...prev].slice(0, 50);
            persistNotifications(newList, targetUser.uid);
            return newList;
        });
        
        // Send push notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ANISTREAM', {
                body: `${notificationData.relatedUser?.username || 'System'} ${notificationData.text}`,
                icon: notificationData.relatedUser?.avatar || '/vite.svg'
            });
        }
    } else {
        // This is for notifying another user, a simulation for a client-side app
        try {
            const storageKey = `notifications-${targetUser.uid}`;
            const existing = localStorage.getItem(storageKey);
            const currentList: Notification[] = existing ? JSON.parse(existing) : [];
            const newList = [newNotification, ...currentList].slice(0, 50);
            localStorage.setItem(storageKey, JSON.stringify(newList));
        } catch (e) {
            console.error("Could not add notification for other user", e);
        }
    }
  }, [user, friends, persistNotifications, isUserBlocked]);
  
  const markNotificationsAsRead = useCallback(() => {
    if (!user) return;
    setNotifications(prev => {
        const newList = prev.map(n => ({ ...n, read: true }));
        persistNotifications(newList, user.uid);
        return newList;
    });
  }, [user, persistNotifications]);

  const markSingleNotificationAsRead = useCallback((notificationId: string) => {
    if (!user) return;
    setNotifications(prev => {
        const newList = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
        persistNotifications(newList, user.uid);
        return newList;
    });
  }, [user, persistNotifications]);

  const clearAllNotifications = useCallback(() => {
    if (!user) return;
    setNotifications([]);
    persistNotifications([], user.uid);
  }, [user, persistNotifications]);

  const blockUser = useCallback((userToBlock: User) => {
    setBlockedUsers(prev => {
        if (prev.includes(userToBlock.uid)) return prev;
        const newList = [...prev, userToBlock.uid];
        persistBlockedUsers(newList);
        return newList;
    });
  }, [persistBlockedUsers]);

  const unblockUser = useCallback((userId: string) => {
    setBlockedUsers(prev => {
        const newList = prev.filter(id => id !== userId);
        persistBlockedUsers(newList);
        return newList;
    });
  }, [persistBlockedUsers]);


  const value = { 
    ratings, friends, notifications, aniTokens, blockedUsers,
    rateAnime, getRating,
    addFriend, removeFriend, isFriend, 
    addNotification, markNotificationsAsRead, markSingleNotificationAsRead, clearAllNotifications,
    addAniTokens, spendAniTokens,
    blockUser, unblockUser, isUserBlocked,
  };

  return (
    <ProfileDataContext.Provider value={value}>
      {children}
    </ProfileDataContext.Provider>
  );
};