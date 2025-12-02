
import React from 'react';
import { ChevronLeftIcon, DownloadIcon, CheckIcon } from './icons/Icons';

interface DownloadsPageProps {
  onGoBack: () => void;
}

const DownloadsPage: React.FC<DownloadsPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[rgb(var(--text-primary))] mb-2 flex items-center justify-center gap-3">
            <DownloadIcon className="w-10 h-10 text-[rgb(var(--color-primary-accent))]"/> Download Manager
        </h1>
        <p className="text-lg text-[rgb(var(--text-muted))]">Manage your active and completed downloads.</p>
      </div>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden min-h-[400px]">
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-[rgb(var(--surface-3))] rounded-full flex items-center justify-center mb-4">
                  <CheckIcon className="w-10 h-10 text-[rgb(var(--text-muted))]" />
              </div>
              <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">No Active Downloads</h3>
              <p className="text-[rgb(var(--text-muted))] mt-2 max-w-md">
                  Downloads started from the player will appear here. You can track progress, pause, or cancel them.
              </p>
          </div>
      </div>
    </div>
  );
};

export default DownloadsPage;
