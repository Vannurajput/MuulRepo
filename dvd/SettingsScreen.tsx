import React, { useState, useCallback } from 'react';
import { HomeIcon } from './icons/HomeIcon';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState('Medium');
  const [feedback, setFeedback] = useState('');

  const showTemporaryFeedback = useCallback((message: string) => {
    setFeedback(message);
    const timer = setTimeout(() => {
        setFeedback('');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleResetScores = () => {
      if (window.confirm('Are you sure you want to reset all scores for all profiles? This cannot be undone.')) {
          localStorage.removeItem('scores');
          showTemporaryFeedback('All high scores have been reset.');
      }
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-4 pt-28 bg-transparent overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-slate-700 p-6 md:p-8 relative">
        <h1 className="text-4xl font-bold text-center text-cyan-400 drop-shadow-md mb-8">Settings</h1>
        
        <div className="space-y-6 text-slate-100">
          <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg shadow-inner">
            <span className="text-xl font-bold">Game Difficulty</span>
            <div className="flex gap-1 bg-slate-800 p-1 rounded-full">
              {['Easy', 'Medium', 'Hard'].map(level => (
                <button 
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-4 py-1.5 font-semibold rounded-full text-sm transition-colors duration-300 ${difficulty === level ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg shadow-inner">
            <span className="text-xl font-bold">Reset All High Scores</span>
            <button
              onClick={handleResetScores}
              className="px-5 py-2 font-bold rounded-full transition-all text-white text-base bg-red-600 hover:bg-red-700 border-b-2 border-red-800 active:border-b-0 active:translate-y-px"
            >
              Reset Data
            </button>
          </div>
        </div>
        
        <div className="h-6 text-center mt-4">
          {feedback && <p className="text-green-400 animate-pulse">{feedback}</p>}
        </div>

        <button onClick={onBack} className="mt-6 w-full flex items-center justify-center gap-3 py-3 bg-cyan-600 text-white font-bold text-lg rounded-lg shadow-md border-b-4 border-cyan-800 hover:bg-cyan-500 active:border-b-0 active:translate-y-1 transition-all">
          <HomeIcon className="w-6 h-6"/>
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;