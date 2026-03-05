import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { subscribeToRateLimit } from '../api';

const RateLimitBanner: React.FC = () => {
    const [isLimited, setIsLimited] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        return subscribeToRateLimit((limited) => {
            setIsLimited(limited);
            if (limited) setIsVisible(true);
        });
    }, []);

    if (!isLimited || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md"
            >
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-xs font-medium">
                            The API is currently rate-limited. Some features might be slower than usual. We're automatically retrying for you!
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-amber-400/50" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RateLimitBanner;
