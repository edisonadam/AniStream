import { useContext } from 'react';
import { VoiceActorFavoritesContext } from '../contexts/VoiceActorFavoritesContext';

export const useVoiceActorFavorites = () => {
  const context = useContext(VoiceActorFavoritesContext);
  if (context === undefined) {
    throw new Error('useVoiceActorFavorites must be used within a VoiceActorFavoritesProvider');
  }
  return context;
};
