

import React, { useState, useEffect } from 'react';
import WinModal from '../WinModal';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const symbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
const createShuffledDeck = () => {
  const deck = [...symbols, ...symbols];
  return deck
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

interface CardState {
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryMatchGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const shuffledDeck = createShuffledDeck();
    setCards(shuffledDeck.map(value => ({ value, isFlipped: false, isMatched: false })));
    setFlippedIndices([]);
    setMoves(0);
    setShowWinModal(false);
  };
  
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      setShowWinModal(true);
    }
  }, [cards]);

  const handleCloseModal = () => {
    setShowWinModal(false);
    const score = Math.max(0, 50 - moves);
    onGameOver(score, 'memory-match');
  };

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

    const newFlippedIndices = [...flippedIndices, index];
    
    setCards(currentCards => currentCards.map((card, i) => 
        i === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);
      const [firstIndex, secondIndex] = newFlippedIndices;
      
      // Access the cards from the state before this update for comparison
      if (cards[firstIndex].value === cards[secondIndex].value) {
        // Match
        setTimeout(() => {
            setCards(currentCards => currentCards.map((card) => {
                if (card.value === cards[firstIndex].value) {
                    return { ...card, isMatched: true };
                }
                return card;
            }));
            setFlippedIndices([]);
            setIsLocked(false);
        }, 800);
      } else {
        // No match
        setTimeout(() => {
          setCards(currentCards => currentCards.map((card, i) =>
            (i === firstIndex || i === secondIndex) ? { ...card, isFlipped: false } : card
          ));
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1200);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4">
      <div className="text-center mb-6 pt-16">
        <p className="text-2xl mt-2 text-slate-300">Moves: <span className="font-bold text-cyan-400">{moves}</span></p>
      </div>
      <div className="grid grid-cols-4 gap-3 md:gap-4" style={{ perspective: '1000px' }}>
        {cards.map((card, index) => (
          <div key={index} className="w-20 h-20 md:w-24 md:h-24" onClick={() => handleCardClick(index)}>
            <div 
              className="relative w-full h-full text-5xl transition-transform duration-700"
              style={{ transformStyle: 'preserve-3d', transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : ''}}
            >
              <div className="absolute w-full h-full rounded-lg bg-cyan-500 flex items-center justify-center cursor-pointer shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                ?
              </div>
              <div className="absolute w-full h-full rounded-lg bg-slate-700 flex items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showWinModal && (
        <WinModal
          onPlayAgain={resetGame}
          onClose={handleCloseModal}
          message={`You solved it in ${moves} moves!`}
        />
      )}
    </div>
  );
};

export default MemoryMatchGame;
