

import React, { useState, useEffect, useCallback } from 'react';
import WinModal from '../WinModal';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

interface Question {
  sound: string;
  answer: string;
  options: string[];
}

const ALL_QUESTIONS: Question[] = [
  { sound: "Moo!", answer: "Cow", options: ["Cow", "Dog", "Cat", "Duck"] },
  { sound: "Woof!", answer: "Dog", options: ["Pig", "Dog", "Lion", "Sheep"] },
  { sound: "Meow!", answer: "Cat", options: ["Horse", "Chicken", "Cat", "Frog"] },
  { sound: "Oink!", answer: "Pig", options: ["Pig", "Cow", "Elephant", "Monkey"] },
  { sound: "Quack!", answer: "Duck", options: ["Rooster", "Duck", "Snake", "Bear"] },
  { sound: "Baa!", answer: "Sheep", options: ["Goat", "Cat", "Sheep", "Horse"] },
  { sound: "Hiss!", answer: "Snake", options: ["Snake", "Fish", "Bird", "Dog"] },
  { sound: "Roar!", answer: "Lion", options: ["Tiger", "Lion", "Bear", "Wolf"] },
];

const WhatsThatSoundGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showWinModal, setShowWinModal] = useState(false);

  const resetGame = useCallback(() => {
    setQuestions(ALL_QUESTIONS.sort(() => 0.5 - Math.random()));
    setCurrentQuestionIndex(0);
    setScore(0);
    setFeedback('');
    setShowWinModal(false);
  }, []);

  useEffect(() => {
    // Shuffle questions on game start
    resetGame();
  }, [resetGame]);

  const handleCloseModal = () => {
    onGameOver(score, 'whats-that-sound');
    setShowWinModal(false);
  };

  const handleAnswer = (option: string) => {
    if (feedback) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    let isCorrect = option === currentQuestion.answer;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong! It was a ${currentQuestion.answer}.`);
    }

    setTimeout(() => {
      setFeedback('');
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        // Game over
        setShowWinModal(true);
      }
    }, 1500);
  };
  
  if (questions.length === 0) {
    return <div>Loading...</div>;
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 p-4">
      <div className="text-center mb-6 pt-16">
        <p className="text-2xl mt-2 text-violet-600">Score: <span className="font-bold text-cyan-500">{score}</span></p>
      </div>

      <div className="w-full max-w-lg bg-white/80 rounded-2xl shadow-lg p-8">
        <p className="text-center text-xl text-gray-600 mb-4">The animal says...</p>
        <p className="text-center text-8xl font-bold text-teal-600 mb-8">"{currentQuestion.sound}"</p>

        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.sort(() => 0.5 - Math.random()).map(option => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={!!feedback || showWinModal}
              className="p-6 bg-cyan-500 text-white text-3xl font-bold rounded-lg shadow-md hover:bg-cyan-600 transition disabled:opacity-70"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      {feedback && !showWinModal && (
         <div className="mt-6 text-3xl font-bold text-violet-700 animate-pulse">{feedback}</div>
      )}
      {showWinModal && (
        <WinModal
          onPlayAgain={resetGame}
          onClose={handleCloseModal}
          message={`You got ${score} out of ${questions.length} sounds right!`}
        />
      )}
    </div>
  );
};

export default WhatsThatSoundGame;
