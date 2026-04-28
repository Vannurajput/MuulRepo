
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { StarIcon } from './icons/StarIcon';

interface HelpModalProps {
  onClose: () => void;
  onStartTour: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, onStartTour }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-slate-800/90 rounded-2xl shadow-2xl shadow-cyan-500/20 border-2 border-cyan-400 w-full max-w-2xl p-6 md:p-8 text-left max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors z-10">
          <CloseIcon className="w-7 h-7 text-slate-300" />
        </button>

        <h1 className="text-4xl font-bold text-center text-cyan-400 drop-shadow-md mb-6">Help Center</h1>
        
        <div className="overflow-y-auto pr-4 -mr-4 text-slate-200">
            {/* Scoring Section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-600 pb-2 mb-3">
                <StarIcon className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl font-bold text-white">How Scoring Works</h2>
              </div>
              <div className="space-y-3 text-lg">
                <p>
                  Every time you play a game, you can earn a score! The score you get depends on the game and how well you play.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-slate-300">
                  <li>In fast-paced games like <strong>Critter Catcher</strong>, your score is based on how many critters you catch.</li>
                  <li>In puzzle games like <strong>Memory Match</strong> or <strong>Jigsaw Puzzles</strong>, your score is higher if you use fewer moves to solve it.</li>
                  <li>In quiz games like <strong>Math Safari</strong>, you get points for every correct answer.</li>
                </ul>
                <p>
                  Your best score for each game is saved to your profile. You can see all your high scores on the "My Scores" tab on your profile page!
                </p>
              </div>
            </div>

            {/* Trophies Section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-600 pb-2 mb-3">
                <TrophyIcon className="w-8 h-8 text-orange-400" />
                <h2 className="text-3xl font-bold text-white">How to Win Trophies</h2>
              </div>
              <div className="space-y-3 text-lg">
                <p>
                  Trophies are special awards you get for trying out different games. They show off all the fun activities you've explored!
                </p>
                <p>
                  You earn a new trophy simply by playing any game and finishing it (getting a score). For example, if you play <strong>Snake</strong> for the first time, you will unlock the Snake trophy!
                </p>
                <p>
                  You can see all the trophies you've collected on the "My Trophies" tab on your profile page. Try to collect them all!
                </p>
              </div>
            </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-600 text-center shrink-0">
            <p className="text-slate-300 mb-3">Want a tour of the app?</p>
            <button 
                onClick={onStartTour}
                className="px-8 py-4 bg-cyan-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-cyan-500/30 border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150"
            >
                Start Guided Tour
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;