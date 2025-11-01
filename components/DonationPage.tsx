import React from 'react';
import { ChevronLeftIcon, HeartIcon } from './icons/Icons';

interface DonationPageProps {
  onGoBack: () => void;
}

const DonationOption: React.FC<{ name: string; address: string }> = ({ name, address }) => {
    const [copied, setCopied] = React.useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(address).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-[rgb(var(--surface-3))] p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-[rgb(var(--color-primary-accent))]">{name}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                <input type="text" readOnly value={address} className="w-full bg-[rgb(var(--surface-4))] border border-white/10 rounded-lg px-3 py-1 text-sm text-[rgb(var(--text-muted))]" />
                <button onClick={copyToClipboard} className="w-full sm:w-auto px-4 py-1.5 bg-white/10 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors flex-shrink-0">
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
};

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
              <DonationOption name="Bitcoin (BTC)" address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" />
              <DonationOption name="Ethereum (ETH)" address="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" />
              <DonationOption name="Monero (XMR)" address="483Cq9Tf4hA6hA4f4d2fA1bB2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w" />
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
