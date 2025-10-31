import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Rating, Anime, User, Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ProfileDataContextType {
  ratings: Rating[];
  friends: User[];
  notifications: Notification[];
  rateAnime: (animeId: number, rating: number) => void;
  getRating: (animeId: number) => number | null;
  addFriend: (friend: User) => boolean;
  removeFriend: (username: string) => void;
  isFriend: (username: string) => boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, targetUsername?: string) => void;
  markNotificationsAsRead: () => void;
}


export const ProfileDataContext = createContext<ProfileDataContextType | undefined>(undefined);

interface ProfileDataProviderProps {
  children: ReactNode;
}

export const ProfileDataProvider: React.FC<ProfileDataProviderProps> = ({ children }) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedRatings = localStorage.getItem(`ratings-${user.uid}`);
        setRatings(storedRatings ? JSON.parse(storedRatings) : []);
        
        const storedFriends = localStorage.getItem(`friends-${user.uid}`);
        setFriends(storedFriends ? JSON.parse(storedFriends) : []);

        const storedNotifications = localStorage.getItem(`notifications-${user.uid}`);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);
      } catch (e) {
        console.error("Failed to load profile data", e);
        setRatings([]);
        setFriends([]);
        setNotifications([]);
      }
    } else {
      // Clear data on logout
      setRatings([]);
      setFriends([]);
      setNotifications([]);
    }
  }, [user]);

  const persistRatings = useCallback((list: Rating[]) => {
    if (user) localStorage.setItem(`ratings-${user.uid}`, JSON.stringify(list));
  }, [user]);

  const persistFriends = useCallback((list: User[]) => {
      if (user) localStorage.setItem(`friends-${user.uid}`, JSON.stringify(list));
  }, [user]);

  const persistNotifications = useCallback((list: Notification[], userId: string) => {
      localStorage.setItem(`notifications-${userId}`, JSON.stringify(list));
  }, []);

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
  }, [user, friends, persistNotifications]);
  
  const markNotificationsAsRead = useCallback(() => {
    if (!user) return;
    setNotifications(prev => {
        const newList = prev.map(n => ({ ...n, read: true }));
        persistNotifications(newList, user.uid);
        return newList;
    });
  }, [user, persistNotifications]);

  return (
    <ProfileDataContext.Provider value={{ 
        ratings, friends, notifications,
        rateAnime, getRating,
        addFriend, removeFriend, isFriend, 
        addNotification, markNotificationsAsRead 
    }}>
      {children}
    </ProfileDataContext.Provider>
  );
};
