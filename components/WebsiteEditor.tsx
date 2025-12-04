import React, { useState } from 'react';
import { CogIcon, CloseIcon, InfoIcon } from './icons/Icons';
import DeveloperInfoModal from './DeveloperInfoModal';

const WebsiteEditor: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isDevInfoOpen, setIsDevInfoOpen] = useState(false);

    return (
        <>
            {isDevInfoOpen && <DeveloperInfoModal onClose={() => setIsDevInfoOpen(false)} />}
            <div className="fixed bottom-6 right-6 z-[9998]">
                {isPanelOpen && (
                    <div className="bg-[rgb(var(--surface-2))] p-4 rounded-2xl shadow-2xl border border-white/10 mb-4 w-64 animate-subtle-fade-in-up">
                        <h3 className="font-bold text-lg mb-2">Editor Mode</h3>
                        <button
                            onClick={() => setIsDevInfoOpen(true)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[rgb(var(--surface-3))] transition-colors"
                        >
                            <InfoIcon className="w-5 h-5" />
                            <span>Developer Info</span>
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setIsPanelOpen(prev => !prev)}
                    className="w-16 h-16 bg-[rgb(var(--color-primary))] rounded-full flex items-center justify-center shadow-lg text-white transform transition-all duration-300 hover:scale-110"
                    aria-label="Toggle Website Editor"
                >
                    {isPanelOpen ? <CloseIcon className="w-8 h-8" /> : <CogIcon className="w-8 h-8 animate-spin" style={{ animationDuration: '5s' }} />}
                </button>
            </div>
        </>
    );
};

export default WebsiteEditor;
