import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginPromptProps {
    onLoginClick: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginClick }) => {
    const { isLoggedIn } = useAuth();
    if (isLoggedIn) return null;

    return (
        <div className="sticky top-20 z-30 bg-[rgb(var(--surface-2))/0.7] backdrop-blur-md border-b border-white/10 p-4">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center gap-4">
                <p className="font-semibold text-[rgb(var(--text-secondary))]">
                    Please <button onClick={onLoginClick} className="text-[rgb(var(--color-primary-accent))] hover:underline font-bold">Log In</button> or <button onClick={onLoginClick} className="text-[rgb(var(--color-primary-accent))] hover:underline font-bold">Sign Up</button> to access all features.
                </p>
            </div>
        </div>
    );
}

export default LoginPrompt;