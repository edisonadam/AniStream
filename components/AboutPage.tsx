
import React from 'react';
import { ChevronLeftIcon } from './icons/Icons';

interface AboutPageProps {
  onGoBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <h1 className="text-4xl font-bold text-center mb-6 text-[rgb(var(--color-primary-accent))]">About ANISTREAM</h1>

        <div className="space-y-6 text-lg text-[rgb(var(--text-secondary))]">
          <p>
            Welcome to ANISTREAM, a passion project dedicated to creating a modern, feature-rich, and community-focused platform for anime enthusiasts. Our goal is to provide a sleek, intuitive, and enjoyable experience for discovering, tracking, and discussing your favorite anime.
          </p>

          <div className="p-4 bg-[rgb(var(--color-danger))]/20 border border-[rgb(var(--color-danger))]/50 rounded-lg text-sm">
            <p className="font-bold text-center text-[rgb(var(--color-danger))]">DISCLAIMER</p>
            <p className="text-center">
              ANISTREAM does not host any of the video files on its servers. We are a search index that provides links to third-party media hosting services. We are not responsible for the content hosted on these external sites. All content is copyright of their respective owners.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-[rgb(var(--text-primary))]">Our Philosophy</h2>
            <p>
              We believe that the anime community deserves a platform that is both beautiful and functional. ANISTREAM is built with a "user-first" mentality, focusing on clean design, fast performance, and powerful features like watchlist integration, community discussions, and detailed tracking.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3 text-[rgb(var(--text-primary))]">Technology</h2>
            <p>
              This platform is a showcase of modern web technologies, built with React, TypeScript, and Tailwind CSS. It leverages public APIs like Jikan (for MyAnimeList data), TMDB, and Consumet to aggregate and display a vast library of anime information and sources.
            </p>
          </div>

           <div className="pt-6 border-t border-white/10 text-center">
             <p className="text-md text-[rgb(var(--text-muted))]">Thank you for being a part of our community. We're constantly working to improve the platform and appreciate all your feedback!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
