import React from 'react';
import { CloseIcon } from './icons/Icons';

const DeveloperInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center animate-cinematic-fade-in p-4" onClick={onClose}>
            <div className="bg-[rgb(var(--surface-2))/0.9] backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md p-6 relative animate-modal-pop-in" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <h2 className="text-2xl font-bold text-center mb-4 text-[rgb(var(--color-primary-accent))]">Developer Identity</h2>
                <p className="text-center text-lg text-[rgb(var(--text-secondary))]">
                    I am a world-class senior frontend engineer with deep expertise in Gemini API and UI/UX design.
                </p>
            </div>
        </div>
    );
};

export default DeveloperInfoModal;