import { useContext } from 'react';
import { ShortcutsContext } from '../contexts/ShortcutsContext';

export const useShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
};