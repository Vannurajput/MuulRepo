

import React, { useState, useEffect, useCallback } from 'react';
import WinModal from '../WinModal';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

interface Dot {
  id: number;
  x: number;
  y: number;
}

interface Pattern {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dots: Dot[];
}

const ALL_PATTERNS: Pattern[] = [
  {
    name: "Triangle",
    difficulty: "Easy",
    dots: [
      { id: 1, x: 50, y: 20 },
      { id: 2, x: 80, y: 80 },
      { id: 3, x: 20, y: 80 },
    ],
  },
  {
    name: "Square",
    difficulty: "Easy",
    dots: [
      { id: 1, x: 20, y: 20 },
      { id: 2, x: 80, y: 20 },
      { id: 3, x: 80, y: 80 },
      { id: 4, x: 20, y: 80 },
    ],
  },
  {
    name: "House",
    difficulty: "Medium",
    dots: [
      { id: 1, x: 20, y: 80 },
      { id: 2, x: 80, y: 80 },
      { id: 3, x: 80, y: 40 },
      { id: 4, x: 50, y: 10 },
      { id: 5, x: 20, y: 40 },
    ],
  },
  {
    name: "Star",
    difficulty: "Medium",
    dots: [
      { id: 1, x: 50, y: 15 },
      { id: 2, x: 85, y: 85 },
      { id: 3, x: 15, y: 45 },
      { id: 4, x: 85, y: 45 },
      { id: 5, x: 15, y: 85 },
    ],
  },
  {
    name: "Cat",
    difficulty: "Hard",
    dots: [
        { id: 1, x: 50, y: 20 },
        { id: 2, x: 65, y: 15 },
        { id: 3, x: 70, y: 30 },
        { id: 4, x: 75, y: 50 },
        { id: 5, x: 70, y: 70 },
        { id: 6, x: 50, y: 80 },
        { id: 7, x: 30, y: 70 },
        { id: 8, x: 25, y: 50 },
        { id: 9, x: 30, y: 30 },
        { id: 10, x: 35, y: 15 },
    ],
  },
];


const ConnectTheDotsGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [patternIndex, setPatternIndex] = useState(0);
  const [connected, setConnected] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  const currentPattern = ALL_PATTERNS[patternIndex];
  const dots = currentPattern.dots;
  const isLastPattern = patternIndex === ALL_PATTERNS.length - 1;
  
  const getDotById = useCallback((id: number): Dot | undefined => {
    return dots.find(d => d.id === id);
  }, [dots]);
  
  const resetCurrentPattern = useCallback(() => {
    setConnected([]);
    setIsComplete(false);
    setShowWinModal(false);
  }, []);

  useEffect(() => {
    resetCurrentPattern();
  }, [patternIndex, resetCurrentPattern]);

  const handleModalPlayAgain = () => {
    if (isLastPattern) {
        setPatternIndex(0);
    } else {
        setPatternIndex(i => i + 1);
    }
    resetCurrentPattern();
  };

  const handleModalClose = () => {
    setShowWinModal(false);
    const score = (patternIndex + 1) * 10;
    onGameOver(score, 'connect-the-dots');
  };

  useEffect(() => {
    if (isComplete && !showWinModal) {
      setTimeout(() => setShowWinModal(true), 500); // Small delay for final line animation
    }
  }, [isComplete, showWinModal]);

  const handleDotClick = (dotId: number) => {
    if (isComplete || connected.includes(dotId)) return;

    if (dotId === connected.length + 1) {
      const newConnected = [...connected, dotId];
      setConnected(newConnected);

      if (newConnected.length === dots.length) {
        setIsComplete(true);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-sky-50 p-4">
      <style>{
      `
        @keyframes draw-line {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
        }
        .animate-draw-line {
          animation: draw-line 0.5s ease-out forwards;
        }
      `
      }</style>
      <div className="text-center mb-4 pt-16">
        <p className="text-2xl font-bold text-cyan-600 mt-2">{`Level ${patternIndex + 1}: ${currentPattern.name} (${currentPattern.difficulty})`}</p>
        <p className="text-lg text-gray-600 mt-1">Click the dots in order from 1 to {dots.length}!</p>
      </div>

      <div className="w-full max-w-lg aspect-square bg-white rounded-2xl shadow-lg relative">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Draw connected lines */}
          {connected.length > 1 &&
            connected.slice(1).map((dotId, index) => {
              const fromDot = getDotById(connected[index]);
              const toDot = getDotById(dotId);
              if (!fromDot || !toDot) return null;
              return (
                <line
                  key={index}
                  x1={fromDot.x} y1={fromDot.y}
                  x2={toDot.x} y2={toDot.y}
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
            
          {/* Draw final closing line on complete */}
          {isComplete && (() => {
            const fromDot = getDotById(dots.length);
            const toDot = getDotById(1);
            if (!fromDot || !toDot) return null;
            return (
                <line
                  x1={fromDot.x} y1={fromDot.y}
                  x2={toDot.x} y2={toDot.y}
                  stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" className="animate-draw-line"
                />
            )
          })()}
        </svg>

        {/* Render dots on top */}
        {dots.map(dot => (
          <div
            key={dot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
          >
            <button
              onClick={() => handleDotClick(dot.id)}
              disabled={isComplete || connected.includes(dot.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all
                ${connected.includes(dot.id) ? 'bg-cyan-500 cursor-default' : 'bg-sky-500 hover:bg-sky-600'}
                ${isComplete ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              {dot.id}
            </button>
          </div>
        ))}
      </div>
      
      {isComplete && !showWinModal && (
        <div className="mt-4 text-4xl text-green-500 font-bold animate-pulse">
          Great Job!
        </div>
      )}

      {showWinModal && (
        <WinModal
            onPlayAgain={handleModalPlayAgain}
            onClose={handleModalClose}
            title={`Level ${patternIndex + 1} Complete!`}
            message={isLastPattern ? "You've completed all the patterns! 🎉" : "You revealed the hidden picture!"}
        />
      )}
    </div>
  );
};

export default ConnectTheDotsGame;
