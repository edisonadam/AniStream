import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string) => void;
  logout: () => void;
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
      // Prioritize localStorage as it's standard for this use case
      let storedUserString = localStorage.getItem('ani-stream-user');

      // Fallback to cookies if localStorage is empty
      if (!storedUserString) {
        const cookieUserString = getCookie('ani-stream-user');
        if (cookieUserString) {
          storedUserString = cookieUserString;
          // Sync cookie data back to localStorage for consistency
          localStorage.setItem('ani-stream-user', storedUserString);
        }
      }

      if (storedUserString) {
        setUser(JSON.parse(storedUserString));
      }
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      // Clear both on error to prevent a corrupted state
      localStorage.removeItem('ani-stream-user');
      eraseCookie('ani-stream-user');
    }
  }, []);

  const login = (username: string) => {
    const newUser: User = { username, avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${username}` };
    const userString = JSON.stringify(newUser);
    
    // Save to both localStorage and cookies for robust persistence
    localStorage.setItem('ani-stream-user', userString);
    setCookie('ani-stream-user', userString, 365); // Set cookie for 1 year
    
    setUser(newUser);
  };

  const logout = () => {
    // Clear from both localStorage and cookies
    localStorage.removeItem('ani-stream-user');
    eraseCookie('ani-stream-user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
