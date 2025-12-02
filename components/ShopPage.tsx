
import React from 'react';
import { ChevronLeftIcon, ShoppingCartIcon, CheckIcon } from './icons/Icons';

interface ShopPageProps {
  onGoBack: () => void;
}

const ShopItem: React.FC<{ title: string; cost: number; image: string; type: string }> = ({ title, cost, image, type }) => (
    <div className="bg-[rgb(var(--surface-2))] rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-lg">
        <div className="aspect-square bg-[rgb(var(--surface-3))] relative flex items-center justify-center p-6">
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-xs font-bold uppercase text-[rgb(var(--text-muted))]">{type}</div>
            <img src={image} alt={title} className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        <div className="p-4">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <div className="flex justify-between items-center mt-3">
                <span className="text-yellow-400 font-bold">💎 {cost.toLocaleString()}</span>
                <button className="px-4 py-1.5 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] transition-colors">
                    Buy
                </button>
            </div>
        </div>
    </div>
);

const ShopPage: React.FC<ShopPageProps> = ({ onGoBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[rgb(var(--color-primary-accent))] mb-2 flex items-center justify-center gap-3">
            <ShoppingCartIcon className="w-10 h-10"/> AniTokens Shop
        </h1>
        <p className="text-lg text-[rgb(var(--text-muted))]">Spend your hard-earned tokens on exclusive rewards!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <ShopItem title="Neon Frame" cost={5000} image="https://api.dicebear.com/8.x/shapes/svg?seed=Neon" type="Frame" />
          <ShopItem title="Golden Name" cost={15000} image="https://api.dicebear.com/8.x/initials/svg?seed=Gold&backgroundColor=FFD700" type="Effect" />
          <ShopItem title="Founder Badge" cost={50000} image="https://api.dicebear.com/8.x/icons/svg?seed=Badge&backgroundColor=2563eb" type="Badge" />
          <ShopItem title="Club Ticket" cost={50000} image="https://api.dicebear.com/8.x/icons/svg?seed=Ticket&backgroundColor=10b981" type="Item" />
          <ShopItem title="Mystery Box" cost={2500} image="https://api.dicebear.com/8.x/shapes/svg?seed=Mystery" type="Loot" />
          <ShopItem title="Custom Bg" cost={100000} image="https://api.dicebear.com/8.x/identicon/svg?seed=Background" type="Feature" />
      </div>
    </div>
  );
};

export default ShopPage;
