import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    type ConfirmationResult
} from 'firebase/auth';
import { CloseIcon, GoogleIcon, ChevronLeftIcon } from './icons/Icons';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [view, setView] = useState<'main' | 'phone'>('main');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  
  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Firebase and UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure reCAPTCHA is ready when phone view is active
    if (view === 'phone' && phoneStep === 'input' && recaptchaContainerRef.current) {
        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                'size': 'invisible',
                'callback': (response: any) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                }
            });
        }
    }
  }, [view, phoneStep]);


  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!displayName.trim()) {
        setError("Display name cannot be empty.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
          photoURL: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${displayName.trim()}`
      });
      onClose();
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
      setIsLoading(true);
      setError('');
      try {
          await signInWithEmailAndPassword(auth, email, password);
          onClose();
      } catch (err: any) {
          setError(err.message.replace('Firebase: ', ''));
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        onClose();
    } catch (err: any) {
        setError(err.message.replace('Firebase: ', ''));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSendCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      try {
          const verifier = (window as any).recaptchaVerifier;
          const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
          setConfirmationResult(result);
          setPhoneStep('verify');
      } catch (err: any) {
          setError(err.message.replace('Firebase: ', ''));
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
        setError("Verification process was not initiated correctly. Please try again.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
        await confirmationResult.confirm(verificationCode);
        onClose();
    } catch (err: any) {
        setError(err.message.replace('Firebase: ', ''));
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (activeTab === 'signup') handleSignUp();
    else handleLogin();
  };
  
  const renderMainView = () => (
    <>
        <div className="flex border-b border-white/10 mb-6">
            <button onClick={() => setActiveTab('login')} className={`flex-1 py-2 text-lg font-semibold transition-colors ${activeTab === 'login' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Login</button>
            <button onClick={() => setActiveTab('signup')} className={`flex-1 py-2 text-lg font-semibold transition-colors ${activeTab === 'signup' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Sign Up</button>
        </div>
        <form onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
                {activeTab === 'signup' && (
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                )}
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                {activeTab === 'signup' && (
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                )}
            </div>
            <button type="submit" disabled={isLoading} className="mt-6 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3] disabled:opacity-50 disabled:cursor-wait">
                {isLoading ? 'Processing...' : (activeTab === 'login' ? 'Log In' : 'Sign Up')}
            </button>
        </form>
        
        <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative bg-[rgb(var(--surface-2))] px-3 text-sm text-[rgb(var(--text-muted))]">OR</span>
        </div>

        <div className="space-y-3">
            <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 text-[rgb(var(--text-secondary))] rounded-2xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50">
                <GoogleIcon /> Continue with Google
            </button>
            <button onClick={() => setView('phone')} disabled={isLoading} className="w-full py-3 bg-white/5 text-[rgb(var(--text-secondary))] rounded-2xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50">Continue with Phone</button>
        </div>
    </>
  );
  
  const renderPhoneView = () => (
    <div>
        <button onClick={() => { setView('main'); setError(''); }} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] mb-4"><ChevronLeftIcon className="w-4 h-4" /> Back</button>
        {phoneStep === 'input' ? (
            <form onSubmit={handleSendCode}>
                <h3 className="text-xl font-bold mb-2">Enter your phone number</h3>
                <p className="text-[rgb(var(--text-muted))] text-sm mb-4">We'll send you a code to verify your number.</p>
                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 555-555-5555" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                <button type="submit" disabled={isLoading} className="mt-4 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50">
                    {isLoading ? 'Sending...' : 'Send Code'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleVerifyCode}>
                <h3 className="text-xl font-bold mb-2">Enter verification code</h3>
                <p className="text-[rgb(var(--text-muted))] text-sm mb-4">A code was sent to {phoneNumber}.</p>
                <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="6-digit code" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                <button type="submit" disabled={isLoading} className="mt-4 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50">
                    {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
            </form>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center animate-cinematic-fade-in">
      <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-md m-4 p-8 relative transform transition-all animate-subtle-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
          <CloseIcon />
        </button>
        
        {view === 'main' ? renderMainView() : renderPhoneView()}
        
        {error && <p className="text-[rgb(var(--color-danger))] text-sm text-center mt-4">{error}</p>}
        
        <div ref={recaptchaContainerRef}></div>
      </div>
    </div>
  );
};

export default AuthModal;
