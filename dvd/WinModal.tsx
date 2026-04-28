
import React from 'react';
import { ReplayIcon } from './icons/ReplayIcon';
import { CloseIcon } from './icons/CloseIcon';

interface WinModalProps {
  onPlayAgain: () => void;
  onClose: () => void;
  title?: string;
  message?: string;
  playAgainText?: string;
}

const WinModal: React.FC<WinModalProps> = ({ 
  onPlayAgain, 
  onClose,
  title = "You Win!",
  message = "Great job! You've completed the game.",
  playAgainText,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-cyan-500/20 border-2 border-cyan-400 w-full max-w-sm p-8 text-center" role="dialog" aria-modal="true" aria-labelledby="win-modal-title">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors z-10">
          <CloseIcon className="w-7 h-7 text-slate-400" />
        </button>
        
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl animate-bounce">🎉</div>
        <div className="absolute top-0 left-4 text-4xl transform -rotate-12 animate-pulse text-teal-400">🎊</div>
        <div className="absolute top-0 right-4 text-4xl transform rotate-12 animate-pulse [animation-delay:500ms] text-slate-100">🎉</div>
        
        <h2 id="win-modal-title" className="text-5xl font-bold text-cyan-400 drop-shadow-lg mt-4">{title}</h2>
        <p className="text-slate-200 mt-2 text-lg">{message}</p>
        
        <button
          onClick={onPlayAgain}
          className="w-full mt-8 bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-500/30 border-b-4 border-teal-700 hover:bg-teal-400 active:border-b-0 active:translate-y-1 transition-all duration-150 ease-in-out"
        >
          <span className="flex items-center justify-center p-3">
            <ReplayIcon className="w-7 h-7" />
            <span className="ml-3 text-xl">{playAgainText ?? 'Play Again'}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default WinModal;
