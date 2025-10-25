
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Cookie Helper Functions ---
function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Base64 encode the value to safely store the JSON string in a cookie
  const encodedValue = btoa(value);
  document.cookie = name + "=" + (encodedValue || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length);
      try {
        // Decode the Base64 value before returning
        return atob(value);
      } catch (e) {
        console.error("Failed to decode cookie value:", e);
        return null;
      }
    }
  }
  return null;
}

function eraseCookie(name: string) {
  document.cookie = name + '=; Max-Age=-99999999; path=/;';
}
// --- End Cookie Helper Functions ---

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      let storedUserString = localStorage.getItem('ani-stream-user');

      if (!storedUserString) {
        const cookieUserString = getCookie('ani-stream-user');
        if (cookieUserString) {
          storedUserString = cookieUserString;
          localStorage.setItem('ani-stream-user', storedUserString);
        }
      }

      if (storedUserString) {
        setUser(JSON.parse(storedUserString));
      }
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      localStorage.removeItem('ani-stream-user');
      eraseCookie('ani-stream-user');
    }
  }, []);

  const persistUser = (userToSave: User | null) => {
    if (userToSave) {
        const userString = JSON.stringify(userToSave);
        localStorage.setItem('ani-stream-user', userString);
        setCookie('ani-stream-user', userString, 365);
    } else {
        localStorage.removeItem('ani-stream-user');
        eraseCookie('ani-stream-user');
    }
    setUser(userToSave);
  }

  const login = (username: string) => {
    const newUser: User = { username, avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${username}` };
    persistUser(newUser);
  };

  const logout = () => {
    persistUser(null);
  };
  
  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
        const newUser = { ...user, ...updatedUser };
        persistUser(newUser);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
