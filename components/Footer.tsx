import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 text-center">
      <p className="text-gray-500 text-sm">
        © {new Date().getFullYear()} AniStream — Streaming powered by VidSrc.
      </p>
    </footer>
  );
};

export default Footer;
