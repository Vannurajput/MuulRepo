

import React, { useState, useEffect, useCallback } from 'react';
import { HeartIcon } from '../icons/HeartIcon';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const MathSafariGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState<{ text: string, answer: number } | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' } | null>(null);

  const generateQuestion = useCallback(() => {
    const isAddition = Math.random() > 0.5;
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;

    if (!isAddition && num1 < num2) {
      [num1, num2] = [num2, num1]; // Ensure result is not negative
    }

    const answer = isAddition ? num1 + num2 : num1 - num2;
    const text = `${num1} ${isAddition ? '+' : '−'} ${num2} = ?`;

    const newOptions = new Set<number>([answer]);
    while (newOptions.size < 4) {
      const wrongAnswer = answer + Math.floor(Math.random() * 9) - 4;
      if (wrongAnswer !== answer && wrongAnswer >= 0) {
        newOptions.add(wrongAnswer);
      }
    }

    setQuestion({ text, answer });
    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
  }, []);
  
  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);
  
  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => onGameOver(score, 'math-safari'), 1500);
    }
  }, [lives, onGameOver, score]);

  const handleAnswer = (option: number) => {
    if (feedback) return; // Prevent clicking while feedback is shown

    if (option === question?.answer) {
      setScore(s => s + 10);
      setFeedback({ text: 'Correct!', type: 'correct' });
    } else {
      setLives(l => l - 1);
      setFeedback({ text: 'Wrong!', type: 'wrong' });
    }

    setTimeout(() => {
      setFeedback(null);
      if (lives > 1 || option === question?.answer) {
        generateQuestion();
      }
    }, 1200);
  };
  
  const getButtonClass = (option: number) => {
    if(!feedback) return 'bg-cyan-500 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1';
    if(option === question?.answer) return 'bg-green-500 border-green-700 scale-110';
    return 'bg-red-500 border-red-700 opacity-70';
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4 relative overflow-hidden">
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

      <div className="absolute top-4 left-4 right-4 pl-16 flex justify-between items-center z-10">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-600/50">
          <p className="text-3xl text-slate-200">Score: <span className="font-bold text-cyan-400">{score}</span></p>
        </div>
        <div className="flex items-center bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-600/50">
          {Array.from({ length: lives }).map((_, i) => (
            <HeartIcon key={i} className="w-10 h-10 text-red-500 drop-shadow-lg" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md text-center">
        {lives > 0 && question && (
          <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-2 border-slate-700">
            <p className="text-7xl font-bold text-white mb-8 drop-shadow-md">{question.text}</p>
            <div className="grid grid-cols-2 gap-4">
              {options.map(option => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={!!feedback}
                  className={`p-6 text-white text-5xl font-bold rounded-lg shadow-md border-b-4 transition-all duration-300 ${getButtonClass(option)}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {lives <= 0 && (
           <div className="text-6xl font-bold text-red-500 animate-pulse">GAME OVER</div>
        )}
      </div>
      {feedback && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 animate-fade-in">
          <div
            className={`flex items-center gap-4 p-6 rounded-2xl shadow-2xl text-white font-bold text-5xl animate-pop-in
              ${feedback.type === 'correct' ? 'bg-green-500/90' : 'bg-red-500/90'}
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

export default MathSafariGame;