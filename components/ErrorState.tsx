import React from 'react';
import { ExclamationTriangleIcon, RefreshCwIcon } from './icons/Icons';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, className = '' }) => (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-subtle-fade-in-up ${className}`}>
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">Oops! Something went wrong</h3>
        <p className="text-[rgb(var(--text-muted))] max-w-md mb-6">{message}</p>
        {onRetry && (
            <button 
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-full font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors"
            >
                <RefreshCwIcon className="w-5 h-5" />
                Try Again
            </button>
        )}
    </div>
);

export default ErrorState;
