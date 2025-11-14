import React, { useRef, useEffect } from 'react';

interface LogoProps {
  onClick: () => void;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ onClick, className }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleInteraction = () => {
      const button = buttonRef.current;
      // If the button is the currently focused element, remove focus ("unselect" it).
      // Added a fallback check with `matches(':focus')` for robustness.
      if (button && (document.activeElement === button || button.matches(':focus'))) {
        button.blur();
      }
    };

    window.addEventListener('scroll', handleInteraction, { passive: true });
    window.addEventListener('touchmove', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchmove', handleInteraction);
    };
  }, []);
  
  const handleClick = () => {
    // First, call the passed onClick function (e.g., to navigate home).
    onClick();
    
    // Then, after a short delay, remove focus from the button.
    // This allows the :active state to show but prevents a sticky :focus state.
    if (buttonRef.current) {
        setTimeout(() => {
            buttonRef.current?.blur();
        }, 300);
    }
  };

  return (
    <>
      <button ref={buttonRef} onClick={handleClick} className={`logo-button ${className || ''}`} aria-label="Go to homepage">
        ANISTREAM
      </button>
      <style>{`
        .logo-button {
          font-size: 1.5rem; /* text-2xl */
          font-weight: 700; /* font-bold */
          letter-spacing: 0.1em; /* wider than tracking-wider */
          text-transform: uppercase;
          color: #fff;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0;
          text-shadow:
            0 0 4px #fff,
            0 0 8px #fff,
            0 0 12px var(--logo-glow-1),
            0 0 20px var(--logo-glow-1),
            0 0 28px var(--logo-glow-1);
          transition: text-shadow 0.3s ease-in-out, color 0.3s ease-in-out;
          font-family: inherit; /* ensure it uses the body font */
        }
        .logo-button:hover, .logo-button:focus {
          outline: none;
          color: rgb(var(--color-primary-accent));
          text-shadow:
            0 0 5px #fff,
            0 0 10px #fff,
            0 0 15px var(--logo-glow-2),
            0 0 25px var(--logo-glow-2),
            0 0 35px var(--logo-glow-2),
            0 0 50px var(--logo-glow-2);
        }
      `}</style>
    </>
  );
};

export default Logo;