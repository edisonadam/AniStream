
import React from 'react';

interface LogoProps {
  onClick: () => void;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ onClick, className }) => {
  return (
    <>
      <button onClick={onClick} className={`logo-button ${className || ''}`} aria-label="Go to homepage">
        AniStream
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