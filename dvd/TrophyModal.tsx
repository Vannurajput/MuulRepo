import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import type { Milestone } from '../types';

interface TrophyModalProps {
  trophy: Milestone;
  onClose: () => void;
}

const TrophyModal: React.FC<TrophyModalProps> = ({ trophy, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <style>{`
        @keyframes pop-and-shine {
          0% { transform: scale(0.5); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-trophy-modal {
          animation: pop-and-shine 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-30deg); }
          100% { transform: translateX(150%) skewX(-30deg); }
        }
        .shine-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,250,0) 100%);
          animation: shine 2.5s infinite;
          animation-delay: 1s;
          pointer-events: none;
        }
      `}</style>
      <div className="relative bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl shadow-teal-500/20 border-2 border-teal-400 w-full max-w-sm p-8 text-center animate-trophy-modal" role="dialog" aria-modal="true" aria-labelledby="trophy-modal-title">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 transition-colors z-10">
          <CloseIcon className="w-7 h-7 text-slate-400" />
        </button>
        
        <p className="font-bold text-teal-400 tracking-widest uppercase">Trophy Unlocked!</p>
        
        <div className="my-6 relative flex justify-center items-center">
          <div className="w-48 h-48 text-cyan-400 drop-shadow-lg">
            {trophy.icon}
          </div>
           <div className="shine-effect"></div>
        </div>
        
        <h2 id="trophy-modal-title" className="text-4xl font-bold text-white drop-shadow-md">{trophy.title}</h2>
        <p className="text-slate-300 mt-2 text-lg">{trophy.description}</p>
        
        <button
          onClick={onClose}
          className="w-full mt-8 bg-teal-500 text-white font-bold rounded-lg shadow-lg shadow-teal-500/30 border-b-4 border-teal-700 hover:bg-teal-400 active:border-b-0 active:translate-y-1 transition-all"
        >
          <span className="flex items-center justify-center p-3 text-xl">
            Awesome!
          </span>
        </button>
      </div>
    </div>
  );
};

export default TrophyModal;