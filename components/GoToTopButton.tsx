import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowUpIcon } from './icons/Icons';

const GoToTopButton: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsScrolled(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility(); // Initial check

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const portalRoot = document.getElementById('goto-top-root');

  if (!portalRoot) {
    // If the portal root doesn't exist for some reason, don't render anything.
    return null;
  }
  
  return ReactDOM.createPortal(
    <button
      onClick={scrollToTop}
      title="Go to top"
      className={`fixed bottom-6 right-6 z-30 p-3 rounded-full bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--shadow-color))/0.5] hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-1))] focus:ring-[rgb(var(--color-primary))] transition-all duration-300 transform ${
        isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
      }`}
      aria-label="Go to top"
    >
      <ArrowUpIcon />
    </button>,
    portalRoot
  );
};

export default GoToTopButton;
