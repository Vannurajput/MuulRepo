
import React, { useState, useEffect } from 'react';
import WinModal from '../WinModal';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const TOTAL_SPACES = 25;

const LudoGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [position, setPosition] = useState(0);
  const [dice, setDice] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  const resetGame = () => {
    setPosition(0);
    setDice(0);
    setIsRolling(false);
    setIsWinner(false);
    setShowWinModal(false);
  };

  const rollDice = () => {
    if (isRolling || isWinner) return;
    setIsRolling(true);
    const rollValue = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDice(rollValue);
      setIsRolling(false);
      setPosition(prev => {
        const newPosition = prev + rollValue;
        if (newPosition >= TOTAL_SPACES) {
          setIsWinner(true);
          return TOTAL_SPACES;
        }
        return newPosition;
      });
    }, 1000);
  };

  useEffect(() => {
    if (isWinner && !showWinModal) {
      setShowWinModal(true);
    }
  }, [isWinner, showWinModal]);

  const handleCloseModal = () => {
    setShowWinModal(false);
    onGameOver(position, 'ludo');
  };

  const renderSpace = (i: number) => {
    const isOccupied = position === i;
    const isStart = i === 0;
    const isEnd = i === TOTAL_SPACES;
    
    let bgColor = 'bg-gray-300';
    if (i % 4 === 0) bgColor = 'bg-red-300';
    if (i % 4 === 1) bgColor = 'bg-blue-300';
    if (i % 4 === 2) bgColor = 'bg-yellow-300';
    if (i % 4 === 3) bgColor = 'bg-green-300';
    if(isStart) bgColor = 'bg-gray-500';
    if(isEnd) bgColor = 'bg-emerald-500';

    return (
      <div key={i} className={`w-12 h-12 md:w-16 md:h-16 border-2 border-gray-600 flex items-center justify-center ${bgColor}`}>
        {isOccupied && <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg animate-bounce" />}
        {isEnd && <span className="text-2xl">🏆</span>}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-violet-50 p-4">
      <h1 className="text-4xl font-bold text-violet-800 mb-4">Ludo Race</h1>
      {isWinner && !showWinModal && <p className="text-3xl font-bold text-emerald-500 animate-pulse mb-4">You Win!</p>}
      
      <div className="flex flex-wrap w-full max-w-sm justify-center gap-1 my-4">
        {Array.from({ length: TOTAL_SPACES + 1 }).map((_, i) => renderSpace(i))}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className={`w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-6xl font-bold text-violet-700 mb-4 ${isRolling ? 'animate-spin' : ''}`}>
          {isRolling ? '🎲' : dice || '🎲'}
        </div>
        <button
          onClick={rollDice}
          disabled={isRolling || isWinner}
          className="px-8 py-4 bg-emerald-500 text-white font-bold text-2xl rounded-lg shadow-lg hover:bg-emerald-600 transition-transform transform hover:scale-105 disabled:bg-slate-400"
        >
          {isWinner ? 'Winner!' : isRolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>

      {showWinModal && (
        <WinModal
          onPlayAgain={resetGame}
          onClose={handleCloseModal}
          message="You finished the race first!"
        />
      )}
    </div>
  );
};

export default LudoGame;