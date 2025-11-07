import React from 'react';
import type { Page } from '../types';

interface FooterProps {
    onNavigate: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="py-8 px-4 text-center border-t border-white/10 mt-12">
      <p className="text-[rgb(var(--text-muted))] text-sm max-w-3xl mx-auto mb-4">
        This website does not retain any files on its server. Rather, it solely provides links to media content hosted by third-party services.
      </p>
      <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-sm font-semibold">
        <button onClick={() => onNavigate('about')} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">About</button>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <button onClick={() => onNavigate('rules')} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Rules</button>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <button onClick={() => onNavigate('how-to-use')} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">How to Use</button>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <a href="mailto:edisonadam160@gmail.com?subject=ANISTREAM Feedback" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Feedback</a>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <button onClick={() => onNavigate('donation')} className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Donate &lt;3</button>
      </div>
      <p className="text-gray-500 text-xs">
        © {new Date().getFullYear()} website.com | Website Made by Miruro no Kuon v1.1.2
      </p>
      <div className="mt-4">
         <button onClick={() => onNavigate('og-image-generator')} className="text-xs text-gray-600 hover:text-[rgb(var(--color-primary-accent))] transition-colors">[ Dev Tools ]</button>
      </div>
    </footer>
  );
};

export default Footer;