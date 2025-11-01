import React, { useState } from 'react';
import { CloseIcon, ScissorsIcon } from './icons/Icons';

interface ClippingModalProps {
    onClose: () => void;
    videoDuration: number;
}

const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(14, 5);

const ClippingModal: React.FC<ClippingModalProps> = ({ onClose, videoDuration }) => {
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('00:30');

    const handleDownload = () => {
        alert("Sorry, the clipping and download feature is currently under development and not yet available. Please check back later!");
    };

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex items-center justify-center animate-cinematic-fade-in" onClick={onClose}>
            <div className="bg-[rgb(var(--surface-2))/0.8] backdrop-blur-xl border border-white/10 rounded-3xl w-[90%] max-w-sm m-4 p-6 relative" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute top-3 right-3 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]"><CloseIcon /></button>
                <div className="text-center mb-4">
                    <ScissorsIcon className="mx-auto w-8 h-8 text-[rgb(var(--color-primary-accent))]" />
                    <h3 className="text-xl font-bold mt-2 text-[rgb(var(--text-primary))]">Create a Clip</h3>
                </div>
                <div className="flex justify-around items-center gap-4 my-6">
                    <div>
                        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">Start Time</label>
                        <input type="time" step="1" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-[rgb(var(--surface-input))] border border-white/10 rounded-lg p-2" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">End Time</label>
                        <input type="time" step="1" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-[rgb(var(--surface-input))] border border-white/10 rounded-lg p-2" />
                    </div>
                </div>
                <button onClick={handleDownload} className="w-full py-3 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))]">
                    Download Clip
                </button>
                 <p className="text-xs text-center text-[rgb(var(--text-muted))] mt-3">This feature is in beta.</p>
            </div>
        </div>
    );
};

export default ClippingModal;
