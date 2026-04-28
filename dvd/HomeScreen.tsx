

import React, { useState } from 'react';
import GameCard from './GameCard';
import type { Game, AgeGroup, AgeGroupFilter } from '../types';

interface HomeScreenProps {
  onStartGame: (gameId: string) => void;
  games: Game[];
}

const ageGroups: { label: string, value: AgeGroupFilter }[] = [
    { label: 'All Ages', value: 'All' },
    { label: 'Ages 2-4', value: '2-4' },
    { label: 'Ages 5-7', value: '5-7' },
    { label: 'Ages 8+', value: '8+' },
];


const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, games }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeAgeGroup, setActiveAgeGroup] = useState<AgeGroupFilter>('All');

    const filteredGames = games.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAgeGroup = activeAgeGroup === 'All' || game.ageGroup === activeAgeGroup;
        return matchesSearch && matchesAgeGroup;
    });

    const firstEnabledGameIndex = games.findIndex(g => g.enabled);

  return (
    <div className="w-full h-full flex flex-col p-4 pt-28 md:p-6 md:pt-32 overflow-y-auto">
        <h2 className="text-center text-xl text-slate-300 mb-6 drop-shadow-sm">Choose a game to play</h2>
        
        <div className="flex justify-center items-center flex-wrap gap-3 mb-6">
            {ageGroups.map(group => (
                <button
                    key={group.value}
                    onClick={() => setActiveAgeGroup(group.value)}
                    className={`px-5 py-2 text-base font-bold rounded-full transition-all duration-300 shadow-md border-2
                        ${activeAgeGroup === group.value
                            ? 'bg-cyan-500 text-white border-cyan-400'
                            : 'bg-slate-800/80 text-slate-200 border-slate-600 hover:bg-slate-700/80 hover:border-slate-500'
                        }`}
                >
                    {group.label}
                </button>
            ))}
        </div>

      <div className="w-full max-w-lg mx-auto mb-8">
        <input 
            id="tour-search-bar"
            type="text"
            placeholder="Search for a game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 text-lg text-white bg-slate-800/80 backdrop-blur-sm rounded-full border-2 border-slate-600 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl mx-auto">
        {filteredGames.length > 0 ? (
            filteredGames.map((game, index) => (
                <GameCard 
                    key={game.id}
                    id={index === firstEnabledGameIndex ? 'tour-game-card' : undefined}
                    title={game.title}
                    description={game.description}
                    icon={game.icon}
                    isEnabled={game.enabled}
                    onPlay={() => onStartGame(game.id)}
                />
            ))
        ) : (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16">
                <p className="text-3xl font-bold text-slate-400 drop-shadow-md">No Games Found</p>
                <p className="text-slate-500 mt-2">Try a different search term or select another age group.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;