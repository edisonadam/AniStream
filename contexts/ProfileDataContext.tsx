import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ViewingHistoryItem, Rating, Anime, User, Notification } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ProfileDataContextType {
  history: ViewingHistoryItem[];
  ratings: Rating[];
  friends: User[];
  notifications: Notification[];
  logToHistory: (anime: Anime) => void;
  rateAnime: (animeId: number, rating: number) => void;
  getRating: (animeId: number) => number | null;
  clearHistory: () => void;
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
  const [history, setHistory] = useState<ViewingHistoryItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        const storedHistory = localStorage.getItem(`history-${user.username}`);
        setHistory(storedHistory ? JSON.parse(storedHistory) : []);
        
        const storedRatings = localStorage.getItem(`ratings-${user.username}`);
        setRatings(storedRatings ? JSON.parse(storedRatings) : []);
        
        const storedFriends = localStorage.getItem(`friends-${user.username}`);
        setFriends(storedFriends ? JSON.parse(storedFriends) : []);

        const storedNotifications = localStorage.getItem(`notifications-${user.username}`);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);
      } catch (e) {
        console.error("Failed to load profile data", e);
        setHistory([]);
        setRatings([]);
        setFriends([]);
        setNotifications([]);
      }
    } else {
      // Clear data on logout
      setHistory([]);
      setRatings([]);
      setFriends([]);
      setNotifications([]);
    }
  }, [user]);

  const persistHistory = useCallback((list: ViewingHistoryItem[]) => {
    if (user) localStorage.setItem(`history-${user.username}`, JSON.stringify(list));
  }, [user]);

  const persistRatings = useCallback((list: Rating[]) => {
    if (user) localStorage.setItem(`ratings-${user.username}`, JSON.stringify(list));
  }, [user]);

  const persistFriends = useCallback((list: User[]) => {
      if (user) localStorage.setItem(`friends-${user.username}`, JSON.stringify(list));
  }, [user]);

  const persistNotifications = useCallback((list: Notification[], username: string) => {
      localStorage.setItem(`notifications-${username}`, JSON.stringify(list));
  }, []);
  
  const logToHistory = useCallback((anime: Anime) => {
    if (!user) return;
    setHistory(prev => {
      const newList = prev.filter(item => item.animeId !== anime.id);
      const newItem: ViewingHistoryItem = { animeId: anime.id, timestamp: Date.now() };
      const updatedList = [newItem, ...newList].slice(0, 50); // Keep history to 50 items
      persistHistory(updatedList);
      return updatedList;
    });
  }, [user, persistHistory]);
  
  const clearHistory = useCallback(() => {
      if (!user) return;
      setHistory([]);
      localStorage.removeItem(`history-${user.username}`);
  }, [user]);

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
    const target = targetUsername || user?.username;
    if (!target) return;

    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      read: false,
    };
    
    if (target === user?.username) {
        setNotifications(prev => {
            const newList = [newNotification, ...prev].slice(0, 50);
            persistNotifications(newList, target);
            return newList;
        });
    } else {
        // This is for notifying another user, a simulation for a client-side app
        try {
            const storageKey = `notifications-${target}`;
            const existing = localStorage.getItem(storageKey);
            const currentList: Notification[] = existing ? JSON.parse(existing) : [];
            const newList = [newNotification, ...currentList].slice(0, 50);
            localStorage.setItem(storageKey, JSON.stringify(newList));
        } catch (e) {
            console.error("Could not add notification for other user", e);
        }
    }
  }, [user, persistNotifications]);
  
  const markNotificationsAsRead = useCallback(() => {
    if (!user) return;
    setNotifications(prev => {
        const newList = prev.map(n => ({ ...n, read: true }));
        persistNotifications(newList, user.username);
        return newList;
    });
  }, [user, persistNotifications]);

  return (
    <ProfileDataContext.Provider value={{ 
        history, ratings, friends, notifications,
        logToHistory, rateAnime, getRating, clearHistory,
        addFriend, removeFriend, isFriend, 
        addNotification, markNotificationsAsRead 
    }}>
      {children}
    </ProfileDataContext.Provider>
  );
};