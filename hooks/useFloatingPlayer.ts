import { useContext } from 'react';
import { FloatingPlayerContext } from '../contexts/FloatingPlayerContext';

export const useFloatingPlayer = () => {
    const context = useContext(FloatingPlayerContext);
    if (context === undefined) {
        throw new Error('useFloatingPlayer must be used within a FloatingPlayerProvider');
    }
    return context;
};