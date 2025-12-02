
import React, { useState } from 'react';
import { ChevronLeftIcon, ShoppingCartIcon, CheckIcon, StarIcon } from './icons/Icons';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
import { useToast } from '../hooks/useToast';

interface ShopPageProps {
  onGoBack: () => void;
  onLoginRequest: (reason: string) => void;
}

const ShopItem: React.FC<{ 
    title: string; 
    cost: number; 
    image: string; 
    type: string;
    onBuy: () => void;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}> = ({ title, cost, image, type, onBuy, rarity = 'common' }) => {
    
    const rarityColors = {
        common: 'from-gray-500/20 to-gray-700/20 border-gray-600/30',
        rare: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        epic: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
        legendary: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]',
    };

    return (
        <div className={`relative bg-gradient-to-b ${rarityColors[rarity]} border rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-xl`}>
            <div className="absolute top-0 right-0 p-3 z-10">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold uppercase text-white/80 border border-white/10 tracking-wider">{type}</span>
            </div>
            
            <div className="aspect-square flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50"></div>
                <img src={image} alt={title} className="w-3/4 h-3/4 object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500 z-10" />
            </div>
            
            <div className="p-4 bg-[rgb(var(--surface-2))/0.9] backdrop-blur-sm border-t border-white/5">
                <h3 className="font-bold text-lg mb-1 truncate text-white group-hover:text-[rgb(var(--color-primary-accent))] transition-colors">{title}</h3>
                <div className="flex justify-between items-center mt-3">
                    <span className="flex items-center gap-1 text-yellow-400 font-bold text-sm bg-yellow-400/10 px-2 py-1 rounded-lg">
                        💎 {cost.toLocaleString()}
                    </span>
                    <button 
                        onClick={onBuy}
                        className="px-4 py-1.5 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] active:scale-95 transition-all shadow-lg shadow-[rgb(var(--shadow-color))/0.3]"
                    >
                        Buy
                    </button>
                </div>
            </div>
        </div>
    );
};

const ShopPage: React.FC<ShopPageProps> = ({ onGoBack, onLoginRequest }) => {
  const { isLoggedIn, user } = useAuth();
  const { aniTokens, spendAniTokens } = useProfileData();
  const { addToast } = useToast();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', 'frames', 'badges', 'effects', 'items'];

  const shopItems = [
      { id: 1, title: "Neon Frame", cost: 5000, image: "https://api.dicebear.com/8.x/shapes/svg?seed=Neon", type: "frames", rarity: 'rare' as const },
      { id: 2, title: "Golden Name", cost: 15000, image: "https://api.dicebear.com/8.x/initials/svg?seed=Gold&backgroundColor=FFD700", type: "effects", rarity: 'epic' as const },
      { id: 3, title: "Founder Badge", cost: 50000, image: "https://api.dicebear.com/8.x/icons/svg?seed=Badge&backgroundColor=2563eb", type: "badges", rarity: 'legendary' as const },
      { id: 4, title: "Club Ticket", cost: 50000, image: "https://api.dicebear.com/8.x/icons/svg?seed=Ticket&backgroundColor=10b981", type: "items", rarity: 'rare' as const },
      { id: 5, title: "Mystery Box", cost: 2500, image: "https://api.dicebear.com/8.x/shapes/svg?seed=Mystery", type: "items", rarity: 'common' as const },
      { id: 6, title: "Custom Bg", cost: 100000, image: "https://api.dicebear.com/8.x/identicon/svg?seed=Background", type: "items", rarity: 'legendary' as const },
      { id: 7, title: "Cyber Badge", cost: 7500, image: "https://api.dicebear.com/8.x/icons/svg?seed=Cyber", type: "badges", rarity: 'rare' as const },
      { id: 8, title: "Sparkle Effect", cost: 3000, image: "https://api.dicebear.com/8.x/shapes/svg?seed=Sparkle", type: "effects", rarity: 'common' as const },
  ];

  const handleBuy = (item: typeof shopItems[0]) => {
      if (!isLoggedIn) {
          onLoginRequest("Please log in to purchase items from the shop.");
          return;
      }

      if (aniTokens < item.cost) {
          addToast(`Insufficient funds! You need ${item.cost - aniTokens} more AniTokens.`, 'error');
          return;
      }

      if (spendAniTokens(item.cost)) {
          addToast(`Successfully purchased ${item.title}!`, 'success');
      } else {
          addToast("Transaction failed. Please try again.", 'error');
      }
  };

  const filteredItems = activeCategory === 'all' ? shopItems : shopItems.filter(item => item.type === activeCategory);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-4">
                <ChevronLeftIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
            </button>
            <h1 className="text-4xl font-black text-white flex items-center gap-3 drop-shadow-lg">
                <ShoppingCartIcon className="w-10 h-10 text-[rgb(var(--color-primary-accent))]"/> 
                <span>Token Shop</span>
            </h1>
            <p className="text-[rgb(var(--text-muted))] mt-2 text-lg">Exlusive rewards for community members</p>
          </div>

          {/* User Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[rgb(var(--color-primary))] to-purple-600 p-6 rounded-2xl shadow-xl w-full md:w-auto min-w-[280px] group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                  <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Your Balance</p>
                  <div className="flex items-center gap-3">
                      <span className="text-4xl">💎</span>
                      <span className="text-4xl font-black text-white tracking-tight">
                          {isLoggedIn ? aniTokens.toLocaleString() : '---'}
                      </span>
                  </div>
                  {!isLoggedIn && <p className="text-xs text-blue-200 mt-2 cursor-pointer hover:underline" onClick={() => onLoginRequest("Log in to see your balance")}>Log in to view balance</p>}
              </div>
          </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
          {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full font-bold text-sm capitalize transition-all duration-300 transform hover:scale-105 ${
                    activeCategory === cat 
                    ? 'bg-white text-black shadow-lg shadow-white/20' 
                    : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))] hover:text-white'
                }`}
              >
                  {cat}
              </button>
          ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
              <ShopItem 
                key={item.id} 
                title={item.title} 
                cost={item.cost} 
                image={item.image} 
                type={item.type} 
                rarity={item.rarity}
                onBuy={() => handleBuy(item)} 
              />
          ))}
      </div>
      
      {filteredItems.length === 0 && (
          <div className="text-center py-20 text-[rgb(var(--text-muted))]">
              <p className="text-xl">No items found in this category.</p>
          </div>
      )}
    </div>
  );
};

export default ShopPage;
