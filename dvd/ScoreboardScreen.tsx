
import React, { useState, useEffect } from 'react';
import type { ScoreEntry, Profile, Game, Milestone } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { AVATAR_MAP } from './icons/Avatars';
import { TrophyLockIcon } from './icons/TrophyIcons';

interface ProfileScreenProps {
  onBack: () => void;
  activeProfile: Profile;
  allGames: Game[];
  allMilestones: Milestone[];
}

const ScoreboardScreen: React.FC<ProfileScreenProps> = ({ onBack, activeProfile, allGames, allMilestones }) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'scores' | 'trophies'>('scores');

  useEffect(() => {
    try {
      const storedScores: ScoreEntry[] = JSON.parse(localStorage.getItem('scores') || '[]');
      const profileScores = storedScores.filter(s => s.profileId === activeProfile.id);
      setScores(profileScores);
    } catch (error) {
      console.error('Could not load scores:', error);
      setScores([]);
    }
  }, [activeProfile.id]);

  const AvatarComponent = AVATAR_MAP[activeProfile.avatar];
  const unlockedTrophyIds = new Set(activeProfile.unlockedTrophies);
  const totalTrophies = allMilestones.length;
  
  return (
    <div className="w-full h-full flex flex-col items-center p-4 pt-28 bg-transparent overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-slate-700 p-6">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-600 pb-6 mb-6">
            {AvatarComponent && (
                <div className="w-24 h-24 rounded-full p-1 bg-slate-600 shadow-md">
                    <AvatarComponent className="w-full h-full rounded-full" />
                </div>
            )}
            <div>
                <h1 className="text-4xl font-bold text-center sm:text-left text-cyan-400 drop-shadow-md">{activeProfile.name}</h1>
                <p className="text-slate-300 text-center sm:text-left">Trophies Earned: {unlockedTrophyIds.size} / {totalTrophies}</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center border-b border-slate-600 mb-4">
            <button 
                onClick={() => setActiveTab('scores')}
                className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'scores' ? 'border-b-4 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                My Scores
            </button>
            <button 
                onClick={() => setActiveTab('trophies')}
                className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'trophies' ? 'border-b-4 border-cyan-500 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
                My Trophies
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'scores' && (
            scores.length > 0 ? (
              <ul className="space-y-3">
                {scores.map((entry, index) => (
                  <li key={entry.date + '-' + index} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <span className="text-xl font-bold text-slate-300 w-8">{index + 1}.</span>
                        <span className="text-lg font-bold text-white">{entry.game}</span>
                    </div>
                    <span className="text-2xl font-bold text-cyan-400">{entry.score}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-slate-400 py-8">No scores yet. Go play a game to see your high scores here!</p>
            )
        )}
        {activeTab === 'trophies' && (
            allMilestones.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allMilestones.map(milestone => {
                        const isUnlocked = unlockedTrophyIds.has(milestone.id);
                        return (
                            <div key={milestone.id} className={`flex items-center gap-4 p-3 rounded-lg shadow-sm transition-all ${isUnlocked ? 'bg-slate-700' : 'bg-slate-900/50'}`}>
                                <div className={`w-20 h-20 shrink-0 ${isUnlocked ? 'text-cyan-400' : 'text-slate-600 grayscale'}`}>
                                    {isUnlocked ? milestone.icon : <TrophyLockIcon />}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{milestone.title}</h4>
                                    <p className={`text-sm ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>{isUnlocked ? milestone.description : "Keep playing to unlock!"}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">No trophies available yet. Check back soon!</p>
            )
        )}
         {scores.length > 0 && activeTab === 'scores' && (
             <button onClick={() => { if(window.confirm('This will only clear scores for this profile. Are you sure?')) { localStorage.setItem('scores', JSON.stringify(JSON.parse(localStorage.getItem('scores') || '[]').filter((s: ScoreEntry) => s.profileId !== activeProfile.id))); setScores([]); } }} className="w-full mt-6 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                Clear My Scores
             </button>
         )}

      </div>
    </div>
  );
};

export default ScoreboardScreen;
