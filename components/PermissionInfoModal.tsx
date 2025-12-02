
import React, { useState, useEffect } from 'react';
import { VideoCameraIcon, MicrophoneIcon, ShieldCheckIcon } from './icons/Icons';

const PERMISSION_INFO_KEY = 'anistream-permission-info-seen';

const PermissionInfoModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem(PERMISSION_INFO_KEY);
        if (!hasSeen) {
            // Small delay to ensure smooth initial render
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(PERMISSION_INFO_KEY, 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-cinematic-fade-in p-4">
            <div className="bg-[rgb(var(--surface-2))/0.95] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative flex flex-col items-center text-center animate-modal-pop-in">
                <div className="w-16 h-16 bg-[rgb(var(--color-primary))/0.2] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgb(var(--color-primary)/0.3)]">
                    <ShieldCheckIcon className="w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                </div>
                
                <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-4">Permission Notice</h2>
                
                <p className="text-[rgb(var(--text-secondary))] mb-6 leading-relaxed text-sm">
                    Welcome to ANISTREAM! We request access to your <strong>Camera</strong> and <strong>Microphone</strong> solely for the <strong>Watch Together</strong> feature.
                </p>

                <div className="flex justify-center gap-6 mb-8 w-full">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-[rgb(var(--surface-3))] rounded-xl border border-white/5">
                            <VideoCameraIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <span className="text-xs font-semibold text-[rgb(var(--text-muted))]">Video Chat</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-[rgb(var(--surface-3))] rounded-xl border border-white/5">
                            <MicrophoneIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-[rgb(var(--text-muted))]">Voice Chat</span>
                    </div>
                </div>

                <p className="text-xs text-[rgb(var(--text-muted))] mb-6 bg-[rgb(var(--surface-3))/0.5] p-3 rounded-xl border border-white/5">
                    We respect your privacy. These devices are <strong>never</strong> accessed outside of active Watch Together rooms. You can manage these permissions in your browser settings at any time.
                </p>

                <button 
                    onClick={handleClose}
                    className="w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold hover:bg-[rgb(var(--color-primary-hover))] transition-transform active:scale-95 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]"
                >
                    Understood
                </button>
            </div>
        </div>
    );
};

export default PermissionInfoModal;
