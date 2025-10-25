
import { useContext } from 'react';
import { ProfileDataContext } from '../contexts/ProfileDataContext';

export const useProfileData = () => {
  const context = useContext(ProfileDataContext);
  if (context === undefined) {
    throw new Error('useProfileData must be used within a ProfileDataProvider');
  }
  return context;
};
