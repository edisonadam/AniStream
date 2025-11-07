import React from 'react';
import { CloseIcon, SparklesIcon } from './icons/Icons';

interface UpdatesModalProps {
  onClose: () => void;
}

const updates = [
    "✨ Brand New Anime Details Page: Dive deeper into your favorite shows with a comprehensive page for every anime.",
    "🤫 Spoiler Protection: You can now mark comments as spoilers, and they'll be hidden until clicked.",
    "🎨 UI Enhancements: Anime cards now show a status dot (🔵 Ongoing / 🟢 Completed).",
    "📚 Manga & Magazines Merged: Find all your reading material in one convenient, tabbed section.",
    "⬆️ Submit Subtitles: Contribute to the community by submitting your own fan-made subtitles directly from the player.",
];

const UpdatesModal: React.FC<UpdatesModalProps> = ({ onClose }) => {
    
    const handleClose = () => {
        sessionStorage.setItem('anistream-updates-seen-1.2.0', 'true');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center animate-cinematic-fade-in p-4" onClick={handleClose}>
            <div 
                className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-lg m-4 p-6 relative animate-subtle-fade-in-up" 
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <SparklesIcon className="w-10 h-10 mx-auto text-[rgb(var(--color-primary-accent))]" />
                    <h2 className="text-2xl font-bold text-center mt-4 text-[rgb(var(--text-primary))]">What's New in ANISTREAM!</h2>
                    <p className="text-sm text-[rgb(var(--text-muted))]">Version 1.2.0</p>
                </div>
                
                <div className="space-y-3 text-[rgb(var(--text-secondary))] max-h-[50vh] overflow-y-auto pr-2">
                    {updates.map((update, index) => (
                        <p key={index}>{update}</p>
                    ))}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-2">
                     <button onClick={handleClose} className="w-full px-5 py-2.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20">
                        Don't show again this session
                    </button>
                    <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))]">
                        Awesome!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdatesModal;