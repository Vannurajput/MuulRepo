

import React, { useState, useEffect, useCallback } from 'react';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const SHAPES = {
  Circle: (props: any) => <svg {...props} viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="currentColor"/></svg>,
  Square: (props: any) => <svg {...props} viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="currentColor"/></svg>,
  Triangle: (props: any) => <svg {...props} viewBox="0 0 100 100"><path d="M50 5 L95 95 H5 Z" fill="currentColor"/></svg>,
  Star: (props: any) => <svg {...props} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>,
  Heart: (props: any) => <svg {...props} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>,
};

const SHAPE_NAMES = Object.keys(SHAPES);
const COLORS = ['#d946ef', '#22d3ee', '#34d399', '#facc15', '#f87171'];

const ShapeMatchGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetName, setTargetName] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  const generateRound = useCallback(() => {
    const correctShape = SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)];
    setTargetName(correctShape);
    
    const wrongShapes = SHAPE_NAMES.filter(name => name !== correctShape);
    const shuffledWrongs = wrongShapes.sort(() => 0.5 - Math.random());
    
    const newOptions = [correctShape, ...shuffledWrongs.slice(0, 3)].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
  }, []);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => onGameOver(score, 'shape-match'), 1500);
    }
  }, [lives, score, onGameOver]);

  const handleSelect = (shapeName: string) => {
    if (lives <= 0) return;
    if (shapeName === targetName) {
      setScore(s => s + 1);
      generateRound();
    } else {
      setLives(l => l - 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4">
      <div className="text-center mb-8 pt-16">
        <div className="flex justify-around w-full max-w-xs mt-4 text-2xl">
          <p className="text-slate-200">Score: <span className="font-bold text-fuchsia-400">{score}</span></p>
          <p className="text-slate-200">Lives: <span className="font-bold text-red-500">{lives}</span></p>
        </div>
      </div>
      
      {lives > 0 ? (
        <div className="flex flex-col items-center">
            <p className="text-3xl text-slate-300 mb-4">Find the:</p>
            <p className="text-6xl font-bold text-cyan-400 mb-8 drop-shadow-lg">{targetName}</p>
            <div className="grid grid-cols-2 gap-6">
                {options.map((name, index) => {
                    const ShapeComponent = SHAPES[name as keyof typeof SHAPES];
                    const color = COLORS[index % COLORS.length];
                    return (
                        <button key={name} onClick={() => handleSelect(name)} className="w-36 h-36 bg-slate-800/80 rounded-2xl shadow-lg p-4 flex items-center justify-center border-2 border-slate-700 hover:border-cyan-400 transition-all hover:-translate-y-2">
                           <ShapeComponent className="w-full h-full" style={{color}} />
                        </button>
                    )
                })}
            </div>
        </div>
      ) : (
        <div className="text-6xl font-bold text-red-500 animate-pulse">GAME OVER</div>
      )}
    </div>
  );
};

export default ShapeMatchGame;
