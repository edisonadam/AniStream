
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, VerifiedIcon, LevelUpIcon, SearchIcon, UsersIcon, StarIcon } from './icons/Icons';
import { fetchTopCharacters, fetchTopPeople } from '../api';
import type { Character } from '../types';

interface LeaderboardsPageProps {
  onGoBack: () => void;
}

const LeaderboardsPage: React.FC<LeaderboardsPageProps> = ({ onGoBack }) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'people'>('characters');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          try {
              if (activeTab === 'characters') {
                  const chars = await fetchTopCharacters();
                  setData(chars);
              } else {
                  const people = await fetchTopPeople();
                  setData(people);
              }
          } catch (error) {
              console.error("Failed to fetch leaderboard data", error);
          } finally {
              setIsLoading(false);
          }
      };
      fetchData();
  }, [activeTab]);

  const filteredData = data.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-subtle-fade-in-up">
      <button onClick={onGoBack} className="flex items-center space-x-2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--color-primary-accent))] transition-colors group mb-8">
        <ChevronLeftIcon className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[rgb(var(--color-primary-accent))] mb-2">Hall of Fame</h1>
        <p className="text-lg text-[rgb(var(--text-muted))]">Top rated characters and voice actors</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('characters')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'characters' ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg scale-105' : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]'}`}
          >
              Top Characters
          </button>
          <button 
            onClick={() => setActiveTab('people')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'people' ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg scale-105' : 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-4))]'}`}
          >
              Top People
          </button>
      </div>

      <div className="max-w-4xl mx-auto bg-[rgb(var(--surface-2))/0.6] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                  {activeTab === 'characters' ? <StarIcon className="w-6 h-6 text-yellow-400"/> : <UsersIcon className="w-6 h-6 text-blue-400"/>} 
                  {activeTab === 'characters' ? 'Most Loved Characters' : 'Most Popular People'}
              </h2>
              <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--text-muted))]"><SearchIcon className="w-4 h-4"/></div>
                  <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder={`Search ${activeTab}...`} 
                      className="w-full bg-[rgb(var(--surface-input))/0.2] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-[rgb(var(--text-primary))] focus:ring-1 focus:ring-[rgb(var(--border-focus))]"
                  />
              </div>
          </div>
          <div>
              {isLoading ? (
                  <div className="p-12 text-center text-[rgb(var(--text-muted))]">Loading...</div>
              ) : filteredData.length > 0 ? (
                  filteredData.map((item, index) => {
                      const rankColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-[rgb(var(--text-muted))]';
                      
                      return (
                          <div key={item.id} className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-[rgb(var(--surface-3))] transition-colors">
                              <span className={`text-2xl font-bold w-12 text-center ${rankColor}`}>#{index + 1}</span>
                              <div className="relative flex-shrink-0">
                                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[rgb(var(--text-primary))] truncate">{item.name}</p>
                                  <p className="text-xs text-[rgb(var(--text-muted))] truncate">{activeTab === 'people' ? (item.about || 'Voice Actor') : (item.role || 'Character')}</p>
                              </div>
                              {item.favorites && (
                                  <div className="text-right flex-shrink-0">
                                      <p className="font-bold text-[rgb(var(--color-primary-accent))]">{item.favorites.toLocaleString()}</p>
                                      <p className="text-xs text-[rgb(var(--text-muted))]">Favorites</p>
                                  </div>
                              )}
                          </div>
                      );
                  })
              ) : (
                  <div className="p-8 text-center text-[rgb(var(--text-muted))]">No results found.</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage;
