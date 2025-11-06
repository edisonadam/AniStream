import React from 'react';
import { ChevronLeftIcon, HeartIcon } from './icons/Icons';

interface DonationPageProps {
  onGoBack: () => void;
}

const DonationPlatformOption: React.FC<{ name: string; url: string; colorClass: string; icon: React.ReactNode }> = ({ name, url, colorClass, icon }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl font-bold text-white transition-transform duration-300 hover:scale-105 ${colorClass}`}>
        {icon}
        <span>Support on {name}</span>
    </a>
);


const DonationPage: React.FC<DonationPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl p-8 rounded-3xl border border-white/10">
        <div className="text-center mb-8">
            <HeartIcon className="w-12 h-12 mx-auto text-[rgb(var(--color-primary-accent))]" />
            <h1 className="text-4xl font-bold mt-4 text-[rgb(var(--text-primary))]">Support ANISTREAM</h1>
            <p className="text-lg text-[rgb(var(--text-muted))] mt-2">Help us keep the servers running and the features flowing!</p>
        </div>
        
        <div className="space-y-6 text-md text-[rgb(var(--text-secondary))]">
          <p className="text-center">
            ANISTREAM is a free, ad-free, and passion-driven project. We rely on the generosity of our community to cover server costs, API fees, and future development. Every contribution, no matter how small, makes a huge difference and is deeply appreciated.
          </p>
          
          <div className="space-y-4">
               <DonationPlatformOption 
                  name="Ko-fi" 
                  url="https://ko-fi.com/example" 
                  colorClass="bg-[#13C3FF] hover:bg-[#10a8db]" 
                  icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M23.83 8.33c0-3.14-2.12-5.9-5.32-5.9H9.37a.5.5 0 0 0-.5.5v2.85h9.45c2.23 0 3.93 1.34 3.93 3.32 0 1.9-1.5 3.2-3.66 3.2H11.8v2.85h4.94c3.34 0 5.43-2.42 5.43-5.82zM0 3h16.22v2.85H3.14v3.89h11.23v2.85H3.14v5.36H18.2V21H0V3z"></path></svg>} 
              />
              <DonationPlatformOption 
                  name="Patreon" 
                  url="https://patreon.com/example" 
                  colorClass="bg-[#FF424D] hover:bg-[#e63b45]" 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 569 546" fill="currentColor"><path d="M569,546.12H433.43V0H569V546.12ZM266.6,178.49c-98.15,0-178.49,80.34-178.49,178.49S168.45,535.47,266.6,535.47s178.49-80.34,178.49-178.49S364.75,178.49,266.6,178.49Z"></path></svg>} 
              />
          </div>

          <div className="pt-6 border-t border-white/10 text-center">
             <p className="text-md text-[rgb(var(--text-muted))]">Thank you for your incredible support. You are the reason this community thrives. &lt;3</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;