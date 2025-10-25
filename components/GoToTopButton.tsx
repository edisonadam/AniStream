
import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from './icons/Icons';

const GoToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 400) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-30 p-3 rounded-full bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--shadow-color))/0.5] hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-1))] focus:ring-[rgb(var(--color-primary))] transition-all duration-300 transform ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
      }`}
      aria-label="Go to top"
    >
      <ArrowUpIcon />
    </button>
  );
};

export default GoToTopButton;
