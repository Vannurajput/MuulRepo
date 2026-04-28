

import React, { useState, useEffect, useCallback } from 'react';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const COLORS: { [name: string]: string } = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#eab308',
  Orange: '#f97316',
  Purple: '#a855f7',
  Lime: '#84cc16',
};

const COLOR_NAMES = Object.keys(COLORS);

const ColorMatchGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetWord, setTargetWord] = useState('');
  const [displayColor, setDisplayColor] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);

  const generateRound = useCallback(() => {
    // Select the target color name and its hex value
    const newTargetWord = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    setTargetWord(newTargetWord);
    
    // Select a different color for the text display
    let newDisplayColor;
    do {
      newDisplayColor = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    } while (newDisplayColor === newTargetWord);
    setDisplayColor(COLORS[newDisplayColor]);

    // Create shuffled options
    const otherColors = COLOR_NAMES.filter(c => c !== newTargetWord);
    const shuffledOthers = otherColors.sort(() => 0.5 - Math.random());
    const newOptions = [newTargetWord, ...shuffledOthers.slice(0, 3)].sort(() => 0.5 - Math.random());
    setOptions(newOptions);
  }, []);

  useEffect(() => {
    generateRound();
  }, [generateRound]);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isGameOver) { // Prevent multiple calls
        setIsGameOver(true);
        setTimeout(() => onGameOver(score, 'color-match'), 1500);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, onGameOver, isGameOver]);

  const handleOptionClick = (optionName: string) => {
    if (isGameOver || feedback) return;

    if (optionName === targetWord) {
      setScore(s => s + 1);
      setTimeLeft(t => t + 1);
      setFeedback({ text: 'Correct!', type: 'correct' });
    } else {
      setTimeLeft(t => Math.max(0, t - 3));
      setFeedback({ text: 'Wrong!', type: 'wrong' });
    }
    
    setTimeout(() => {
      setFeedback(null);
      generateRound();
    }, 1200);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-4 relative overflow-hidden">
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-pop-in { animation: pop-in 0.4s ease-out forwards; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>

      <div className="text-center mb-6 z-10 pt-16">
        <div className="flex justify-around w-full max-w-xs mt-4 text-2xl">
          <p>Score: <span className="font-bold text-cyan-400">{score}</span></p>
          <p>Time: <span className="font-bold text-yellow-400">{timeLeft}s</span></p>
        </div>
      </div>
      
      {isGameOver ? (
        <div className="text-5xl font-bold text-red-500 animate-pulse z-10">GAME OVER</div>
      ) : (
        <div className="flex flex-col items-center z-10">
            <p className="mb-4 text-2xl">Click the button with the color matching the word:</p>
            <div className="text-7xl font-bold mb-8 drop-shadow-lg" style={{ color: displayColor }}>
              {targetWord}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {options.map(name => (
                <button
                  key={name}
                  onClick={() => handleOptionClick(name)}
                  className="w-40 h-20 rounded-lg shadow-lg text-2xl font-bold text-white transition-transform transform hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: COLORS[name] }}
                  disabled={!!feedback}
                >
                  {name}
                </button>
              ))}
            </div>
        </div>
      )}

      {feedback && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 animate-fade-in">
          <div
            className={`flex items-center gap-4 p-6 rounded-2xl shadow-2xl text-white font-bold text-5xl animate-pop-in
              ${feedback.type === 'correct' ? 'bg-green-500' : 'bg-red-500'}
            `}
          >
            {feedback.type === 'correct' && <span className="text-6xl">🎉</span>}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorMatchGame;
