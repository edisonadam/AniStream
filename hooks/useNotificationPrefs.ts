import { useContext } from 'react';
import { NotificationPrefsContext } from '../contexts/NotificationPrefsContext';

export const useNotificationPrefs = () => {
  const context = useContext(NotificationPrefsContext);
  if (context === undefined) {
    throw new Error('useNotificationPrefs must be used within a NotificationPrefsProvider');
  }
  return context;
};