import React from 'react';
import { ReplayIcon } from './icons/ReplayIcon';
import { HomeIcon } from './icons/HomeIcon';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  onGoHome: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart, onGoHome }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-teal-500/20 border-2 border-teal-500 animate-fade-in scale-up max-w-sm mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold text-teal-400 drop-shadow-lg">Game Over</h2>
          <p className="mt-4 text-2xl md:text-3xl text-slate-200">Your Score:</p>
          <p className="text-6xl md:text-8xl font-bold text-white my-4 drop-shadow-lg">{score}</p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              onClick={onRestart}
              className="bg-teal-500 text-white font-bold text-2xl rounded-xl shadow-lg shadow-teal-500/30 border-b-4 border-teal-700 hover:bg-teal-400 active:border-b-0 active:translate-y-1 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-teal-300"
            >
              <span className="flex items-center justify-center px-8 py-4">
                <ReplayIcon className="w-8 h-8" />
                <span className="ml-3">Play Again</span>
              </span>
            </button>
             <button
              onClick={onGoHome}
              className="bg-cyan-500 text-white font-bold text-2xl rounded-xl shadow-lg shadow-cyan-500/30 border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300"
            >
              <span className="flex items-center justify-center px-8 py-4">
                <HomeIcon className="w-8 h-8" />
                <span className="ml-3">Home</span>
              </span>
            </button>
          </div>
        </div>
    </div>
  );
};

export default GameOverScreen;