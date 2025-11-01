

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 text-center border-t border-white/10 mt-12">
      <p className="text-[rgb(var(--text-muted))] text-sm max-w-3xl mx-auto mb-4">
        This website does not retain any files on its server. Rather, it solely provides links to media content hosted by third-party services.
      </p>
      <div className="flex justify-center items-center gap-4 mb-4 text-sm font-semibold">
        <a href="#" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Domains</a>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <a href="#" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Status</a>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <a href="mailto:feedback@anistream.com?subject=ANISTREAM Feedback" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Feedback</a>
        <span className="text-[rgb(var(--text-muted))]">|</span>
        <a href="#" className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors">Donate &lt;3</a>
      </div>
      <p className="text-gray-500 text-xs">
        © {new Date().getFullYear()} website.com | Website Made by Miruro no Kuon v1.1.2
      </p>
    </footer>
  );
};

export default Footer;