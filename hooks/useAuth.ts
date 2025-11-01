import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // The context no longer provides 'loading', so we don't return it.
  const { user, firebaseUser, isLoggedIn, logout, updateUser } = context;
  return { user, firebaseUser, isLoggedIn, logout, updateUser };
};
