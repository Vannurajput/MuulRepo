

import React, { useState, useEffect, useCallback } from 'react';
import WinModal from '../WinModal';

interface GameProps {
  onGameOver: (score: number, gameId:string) => void;
}

const COLS = 6;
const ROWS = 7;
const STARTING_NUMBERS = [2, 4, 8, 16];

interface Tile {
  id: number;
  value: number;
  isNew?: boolean;
  isMerging?: boolean;
}

const TILE_COLORS: { [key: number]: { bg: string; text: string; border?: string; shadow?: string } } = {
  2: { bg: 'bg-cyan-500', text: 'text-white' },
  4: { bg: 'bg-indigo-500', text: 'text-white' },
  8: { bg: 'bg-sky-500', text: 'text-white' },
  16: { bg: 'bg-teal-400', text: 'text-white' },
  32: { bg: 'bg-green-500', text: 'text-white' },
  64: { bg: 'bg-lime-500', text: 'text-black' },
  128: { bg: 'bg-lime-400', text: 'text-black' },
  256: { bg: 'bg-orange-500', text: 'text-white' },
  512: { bg: 'bg-red-500', text: 'text-white' },
  1024: { bg: 'bg-rose-500', text: 'text-white', border: 'border-cyan-300 border-2' },
  2048: { bg: 'bg-purple-600', text: 'text-white', border: 'border-cyan-300 border-4', shadow: 'shadow-cyan-300/50' },
  4096: { bg: 'bg-blue-700', text: 'text-white', border: 'border-cyan-300 border-4', shadow: 'shadow-cyan-300/50' },
  8192: { bg: 'bg-gray-800', text: 'text-cyan-300', border: 'border-cyan-300 border-4', shadow: 'shadow-cyan-300/50' },
};

const TileDisplay: React.FC<{ value: number; isNew?: boolean; isMerging?: boolean; className?: string }> = ({ value, isNew, isMerging, className }) => {
  const { bg, text, border, shadow } = TILE_COLORS[value] || { bg: 'bg-gray-200', text: 'text-black' };
  const animationClass = isNew ? 'animate-pop-in' : isMerging ? 'animate-pop-merge' : '';
  
  return (
    <div className={`w-full h-full rounded-md flex items-center justify-center font-bold text-2xl md:text-3xl transition-all duration-200 ${bg} ${text} ${border} ${shadow ? `shadow-lg ${shadow}`: ''} ${animationClass} ${className}`}>
      {value}
    </div>
  );
};


const NumberBuddiesGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [board, setBoard] = useState<(Tile | null)[][]>(() => Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [nextValue, setNextValue] = useState(2);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const generateNextValue = useCallback(() => {
    setNextValue(STARTING_NUMBERS[Math.floor(Math.random() * STARTING_NUMBERS.length)]);
  }, []);

  const resetGame = useCallback(() => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setScore(0);
    setIsGameOver(false);
    setIsProcessing(false);
    setHoverCol(null);
    generateNextValue();
    setShowWinModal(false);
    setHasWon(false);
  }, [generateNextValue]);


  useEffect(() => {
    generateNextValue();
  }, [generateNextValue]);

  const processBoardChanges = useCallback(async (currentBoard: (Tile | null)[][]) => {
    let boardCopy = currentBoard.map(r => [...r]);
    let hasChangedInLoop = true;

    while (hasChangedInLoop) {
      hasChangedInLoop = false;

      // 1. Apply Gravity
      let gravityApplied = false;
      for (let c = 0; c < COLS; c++) {
        let emptyRow = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (boardCopy[r][c] === null) {
            emptyRow = r;
            break;
          }
        }
        if (emptyRow !== -1) {
          for (let r = emptyRow - 1; r >= 0; r--) {
            if (boardCopy[r][c] !== null) {
              boardCopy[emptyRow][c] = boardCopy[r][c];
              boardCopy[r][c] = null;
              gravityApplied = true;
              emptyRow--;
            }
          }
        }
      }

      if (gravityApplied) {
        hasChangedInLoop = true;
        setBoard(boardCopy.map(r => [...r]));
        await new Promise(res => setTimeout(res, 150));
      }

      // 2. Handle Merges
      let mergeApplied = false;
      const mergedThisPass = new Set<string>();

      for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          const tile = boardCopy[r][c];
          if (!tile || mergedThisPass.has(`${r},${c}`)) continue;

          // Vertical merge check (with tile below)
          if (r < ROWS - 1 && boardCopy[r + 1][c]?.value === tile.value && !mergedThisPass.has(`${r+1},${c}`)) {
            const mergedValue = tile.value * 2;
            if (mergedValue >= 2048 && !hasWon) {
                setHasWon(true);
                setShowWinModal(true);
            }
            setScore(s => s + mergedValue);

            boardCopy[r][c] = null;
            boardCopy[r + 1][c] = { id: Date.now(), value: mergedValue, isMerging: true };
            mergedThisPass.add(`${r+1},${c}`);
            mergeApplied = true;
            continue;
          }
          // Horizontal merge check (with tile to the right)
          if (c < COLS - 1 && boardCopy[r][c + 1]?.value === tile.value && !mergedThisPass.has(`${r},${c+1}`)) {
            const mergedValue = tile.value * 2;
            if (mergedValue >= 2048 && !hasWon) {
                setHasWon(true);
                setShowWinModal(true);
            }
            setScore(s => s + mergedValue);

            boardCopy[r][c] = null;
            boardCopy[r][c + 1] = { id: Date.now(), value: mergedValue, isMerging: true };
            mergedThisPass.add(`${r},${c+1}`);
            mergeApplied = true;
          }
        }
      }
      
      if (mergeApplied) {
        hasChangedInLoop = true;
        setBoard(boardCopy.map(r => [...r]));
        await new Promise(res => setTimeout(res, 200));

        boardCopy = boardCopy.map(row => row.map(t => (t ? { ...t, isMerging: false } : null)));
        setBoard(boardCopy.map(r => [...r]));
      }
    }
    return boardCopy;
  }, [setScore, hasWon]);
  
  const dropTile = useCallback(async (col: number) => {
    if (isProcessing || isGameOver || board[0][col]) return;

    setIsProcessing(true);
    setHoverCol(null);

    let landingRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) {
        landingRow = r;
        break;
      }
    }
    
    if (landingRow === -1) {
      setIsProcessing(false);
      return;
    }

    let newBoard = board.map(r => [...r]);
    newBoard[landingRow][col] = { id: Date.now(), value: nextValue, isNew: true };
    setBoard(newBoard);
    await new Promise(res => setTimeout(res, 150));

    newBoard = newBoard.map(row => row.map(tile => (tile ? { ...tile, isNew: false } : null)));
    const finalBoard = await processBoardChanges(newBoard);

    const isBoardFull = !finalBoard[0].some(cell => cell === null);
    if (isBoardFull) {
      setIsGameOver(true);
      onGameOver(score, 'number-buddies');
    } else {
      generateNextValue();
      setIsProcessing(false);
    }
  }, [board, generateNextValue, isGameOver, isProcessing, nextValue, onGameOver, score, processBoardChanges]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-2 md:p-4 text-white overflow-hidden" onMouseLeave={() => setHoverCol(null)}>
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in { animation: pop-in 0.3s ease-out forwards; }
        
        @keyframes pop-merge {
          0% { transform: scale(1); }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1); }
        }
        .animate-pop-merge { animation: pop-merge 0.3s ease-in-out forwards; }
        
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 15px 5px rgba(6, 182, 212, 0.4); }
            50% { box-shadow: 0 0 25px 10px rgba(6, 182, 212, 0.7); }
        }
        .animate-glow { animation: glow 1.5s infinite ease-in-out; }

      `}</style>
      <div className="text-center mb-4 pt-16">
        <p className="text-xl md:text-2xl mt-2">Score: <span className="text-cyan-400 font-bold">{score}</span></p>
      </div>

      <div className="w-full max-w-sm md:max-w-md h-20 flex items-center justify-center">
         {!isGameOver && (
            <div className="flex items-center space-x-3">
              <span className="text-lg">Next:</span>
              <div className="w-12 h-12 md:w-16 md:h-16">
                  <TileDisplay value={nextValue} />
              </div>
            </div>
         )}
         {isGameOver && (
            <div className="text-4xl font-bold text-red-500 animate-pulse my-4">GAME OVER</div>
         )}
      </div>

      <div className="relative">
        {/* The hover/drop preview tile */}
        {!isProcessing && hoverCol !== null && (
            <div 
              className="absolute w-[calc(100%/6)] h-[calc(100%/7)] p-1 z-10 transition-transform duration-100 pointer-events-none"
              style={{ top: 0, left: `${hoverCol * (100/COLS)}%`, transform: `translateY(-110%)`}}
            >
                <div className="w-full h-full animate-glow rounded-md">
                    <TileDisplay value={nextValue} />
                </div>
            </div>
        )}

        <div className="grid gap-1 bg-gray-800 p-1.5 rounded-lg shadow-2xl" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {Array.from({ length: COLS * ROWS }).map((_, index) => {
            const row = Math.floor(index / COLS);
            const col = index % COLS;
            const tile = board[row][col];
            return (
              <div
                key={index}
                className="w-14 h-14 md:w-16 md:h-16 bg-gray-700/50 rounded-md p-1 cursor-pointer"
                onClick={() => dropTile(col)}
                onMouseEnter={() => setHoverCol(col)}
              >
                {tile && <TileDisplay value={tile.value} isNew={tile.isNew} isMerging={tile.isMerging} />}
              </div>
            );
          })}
        </div>
      </div>
       {showWinModal && (
        <WinModal 
            onPlayAgain={resetGame}
            onClose={() => setShowWinModal(false)}
            message="You reached 2048! Keep playing to get an even higher score."
        />
      )}
    </div>
  );
};

export default NumberBuddiesGame;
