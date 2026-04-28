


import React, { useState, useEffect, useCallback } from 'react';
import { HeartIcon } from '../icons/HeartIcon';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  rotation: number;
}

const StarIcon: React.FC<{ size: number, rotation: number }> = ({ size, rotation }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ transform: `rotate(${rotation}deg)`}}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const CountTheStarsGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [stars, setStars] = useState<Star[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [answer, setAnswer] = useState(0);
  const [feedback, setFeedback] = useState('');

  const generateRound = useCallback(() => {
    // Difficulty scales slightly with score
    const starCount = Math.floor(Math.random() * 10) + 5 + Math.floor(score / 5);
    setAnswer(starCount);

    const newStars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        id: i,
        top: Math.random() * 85 + 5,
        left: Math.random() * 85 + 5,
        size: Math.random() * 30 + 20,
        rotation: Math.random() * 360,
      });
    }
    setStars(newStars);

    const newOptions = new Set<number>([starCount]);
    while (newOptions.size < 4) {
      const wrongAnswer = starCount + Math.floor(Math.random() * 7) - 3;
      if (wrongAnswer > 0 && wrongAnswer !== starCount) {
        newOptions.add(wrongAnswer);
      }
    }
    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
  }, [score]);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => onGameOver(score, 'count-the-stars'), 1500);
    }
  }, [lives, score, onGameOver]);
  
  const handleAnswer = (option: number) => {
    if (feedback) return;
    if (option === answer) {
      setScore(s => s + 1);
      setFeedback('Correct!');
    } else {
      setLives(l => l - 1);
      setFeedback(`Oops! The answer was ${answer}.`);
    }

    setTimeout(() => {
      setFeedback('');
      if (lives > 1 || option === answer) {
        generateRound();
      }
    }, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-transparent text-cyan-300 p-2 sm:p-4 overflow-hidden">
      <div className="w-full flex justify-between items-center pl-16 sm:pl-20 pr-2 sm:pr-4 z-10">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 border border-slate-600/50">
          <p className="text-xl sm:text-2xl text-slate-200">Score: <span className="font-bold text-cyan-400">{score}</span></p>
        </div>
        <div className="flex items-center bg-slate-800/60 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-2 border border-slate-600/50 gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <HeartIcon key={i} className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 drop-shadow-lg" />
          ))}
        </div>
      </div>
      
      <div className="w-full flex-grow my-2 sm:my-4 flex items-center justify-center">
        <div className="relative w-full max-w-3xl h-full">
            {stars.map(star => (
            <div key={star.id} className="absolute animate-fade-in" style={{ top: `${star.top}%`, left: `${star.left}%` }}>
                <StarIcon size={star.size} rotation={star.rotation} />
            </div>
            ))}
        </div>
      </div>
      
      <div className="shrink-0 h-40 sm:h-48 flex flex-col items-center justify-center">
        {lives > 0 && !feedback && (
            <div className="text-center">
                <p className="text-white text-xl sm:text-2xl md:text-3xl mb-4">How many stars do you see?</p>
                <div className="flex gap-2 sm:gap-4">
                    {options.map(option => (
                        <button 
                            key={option}
                            onClick={() => handleAnswer(option)}
                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-cyan-600 text-white text-3xl sm:text-4xl md:text-5xl font-bold rounded-full shadow-lg hover:bg-cyan-700 transition-transform active:scale-95"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {feedback && <p className="text-white text-3xl sm:text-4xl font-bold animate-pulse">{feedback}</p>}
        {lives <= 0 && <p className="text-red-500 text-4xl sm:text-6xl font-bold animate-pulse">GAME OVER</p>}
      </div>

    </div>
  );
};

export default CountTheStarsGame;