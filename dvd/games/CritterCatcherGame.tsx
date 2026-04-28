import React, { useState, useEffect } from 'react';
import { useGameLogic } from '../../hooks/useGameLogic';
import HUD from '../HUD';
import Critter from '../Critter';
import { ScoreEntry } from '../../types';
import { CritterIcon } from '../icons/CritterIcon';
import QuitModal from '../QuitModal';
import { CloseIcon } from '../icons/CloseIcon';
import { BackIcon } from '../icons/BackIcon';

interface CritterCatcherGameProps {
  onGameOver: (score: number) => void;
}

const CritterCatcherGame: React.FC<CritterCatcherGameProps> = ({ onGameOver }) => {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | null>(null);
  const [highScore, setHighScore] = useState(0);

  // Load high score when returning to the difficulty selection menu
  useEffect(() => {
    if (difficulty === null) {
      try {
        const allScoresRaw = localStorage.getItem('scores');
        if (allScoresRaw) {
          const allScores: ScoreEntry[] = JSON.parse(allScoresRaw);
          const gameScores = allScores
            .filter(s => s.game === 'Critter Catcher')
            .map(s => s.score);
          if (gameScores.length > 0) {
            setHighScore(Math.max(0, ...gameScores));
          }
        }
      } catch (e) {
        console.error("Failed to load high score for Critter Catcher:", e);
      }
    }
  }, [difficulty]);

  // If no difficulty is selected, show the selection menu.
  if (!difficulty) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4 text-white animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-24 h-24 text-cyan-400 drop-shadow-lg"><CritterIcon/></div>
          <div>
            <h1 className="text-5xl font-bold">Critter Catcher</h1>
            <p className="text-slate-300 text-lg">High Score: <span className="font-bold text-yellow-400">{highScore}</span></p>
          </div>
        </div>

        <h2 className="text-3xl font-semibold mt-4 mb-6">Choose a Level</h2>

        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={() => setDifficulty('Easy')} 
            className="w-48 py-4 text-2xl font-bold text-white bg-green-500 rounded-2xl shadow-lg border-b-4 border-green-700 hover:bg-green-400 transition-all active:translate-y-1 active:border-b-0"
          >
            Easy
          </button>
          <button 
            onClick={() => setDifficulty('Medium')} 
            className="w-48 py-4 text-2xl font-bold text-white bg-cyan-500 rounded-2xl shadow-lg border-b-4 border-cyan-700 hover:bg-cyan-400 transition-all active:translate-y-1 active:border-b-0"
          >
            Medium
          </button>
          <button 
            onClick={() => setDifficulty('Hard')} 
            className="w-48 py-4 text-2xl font-bold text-white bg-red-500 rounded-2xl shadow-lg border-b-4 border-red-700 hover:bg-red-400 transition-all active:translate-y-1 active:border-b-0"
          >
            Hard
          </button>
        </div>
      </div>
    );
  }

  // If a difficulty is selected, render the game.
  // We use a key to force a re-mount of the GameInstance component when difficulty changes,
  // which cleanly resets the game state within useGameLogic.
  return <GameInstance key={difficulty} difficulty={difficulty} onGameOver={onGameOver} onGoBack={() => setDifficulty(null)} />;
};

// This component holds the actual game logic and state.
const GameInstance: React.FC<{ 
  difficulty: 'Easy' | 'Medium' | 'Hard', 
  onGameOver: (score: number) => void,
  onGoBack: () => void 
}> = ({ difficulty, onGameOver, onGoBack }) => {
  const { score, lives, critters, catchCritter, isGameOver } = useGameLogic(onGameOver, difficulty);
  const [showQuitModal, setShowQuitModal] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-800/50">
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button 
          onClick={onGoBack}
          className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Back to level selection"
        >
          <BackIcon className="w-8 h-8 text-white" />
        </button>
        <button 
          onClick={() => setShowQuitModal(true)}
          className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
          aria-label="Quit to main menu"
        >
          <CloseIcon className="w-8 h-8 text-white" />
        </button>
      </div>
      
      <HUD score={score} lives={lives} />

      <div className="absolute inset-0">
        {critters.map(critter => (
          <Critter
            key={critter.id}
            critter={critter}
            onPointerDown={() => catchCritter(critter.id)}
          />
        ))}
      </div>
      {isGameOver && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20" />
      )}
      {showQuitModal && (
        <QuitModal 
          onClose={() => setShowQuitModal(false)}
          onExit={() => onGameOver(-1)}
        />
      )}
    </div>
  );
};


export default CritterCatcherGame;