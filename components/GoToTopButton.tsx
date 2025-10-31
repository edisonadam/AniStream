import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from './icons/Icons';

const GoToTopButton: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // This function checks if any modal is active by looking at body styles/classes.
  const isModalActive = () => {
    return document.body.style.overflow === 'hidden' || document.body.classList.contains('modal-open') || document.body.classList.contains('has-modal');
  };
  
  const [isModalOpen, setIsModalOpen] = useState(isModalActive());

  // Effect to handle scroll visibility
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

  // Effect to detect when modals open or close by observing the body element
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsModalOpen(isModalActive());
    });

    // We observe changes to `style` (for inline overflow:hidden) and `class` (for .modal-open)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => observer.disconnect();
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  // The button should only be visible if the page is scrolled AND no modal is open.
  const shouldBeVisible = isScrolled && !isModalOpen;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-30 p-3 rounded-full bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--shadow-color))/0.5] hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-1))] focus:ring-[rgb(var(--color-primary))] transition-all duration-300 transform ${
        shouldBeVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
      }`}
      aria-label="Go to top"
    >
      <ArrowUpIcon />
    </button>
  );
};

export default GoToTopButton;
