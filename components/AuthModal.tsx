
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CloseIcon } from './icons/Icons';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { login } = useAuth();

  // CAPTCHA state for the "What's 9 + 10?" meme question
  const [captchaNum1] = useState(9);
  const [captchaNum2] = useState(10);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // CAPTCHA validation for sign-up
    if (activeTab === 'signup') {
      const answer = captchaAnswer.trim();
      // Allow both "19" and the meme answer "21"
      if (answer !== '19' && answer !== '21') {
        setCaptchaError('Incorrect answer. Please try again.');
        setCaptchaAnswer(''); // Clear the input
        return; // Stop submission
      }
      setCaptchaError(''); // Clear error on success
    }

    if (username.trim()) {
      login(username.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-fast">
      <div className="bg-[rgb(var(--surface-2))/0.9] border border-[rgb(var(--border-color))] rounded-2xl shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-md m-4 p-8 relative transform transition-all animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">
          <CloseIcon />
        </button>
        <div className="flex border-b border-[rgb(var(--border-color))] mb-6">
          <button onClick={() => setActiveTab('login')} className={`flex-1 py-2 text-lg font-semibold transition-colors ${activeTab === 'login' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>
            Login
          </button>
          <button onClick={() => setActiveTab('signup')} className={`flex-1 py-2 text-lg font-semibold transition-colors ${activeTab === 'signup' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="w-full bg-[rgb(var(--surface-input))/0.6] border border-[rgb(var(--border-color))] rounded-lg px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
            {activeTab === 'signup' && (
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional for demo)" className="w-full bg-[rgb(var(--surface-input))/0.6] border border-[rgb(var(--border-color))] rounded-lg px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
            )}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (mock)" required className="w-full bg-[rgb(var(--surface-input))/0.6] border border-[rgb(var(--border-color))] rounded-lg px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
             {activeTab === 'signup' && (
              <div className="bg-[rgb(var(--surface-input))/0.6] border border-[rgb(var(--border-color))] rounded-lg px-4 py-3 flex items-center justify-between">
                 <label htmlFor="captcha" className="text-[rgb(var(--text-secondary))] font-semibold">
                   What is {captchaNum1} + {captchaNum2}?
                 </label>
                 <input
                   id="captcha"
                   type="text"
                   value={captchaAnswer}
                   onChange={e => setCaptchaAnswer(e.target.value)}
                   required
                   className="w-20 bg-[rgb(var(--surface-4))/0.8] border border-[rgb(var(--border-color))] rounded-md p-2 text-white text-center focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))]"
                 />
              </div>
            )}
            {captchaError && <p className="text-[rgb(var(--color-danger))] text-sm text-center">{captchaError}</p>}
          </div>
          <button type="submit" className="mt-6 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-lg font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
            {activeTab === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AuthModal;