import React, { useState } from 'react';
import QuitModal from './components/QuitModal';
import { HomeIcon } from './components/icons/HomeIcon';

interface GameWrapperProps {
  onGoHome: () => void;
  children: React.ReactNode;
  gameId: string;
  onGameOver: (score: number, gameId: string) => void;
}

const GameWrapper: React.FC<GameWrapperProps> = ({ onGoHome, children, gameId, onGameOver }) => {
  const [showQuitModal, setShowQuitModal] = useState(false);

  const handleExit = () => {
    // For sandbox games without an "end", this ensures the "played" trophy is awarded on exit.
    // The score of 1 is just a placeholder to meet the condition.
    onGameOver(1, gameId); 
    onGoHome();
  };

  return (
    <div className="relative w-full h-full bg-slate-800">
      <button 
        onClick={() => setShowQuitModal(true)}
        className="absolute top-4 left-4 z-20 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
        aria-label="Quit to main menu"
      >
        <HomeIcon className="w-8 h-8 text-white" />
      </button>

      <main className="w-full h-full">{children}</main>

      {showQuitModal && (
        <QuitModal 
          onClose={() => setShowQuitModal(false)}
          onExit={handleExit}
        />
      )}
    </div>
  );
};

export default GameWrapper;