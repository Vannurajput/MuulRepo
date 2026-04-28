


import React, { useState, useEffect, useCallback } from 'react';
import WinModal from '../WinModal';
import { BackIcon } from '../icons/BackIcon';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

// --- Data Structures ---
interface Puzzle {
  id: string;
  name: string;
  src: string;
  grid: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Animals' | 'Fruits' | 'Vehicles' | 'Space';
}

interface Piece {
  id: number; // The piece's original index (0 to N-1)
  shuffledIndex: number; // The piece's initial shuffled position
}

const PUZZLES: Puzzle[] = [
  // Easy (2x2)
  { id: 'fruit_easy', name: 'Apples & Oranges', src: '/images/puzzles/fruit_cover.png', grid: 2, difficulty: 'Easy', category: 'Fruits' },
  { id: 'animal_easy', name: 'Cute Critter', src: '/images/puzzles/animal.png', grid: 2, difficulty: 'Easy', category: 'Animals' },
  { id: 'car_easy', name: 'Red Car', src: '/images/puzzles/car.png', grid: 2, difficulty: 'Easy', category: 'Vehicles' },
  { id: 'rocket_easy', name: 'My First Rocket', src: '/images/puzzles/rocket.png', grid: 2, difficulty: 'Easy', category: 'Space' },

  // Medium (3x3)
  { id: 'fruit_medium', name: 'Fruit Basket', src: '/images/puzzles/fruit.png', grid: 3, difficulty: 'Medium', category: 'Fruits' },
  { id: 'animal_medium', name: 'Friendly Fox', src: '/images/puzzles/animal.png', grid: 3, difficulty: 'Medium', category: 'Animals' },
  { id: 'car_medium', name: 'Red Racer', src: '/images/puzzles/car.png', grid: 3, difficulty: 'Medium', category: 'Vehicles' },
  { id: 'rocket_medium', name: 'Galaxy Explorer', src: '/images/puzzles/rocket.png', grid: 3, difficulty: 'Medium', category: 'Space' },
  { id: 'critter_medium', name: 'Critter Catcher', src: '/images/critter-catcher.png', grid: 3, difficulty: 'Medium', category: 'Animals' },
  { id: 'memory_medium', name: 'Memory Friends', src: '/images/memory-match.png', grid: 3, difficulty: 'Medium', category: 'Animals' },
  { id: 'palace_medium', name: 'Puzzle Palace', src: '/images/puzzle-palace.png', grid: 3, difficulty: 'Medium', category: 'Animals' },

  // Hard (4x4)
  { id: 'fruit_hard', name: 'Fruit Feast', src: '/images/puzzles/fruit.png', grid: 4, difficulty: 'Hard', category: 'Fruits' },
  { id: 'animal_hard', name: 'Forest Challenge', src: '/images/puzzles/animal.png', grid: 4, difficulty: 'Hard', category: 'Animals' },
  { id: 'car_hard', name: 'Racing Champion', src: '/images/puzzles/car.png', grid: 4, difficulty: 'Hard', category: 'Vehicles' },
  { id: 'rocket_hard', name: 'Cosmic Voyage', src: '/images/puzzles/rocket.png', grid: 4, difficulty: 'Hard', category: 'Space' },
  { id: 'critter_hard', name: 'Critter Invasion', src: '/images/critter-catcher.png', grid: 4, difficulty: 'Hard', category: 'Animals' },
  { id: 'memory_hard', name: 'Total Recall', src: '/images/memory-match.png', grid: 4, difficulty: 'Hard', category: 'Animals' },
  { id: 'palace_hard', name: 'Palace Masterpiece', src: '/images/puzzle-palace.png', grid: 4, difficulty: 'Hard', category: 'Animals' },
];

const DIFFICULTIES: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

const CATEGORY_STYLES: { [key: string]: { text: string, iconColor: string } } = {
    Animals: { text: 'text-orange-800', iconColor: 'text-orange-500' },
    Fruits: { text: 'text-rose-800', iconColor: 'text-rose-500' },
    Vehicles: { text: 'text-sky-800', iconColor: 'text-sky-500' },
    Space: { text: 'text-indigo-800', iconColor: 'text-indigo-500' },
};

const DIFFICULTY_STYLES: { [key: string]: string } = {
    Easy: 'bg-green-200 text-green-800',
    Medium: 'bg-sky-200 text-sky-800',
    Hard: 'bg-red-200 text-red-800'
}

// --- Icons ---
const AnimalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M21.7,13.37C21.43,12.5,20.5,12,19.5,12h-2.34C16.9,11.2,16.22,10.6,15.42,10.28 c0.54-0.57,0.88-1.34,0.88-2.2c0-1.77-1.43-3.2-3.2-3.2S9.9,6.31,9.9,8.08c0,0.86,0.34,1.63,0.88,2.2 C10.02,10.6,9.34,11.2,9.08,12H6.5c-1,0-1.93,0.5-2.2,1.37L2,20h20L21.7,13.37z M7.5,15C7.22,15,7,14.78,7,14.5S7.22,14,7.5,14 s0.5,0.22,0.5,0.5S7.78,15,7.5,15z M16.5,15c-0.28,0-0.5-0.22-0.5-0.5s0.22-0.5,0.5-0.5s0.5,0.22,0.5,0.5S16.78,15,16.5,15z"/></svg>
);
const FruitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M19,13.5c0,3.59-2.91,6.5-6.5,6.5S6,17.09,6,13.5C6,10.7,7.8,8.41,10.19,7.53C10.65,5.1,12.78,3.23,15.3,3.05 C17.49,4.24,19,6.34,19,8.81C19,8.88,19,8.94,19,9C20.66,9,22,10.34,22,12S20.66,15,19,15V13.5z M10.11,5.11 C10.15,5.1,10.19,5.09,10.24,5.09c0.8,0,1.52,0.34,2.02,0.92C11.39,6.66,10.51,7.8,10.11,9.06C8.28,9.85,7,11.51,7,13.5 c0,0.17,0.02,0.34,0.05,0.5C5.88,13.4,5,11.83,5,10C5,7.85,6.29,6.04,8.11,5.11H10.11z"/></svg>
);
const VehicleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.92,6.01C18.72,5.42,18.16,5,17.5,5h-11C5.84,5,5.28,5.42,5.08,6.01L3,12v8c0,0.55,0.45,1,1,1h1c0.55,0,1-0.45,1-1v-1 h12v1c0,0.55,0.45,1,1,1h1c0.55,0,1-0.45,1-1v-8L18.92,6.01z M6.5,16C5.67,16,5,15.33,5,14.5S5.67,13,6.5,13S8,13.67,8,14.5 S7.33,16,6.5,16z M17.5,16c-0.83,0-1.5-0.67-1.5-1.5s1.67-1.5,1.75-1.5s1.5,0.67,1.5,1.5S18.33,16,17.5,16z M5,11l1.5-4.5h11L19,11 H5z"/></svg>
);
const SpaceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M15.58,15.21L14.4,14.03C15.42,12.5,16,10.62,16,8.5C16,3.81,12.19,0,7.5,0S-1,3.81-1,8.5c0,3.54,2.21,6.55,5.28,7.78 l-1.18,1.18C-0.08,16.28-2,14.06-2,11.5c0-5.25,4.25-9.5,9.5-9.5s9.5,4.25,9.5,9.5C17,13.25,16.51,14.32,15.82,15.21z M19.46,14.15 c-1.3-0.54-2.61-0.85-3.96-0.85c-1.28,0-2.5,0.28-3.65,0.76l1.49,1.49C14.08,15.24,14.8,15,15.5,15c1.07,0,2.09,0.21,3.04,0.61 l2.88,1.23l1.19-2.78L19.46,14.15z M11.15,15.71c-0.56,0.23-1.15,0.42-1.78,0.54L11,17.89l-1.42,1.42l-1.64-3.82l3.82,1.64 l-1.42,1.42L8.6,17.01c0.01-0.01,0.01-0.01,0.01-0.02c0.2-1.13,0.64-2.18,1.27-3.11l1.27,1.27C11.16,15.35,11.15,15.53,11.15,15.71z"/></svg>
);
const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg>
);

const CategoryIcons: { [key: string]: React.FC<any> } = {
  Animals: AnimalIcon,
  Fruits: FruitIcon,
  Vehicles: VehicleIcon,
  Space: SpaceIcon,
};


// --- Puzzle Piece Component ---
const PuzzlePiece: React.FC<{
  puzzle: Puzzle;
  piece: Piece;
  isPlaced: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>, piece: Piece) => void;
  isSelected: boolean;
  className?: string;
}> = ({ puzzle, piece, isPlaced, onClick, isSelected, className = '' }) => {
  const { grid, src } = puzzle;
  const row = Math.floor(piece.id / grid);
  const col = piece.id % grid;

  return (
    <div
      onClick={(e) => !isPlaced && onClick(e, piece)}
      className={`relative w-full h-full rounded-md overflow-hidden transition-all duration-200 ${!isPlaced ? 'cursor-pointer shadow-lg hover:scale-105' : ''} ${isSelected ? 'ring-4 ring-cyan-400 scale-105 shadow-cyan-400/50' : ''} ${className}`}
      aria-label={`Puzzle piece ${piece.id + 1}`}
    >
        <img
            src={src}
            alt="" // Decorative image
            draggable={false}
            className="absolute"
            style={{
                width: `${grid * 100}%`,
                height: `${grid * 100}%`,
                left: `-${col * 100}%`,
                top: `-${row * 100}%`,
                maxWidth: 'none',
                maxHeight: 'none',
                pointerEvents: 'none',
            }}
        />
    </div>
  );
};


// --- Main Game Component ---
const JigsawPuzzleGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [gameState, setGameState] = useState<'select' | 'playing' | 'completed'>('select');
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [board, setBoard] = useState<(Piece | null)[]>([]);
  const [moves, setMoves] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  
  const showTemporaryFeedback = (message: string) => {
    setFeedback(message);
    const timer = setTimeout(() => {
        setFeedback('');
    }, 1500);
    return () => clearTimeout(timer);
  };

  const startGame = useCallback((puzzle: Puzzle) => {
    const totalPieces = puzzle.grid * puzzle.grid;
    const initialPieces = Array.from({ length: totalPieces }, (_, i) => ({ id: i, shuffledIndex: 0 }));
    
    const shuffled = initialPieces.sort(() => Math.random() - 0.5);
    shuffled.forEach((p, i) => p.shuffledIndex = i);

    setPieces(shuffled);
    setBoard(Array(totalPieces).fill(null));
    setCurrentPuzzle(puzzle);
    setMoves(0);
    setShowWinModal(false);
    setGameState('playing');
  }, []);

  const resetGame = useCallback(() => {
    setGameState('select');
    setCurrentPuzzle(null);
    setPieces([]);
    setBoard([]);
    setMoves(0);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && board.every(p => p !== null) && board.length > 0) {
      setGameState('completed');
      setShowWinModal(true);
    }
  }, [board, gameState]);

  const handleSelectPiece = (pieceToSelect: Piece) => {
    setSelectedPiece(p => p?.shuffledIndex === pieceToSelect.shuffledIndex ? null : pieceToSelect);
  };

  const handlePlacePiece = (slotIndex: number) => {
    if (!selectedPiece || board[slotIndex]) {
        if (board[slotIndex]) {
            showTemporaryFeedback("Slot is already filled!");
        }
        return;
    }
    
    setMoves(m => m + 1);

    if (selectedPiece.id === slotIndex) {
        const newBoard = [...board];
        newBoard[slotIndex] = selectedPiece;
        setBoard(newBoard);

        const newPieces = pieces.filter(p => p.shuffledIndex !== selectedPiece.shuffledIndex);
        setPieces(newPieces);
        
        setSelectedPiece(null);
    } else {
        showTemporaryFeedback("That's not the right spot!");
        setSelectedPiece(null);
    }
  };


  const handleCloseModal = () => {
    setShowWinModal(false);
    const score = Math.max(0, 1000 - moves * 10);
    onGameOver(score, 'jigsaw-puzzle');
  };

  const renderSelectionScreen = () => {
      const filteredPuzzles = PUZZLES.filter(p => p.difficulty === activeDifficulty);
      return (
        <div className="w-full h-full flex flex-col p-4 pt-12 md:p-6 md:pt-16 bg-transparent overflow-y-auto">
          <h1 className="text-center text-4xl font-bold text-white drop-shadow-md">Jigsaw Puzzles</h1>
          <p className="text-center text-lg text-slate-300 mt-1 mb-6">Pick a puzzle to begin!</p>
          
          <div className="flex justify-center my-4 bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-full sticky top-2 z-10">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(d)}
                className={`px-4 py-2 sm:px-6 text-lg font-bold rounded-full transition-all duration-300 ${activeDifficulty === d ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-200 hover:bg-slate-700/50'}`}
              >
                {d}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full max-w-7xl mx-auto mt-4">
            {filteredPuzzles.map(puzzle => {
              const categoryStyle = CATEGORY_STYLES[puzzle.category] || { text: 'text-gray-800', iconColor: 'text-gray-500' };
              const difficultyStyle = DIFFICULTY_STYLES[puzzle.difficulty] || 'bg-gray-100 text-gray-800';
              const IconComponent = CategoryIcons[puzzle.category];

              return (
                <div key={puzzle.id} className="group bg-slate-800/70 border-2 border-slate-700 rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-cyan-500 hover:-translate-y-1.5">
                  <div
                    className="relative h-44 overflow-hidden"
                    aria-label={puzzle.name}
                  >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-in-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${puzzle.src})` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
                        {IconComponent && (
                              <div className={`flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 ${categoryStyle.text}`}>
                                <IconComponent className={`w-4 h-4 ${categoryStyle.iconColor}`} />
                                <span className="text-xs font-bold">{puzzle.category}</span>
                            </div>
                        )}
                        <div className={`px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold ${difficultyStyle}`}>
                            {puzzle.difficulty}
                        </div>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-white">{puzzle.name}</h3>
                    <p className="text-sm text-slate-300 mt-1 flex-grow">{puzzle.grid}x{puzzle.grid} Pieces</p>
                    <button 
                        onClick={() => startGame(puzzle)} 
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-500 text-white font-bold py-3 rounded-lg shadow-md border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all duration-150"
                    >
                        <PlayIcon className="w-6 h-6"/>
                        <span className="text-lg">Play Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
  };

  const renderGameScreen = () => {
    if (!currentPuzzle) return null;
    const grid = currentPuzzle.grid;

    return (
      <div className="relative w-full h-full flex flex-col lg:flex-row items-center justify-center p-4 gap-4 md:gap-8 bg-transparent">
        <style>{`
          @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
          .animate-fade-out { animation: fade-out 1.5s ease-out forwards; }
          .animate-glow { animation: glow 1s ease-out; } @keyframes glow { from { box-shadow: 0 0 20px 5px rgba(52, 211, 153, 0.7); } to { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); } }
        `}</style>
        
        <button onClick={resetGame} className="absolute top-4 left-4 z-20 bg-cyan-500 text-white rounded-full p-3 shadow-lg hover:bg-cyan-600 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-300">
            <BackIcon className="h-6 w-6" />
            <span className="sr-only">Back to puzzles</span>
        </button>

        <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white drop-shadow-md mb-2">{currentPuzzle.name}</h2>
            <div className="text-xl text-slate-300 mb-4 h-8 flex items-center">
              {feedback ?
                  <span className="text-red-400 font-bold animate-fade-out">{feedback}</span> :
                  <span>Moves: <span className="font-bold text-cyan-400">{moves}</span></span>
              }
            </div>
            
            {gameState === 'completed' ? (
                <div className="w-[90vw] max-w-md lg:max-w-lg aspect-square rounded-2xl shadow-lg p-2 bg-slate-800 border-2 border-cyan-400">
                    <div 
                        className="w-full h-full bg-cover bg-center rounded-lg"
                        style={{ backgroundImage: `url(${currentPuzzle.src})` }}
                        aria-label={`Completed puzzle: ${currentPuzzle.name}`}
                    />
                </div>
            ) : (
                <div
                    className="grid gap-1 w-[90vw] max-w-md lg:max-w-lg aspect-square bg-slate-900/50 rounded-2xl shadow-inner p-2"
                    style={{ gridTemplateColumns: `repeat(${grid}, 1fr)` }}
                >
                    {board.map((piece, index) => (
                        <div
                            key={index}
                            onClick={() => handlePlacePiece(index)}
                            className={`rounded-md transition-colors duration-300 cursor-pointer ${selectedPiece ? 'bg-slate-700/80' : 'bg-slate-800/50'}`}
                        >
                            {piece ? (
                                <PuzzlePiece puzzle={currentPuzzle} piece={piece} isPlaced={true} onClick={()=>{}} isSelected={false}/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-1/2 h-1/2 text-slate-700/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="w-full lg:w-80 h-48 lg:h-[80vh] lg:max-h-[500px] bg-slate-800/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg flex flex-col border-2 border-slate-700">
            <h3 className="text-center text-xl font-bold text-slate-200 mb-2 shrink-0">Available Pieces</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-3 gap-2 overflow-y-auto flex-grow p-1">
                {pieces.sort((a,b) => a.shuffledIndex - b.shuffledIndex).map(piece => (
                    <PuzzlePiece 
                      key={piece.shuffledIndex}
                      puzzle={currentPuzzle}
                      piece={piece}
                      isPlaced={false}
                      onClick={() => handleSelectPiece(piece)}
                      isSelected={selectedPiece?.shuffledIndex === piece.shuffledIndex}
                    />
                ))}
            </div>
        </div>
        {showWinModal && (
            <WinModal
                onPlayAgain={resetGame}
                onClose={handleCloseModal}
                title="Puzzle Complete!"
                message={`You solved the puzzle in ${moves} moves!`}
            />
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {gameState === 'select' ? renderSelectionScreen() : renderGameScreen()}
    </div>
  );
};

export default JigsawPuzzleGame;