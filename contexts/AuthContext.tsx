
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, updateProfile, type User as FirebaseUser } from 'firebase/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  updateUser: (updates: { username: string; avatar: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VERIFIED_USERS = ['Admin'];

export const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser): User => {
    const username = firebaseUser.displayName || 'Anonymous User';
    return {
        uid: firebaseUser.uid,
        username: username,
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${firebaseUser.uid}`,
        email: firebaseUser.email,
        joinedDate: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
        isVerified: VERIFIED_USERS.includes(username),
    };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(mapFirebaseUserToAppUser(fbUser));
        setFirebaseUser(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  const updateUser = async (updates: { username: string; avatar: string }) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
            displayName: updates.username,
            photoURL: updates.avatar
        });
        // Manually update state to reflect changes immediately as onAuthStateChanged might not fire for profile updates.
        setUser(mapFirebaseUserToAppUser(auth.currentUser));
        setFirebaseUser(auth.currentUser);
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoggedIn: !!user,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
