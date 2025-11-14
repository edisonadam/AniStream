import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { 
    type ConfirmationResult,
    type AuthCredential,
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification,
    signInWithEmailAndPassword,
    linkWithCredential,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    sendPasswordResetEmail
} from 'firebase/auth';
import { CloseIcon, GoogleIcon, ChevronLeftIcon } from './icons/Icons';
import type { CommunityUser } from '../types';

interface AuthModalProps {
  onClose: () => void;
  reason?: string | null;
}

const AniListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.3802 34.2254C21.432 35.1736 20.01 35.1736 19.0618 34.2254L10.3752 25.5388C8.95325 24.1169 9.50853 21.7239 11.3235 21.1686L34.2254 14.1105C35.1736 13.8279 36.1721 14.8264 35.8895 15.7746L28.8314 38.6765C28.2761 40.4915 25.8831 41.0468 24.4612 39.6248L22.3802 34.2254Z" fill="#3DB4F2"/>
        <path d="M28.8314 15.7746L22.3802 22.2258L27.7797 24.3068L34.2254 20.913L28.8314 15.7746Z" fill="#2A3240"/>
    </svg>
);


const AuthModal: React.FC<AuthModalProps> = ({ onClose, reason }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [view, setView] = useState<'main' | 'phone' | 'reset_password'>('main');
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
  const [pendingCredential, setPendingCredential] = useState<AuthCredential | null>(null);

  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lazily load and initialize reCAPTCHA when phone view is active
    const initRecaptcha = () => {
      try {
        // RecaptchaVerifier is now imported statically.
        // Ensure it's not already initialized and the container exists
        if (!(window as any).recaptchaVerifier && recaptchaContainerRef.current) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible',
            'callback': () => {
              // This callback is for an invisible reCAPTCHA and is often triggered automatically.
            },
          });
          (window as any).recaptchaVerifier.render();
        }
      } catch (e) {
        console.error("Error initializing reCAPTCHA:", e);
        setError("Could not initialize phone sign-in. Please try another method.");
      }
    };
    
    if (view === 'phone' && phoneStep === 'input') {
      initRecaptcha();
    }

    // Cleanup function to clear the verifier when the component unmounts or view changes
    return () => {
      const verifier = (window as any).recaptchaVerifier;
      if (verifier) {
        try {
          verifier.clear();
        } catch (e) {
            // It might throw an error if it's already been cleared or the widget is gone, which is fine.
            console.warn('reCAPTCHA cleanup failed, this may happen on fast re-renders.', e);
        }
      }
    };
  }, [view, phoneStep]);

  const handleTabChange = (newTab: 'login' | 'signup') => {
    if (activeTab !== newTab) {
      setActiveTab(newTab);
      setError('');
      // Clear pending credential if user switches away from login during linking process
      if (newTab !== 'login' && pendingCredential) {
        setPendingCredential(null);
      }
    }
  };

  const handleViewChange = (newView: 'main' | 'phone' | 'reset_password') => {
    if (view !== newView) {
      setView(newView);
      setError('');
      // Clear pending credential if user leaves the main auth flow
      if (pendingCredential) {
        setPendingCredential(null);
      }
    }
  };

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
      const avatarUrl = `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${displayName.trim()}`;
      await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
          photoURL: avatarUrl
      });
      await sendEmailVerification(userCredential.user);

      // Add user to the public directory for search
      try {
          const directoryKey = 'anistream-user-directory';
          const existingUsersRaw = localStorage.getItem(directoryKey);
          const existingUsers: CommunityUser[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];
          if (!existingUsers.some(u => u.uid === userCredential.user.uid)) {
              existingUsers.push({
                  uid: userCredential.user.uid,
                  username: displayName.trim(),
                  avatar: avatarUrl,
              });
              localStorage.setItem(directoryKey, JSON.stringify(existingUsers));
          }
      } catch(e) { console.error("Failed to update user directory", e); }

      setSignupSuccess(true);
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
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          if (pendingCredential) {
              await linkWithCredential(userCredential.user, pendingCredential);
              setPendingCredential(null);
          }
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
        if (err.code === 'auth/account-exists-with-different-credential') {
            const email = err.customData.email;
            const credential = GoogleAuthProvider.credentialFromError(err);
            if (credential) {
              setPendingCredential(credential);
              setEmail(email);
              setActiveTab('login');
              setError('An account with this email already exists. Please sign in with your password to link your Google account.');
            } else {
               setError('Could not process Google sign-in. Please try again.');
            }
        } else {
            setError(err.message.replace('Firebase: ', ''));
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnilistLogin = () => {
    alert("Login with AniList is coming soon!");
  };
  
  const handleSendCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      try {
          const verifier = (window as any).recaptchaVerifier;
          if (!verifier) {
            setError("reCAPTCHA is not ready. Please wait a moment and try again.");
            setIsLoading(false);
            return;
          }
          const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
          setConfirmationResult(result);
          setPhoneStep('verify');
      } catch (err: any) {
          setError(err.message.replace('Firebase: ', ''));
          // Reset verifier on error
          if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.clear();
            delete (window as any).recaptchaVerifier;
          }
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
        await sendPasswordResetEmail(auth, email);
        setResetEmailSent(true);
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

  const renderSignupSuccess = () => (
    <>
        <h3 className="text-xl font-bold mb-2 text-center text-[rgb(var(--text-primary))]">Verification Email Sent!</h3>
        <p className="text-[rgb(var(--text-muted))] text-sm mb-4 text-center">
            We've sent a verification link to <strong>{email}</strong>. Please check your inbox (and spam folder) to complete your registration.
        </p>
        <button onClick={() => {
            setSignupSuccess(false);
            handleTabChange('login');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setDisplayName('');
        }} className="mt-6 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3]">
            Back to Login
        </button>
    </>
  );
  
  const renderMainView = () => (
    signupSuccess ? renderSignupSuccess() :
    <>
        {reason && (
            <div className="text-center bg-[rgb(var(--color-warning))]/10 border border-[rgb(var(--color-warning))]/30 text-[rgb(var(--color-warning))] text-sm rounded-xl p-3 mb-4">
                {reason}
            </div>
        )}
        <div className="flex border-b border-white/10 mb-6">
            <button onClick={() => handleTabChange('login')} className={`flex-1 py-2 text-lg font-semibold transition-colors ${activeTab === 'login' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Login</button>
            <button onClick={() => handleTabChange('signup')} className={`flex-1 py-2 text-lg font-semibold transition-colors ${activeTab === 'signup' ? 'text-[rgb(var(--color-primary-accent))] border-b-2 border-[rgb(var(--color-primary-accent))]' : 'text-[rgb(var(--text-muted))]'}`}>Sign Up</button>
        </div>
        <form onSubmit={handleEmailSubmit}>
            <div className="space-y-4">
                {activeTab === 'signup' && (
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                )}
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                {activeTab === 'login' && (
                    <div className="text-right !mt-2">
                        <button type="button" onClick={() => handleViewChange('reset_password')} className="text-sm font-medium text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
                            Forgot Password?
                        </button>
                    </div>
                )}
                {activeTab === 'signup' && (
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                )}
            </div>
            <button type="submit" disabled={isLoading} className="mt-6 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[rgb(var(--shadow-color))/0.3] disabled:opacity-50 disabled:cursor-wait">
                {isLoading ? 'Processing...' : (pendingCredential ? 'Link Account & Log In' : (activeTab === 'login' ? 'Log In' : 'Sign Up'))}
            </button>
        </form>
        
        <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative bg-[rgb(var(--surface-2))] px-3 text-sm text-[rgb(var(--text-muted))]">OR</span>
        </div>

        <div className="space-y-3">
            <button onClick={handleAnilistLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 text-[rgb(var(--text-secondary))] rounded-2xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50">
                <AniListIcon /> Continue with AniList
            </button>
            <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 text-[rgb(var(--text-secondary))] rounded-2xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50">
                <GoogleIcon /> Continue with Google
            </button>
            <button onClick={() => handleViewChange('phone')} disabled={isLoading} className="w-full py-3 bg-white/5 text-[rgb(var(--text-secondary))] rounded-2xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50">Continue with Phone</button>
        </div>
    </>
  );
  
  const renderPhoneView = () => (
    <div>
        <button onClick={() => handleViewChange('main')} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] mb-4"><ChevronLeftIcon className="w-4 h-4" /> Back</button>
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

  const renderResetPasswordView = () => (
    <div>
        <button onClick={() => handleViewChange('main')} className="flex items-center gap-1 text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] mb-4"><ChevronLeftIcon className="w-4 h-4" /> Back</button>
        {resetEmailSent ? (
            <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Password Reset Email Sent</h3>
                <p className="text-[rgb(var(--text-muted))] text-sm mb-4">Check your inbox at <strong>{email}</strong> for a link to reset your password.</p>
                <button onClick={() => handleViewChange('main')} className="mt-4 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))]">Back to Login</button>
            </div>
        ) : (
            <form onSubmit={handlePasswordReset}>
                <h3 className="text-xl font-bold mb-2">Reset Password</h3>
                <p className="text-[rgb(var(--text-muted))] text-sm mb-4">Enter your email and we'll send you a link to reset your password.</p>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-2xl px-4 py-3 text-[rgb(var(--text-primary))] focus:ring-2 focus:ring-[rgb(var(--border-focus))] focus:border-[rgb(var(--border-focus))] transition-all" />
                <button type="submit" disabled={isLoading} className="mt-4 w-full py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--text-on-primary))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary-hover))] transition-colors disabled:opacity-50">
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
        )}
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'phone':
        return renderPhoneView();
      case 'reset_password':
        return renderResetPasswordView();
      case 'main':
      default:
        return renderMainView();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center animate-cinematic-fade-in">
      <div className="bg-[rgb(var(--surface-2))/0.6] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-[rgb(var(--shadow-color))/0.5] w-full max-w-md m-4 p-8 relative animate-modal-pop-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--color-primary-accent))]">
          <CloseIcon />
        </button>
        
        {renderContent()}
        
        {error && <p className="text-[rgb(var(--text-danger))] text-sm text-center mt-4">{error}</p>}
        
        <div ref={recaptchaContainerRef}></div>
      </div>
    </div>
  );
};

export default AuthModal;