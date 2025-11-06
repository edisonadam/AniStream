import React, { useEffect, useState } from 'react';
import { useToast } from '../hooks/useToast';
// FIX: Import `ToastType` from `../types` where it is defined, instead of from `../contexts/ToastContext` which does not export it.
import type { Toast as ToastProps } from '../contexts/ToastContext';
import type { ToastType } from '../types';
import { CheckIcon, ExclamationTriangleIcon, InfoIcon, CloseIcon, HeartIcon, HeartIconSolid } from './icons/Icons';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    switch (type) {
        case 'success': return <CheckIcon className="w-5 h-5 text-green-400" />;
        case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />;
        case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
        case 'info': return <InfoIcon className="w-5 h-5 text-blue-400" />;
        case 'favorite': return <HeartIconSolid className="w-5 h-5 text-pink-400" />;
        case 'unfavorite': return <HeartIcon className="w-5 h-5 text-gray-400" />;
        default: return null;
    }
};

const typeClasses: Record<ToastType, string> = {
    success: 'border-green-500/50 glow-green',
    warning: 'border-amber-500/50 glow-amber',
    error: 'border-red-500/50 glow-red',
    info: 'border-blue-500/50 glow-blue',
    favorite: 'border-pink-500/50 glow-pink',
    unfavorite: 'border-gray-500/50 glow-gray',
};

const IndividualToast: React.FC<{ toast: ToastProps; onDismiss: (id: number) => void; }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleClose = React.useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
    }, [onDismiss, toast.id]);

    useEffect(() => {
        if (isPaused) {
            if (timerRef.current) clearTimeout(timerRef.current);
        } else {
            timerRef.current = setTimeout(handleClose, toast.duration);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [toast.duration, isPaused, handleClose]);
    
    return (
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`toast ${isExiting ? 'toast-exit' : 'toast-enter'} ${typeClasses[toast.type]}`}
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                    <ToastIcon type={toast.type} />
                </div>
                <p className="flex-1 text-sm font-semibold text-[rgb(var(--text-secondary))]">{toast.message}</p>
                <button onClick={handleClose} className="flex-shrink-0 -mr-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <CloseIcon className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                </button>
            </div>
        </div>
    );
};

export const Toaster: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <>
            <style>{`
                .toaster-container {
                    position: fixed;
                    z-index: 9999;
                    bottom: 1rem;
                    right: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    pointer-events: none;
                }
                .toast {
                    pointer-events: auto;
                    width: 350px;
                    max-width: 90vw;
                    padding: 0.75rem 1rem;
                    background: rgb(var(--surface-2) / 0.7);
                    backdrop-filter: blur(12px);
                    border-radius: 1rem; /* 2xl */
                    border: 1px solid rgb(var(--border-color));
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    will-change: transform, opacity;
                }
                .toast.glow-green { box-shadow: 0 0 15px rgba(34, 197, 94, 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.2); }
                .toast.glow-amber { box-shadow: 0 0 15px rgba(245, 158, 11, 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.2); }
                .toast.glow-red { box-shadow: 0 0 15px rgba(239, 68, 68, 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.2); }
                .toast.glow-blue { box-shadow: 0 0 15px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.2); }
                .toast.glow-pink { box-shadow: 0 0 15px rgba(236, 72, 153, 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.2); }
                .toast.glow-gray { box-shadow: 0 0 15px rgba(156, 163, 175, 0.2), 0 10px 15px -3px rgb(0 0 0 / 0.2); }

                @keyframes toast-in {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                @keyframes toast-out {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to { opacity: 0; transform: scale(0.95) translateY(10px); }
                }

                .toast-enter {
                    animation: toast-in 0.3s ease-out forwards;
                }
                .toast-exit {
                    animation: toast-out 0.3s ease-in forwards;
                }
                
                @media (max-width: 640px) {
                    .toaster-container {
                        bottom: auto;
                        top: 1rem;
                        left: 50%;
                        right: auto;
                        transform: translateX(-50%);
                    }
                }
            `}</style>
            <div className="toaster-container">
                {toasts.map((toast) => (
                    <IndividualToast key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </>
    );
};