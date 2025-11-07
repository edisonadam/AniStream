import React, { useEffect } from 'react';
import { useShortcuts } from '../hooks/useShortcuts';
import { CloseIcon } from './icons/Icons';

interface ShortcutsHelpModalProps {
    onClose: () => void;
}

const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ onClose }) => {
    const { shortcuts } = useShortcuts();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <div 
                className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-md m-4 p-6 relative animate-subtle-fade-in-up" 
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                    <CloseIcon />
                </button>
                <h2 className="text-2xl font-bold text-center mb-6 text-[rgb(var(--text-primary))]">Keyboard Shortcuts</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 max-h-[60vh] overflow-y-auto">
                    {Object.entries(shortcuts).map(([action, keys]) => (
                        <React.Fragment key={action}>
                            <div className="text-right font-semibold text-[rgb(var(--text-secondary))] capitalize">{action.replace(/([A-Z])/g, " $1")}</div>
                            <div className="flex gap-2">
                                {(keys as string[]).map(key => (
                                    <kbd key={key} className="px-2 py-0.5 text-sm font-mono font-semibold text-[rgb(var(--color-primary-accent))] bg-[rgb(var(--surface-3))] border border-[rgb(var(--border-color))] rounded-md">{key}</kbd>
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShortcutsHelpModal;