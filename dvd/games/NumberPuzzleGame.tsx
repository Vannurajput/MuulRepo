


import React, { useState, useEffect, useCallback } from 'react';
import WinModal from '../WinModal';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const GRID_SIZE = 4;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const EMPTY_TILE = null;

const NumberPuzzleGame: React.FC<GameProps> = ({ onGameOver }) => {
    const [tiles, setTiles] = useState<(number | null)[]>([]);
    const [moves, setMoves] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);

    const shuffleTiles = useCallback(() => {
        let newTiles = Array.from({ length: TILE_COUNT - 1 }, (_, i) => i + 1);
        newTiles.push(EMPTY_TILE);

        // Make a bunch of random moves to shuffle, ensuring it's solvable
        let emptyIndex = TILE_COUNT - 1;
        for (let i = 0; i < 500; i++) {
            const { row, col } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };
            const neighbors = [];
            if (row > 0) neighbors.push(emptyIndex - GRID_SIZE); // Up
            if (row < GRID_SIZE - 1) neighbors.push(emptyIndex + GRID_SIZE); // Down
            if (col > 0) neighbors.push(emptyIndex - 1); // Left
            if (col < GRID_SIZE - 1) neighbors.push(emptyIndex + 1); // Right

            const randomIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
            [newTiles[emptyIndex], newTiles[randomIndex]] = [newTiles[randomIndex], newTiles[emptyIndex]];
            emptyIndex = randomIndex;
        }
        
        // Sometimes the shuffle ends up in a solved state, reshuffle if so.
        if (checkSolution(newTiles)) {
            shuffleTiles();
            return;
        }

        setTiles(newTiles);
        setMoves(0);
        setIsSolved(false);
        setShowWinModal(false);
    }, []);

    const checkSolution = useCallback((currentTiles: (number | null)[]) => {
        for (let i = 0; i < TILE_COUNT - 1; i++) {
            if (currentTiles[i] !== i + 1) return false;
        }
        return currentTiles[TILE_COUNT - 1] === EMPTY_TILE;
    }, []);

    useEffect(() => {
        shuffleTiles();
    }, [shuffleTiles]);

    const handleTileClick = (index: number) => {
        if (isSolved || tiles[index] === EMPTY_TILE) return;

        const emptyIndex = tiles.indexOf(EMPTY_TILE);
        if (emptyIndex === -1) return;

        const { row, col } = { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
        const { emptyRow, emptyCol } = { emptyRow: Math.floor(emptyIndex / GRID_SIZE), emptyCol: emptyIndex % GRID_SIZE };

        const isAdjacent = (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;

        if (isAdjacent) {
            const newTiles = [...tiles];
            [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]]; // Swap
            setTiles(newTiles);
            const newMoves = moves + 1;
            setMoves(newMoves);

            if (checkSolution(newTiles)) {
                setIsSolved(true);
                setShowWinModal(true);
            }
        }
    };
    
    const handleCloseModal = () => {
        setShowWinModal(false);
        const score = Math.max(0, 500 - moves); // Score is higher for fewer moves
        onGameOver(score, 'number-puzzle');
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4">
            <style>{`
                .tile { transition: all 0.2s ease-in-out; }
            `}</style>
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-white">Number Puzzle</h1>
                <p className="text-2xl mt-2 text-slate-300">Moves: <span className="font-bold text-cyan-400">{moves}</span></p>
            </div>
            
            <div className="w-full max-w-sm aspect-square bg-slate-900 rounded-2xl shadow-lg p-2">
                <div className="grid grid-cols-4 gap-2 w-full h-full">
                    {tiles.map((tile, index) => (
                        <button
                            key={index}
                            onClick={() => handleTileClick(index)}
                            className={`tile flex items-center justify-center font-bold text-3xl rounded-lg 
                                ${tile === EMPTY_TILE
                                    ? 'bg-slate-800/50 cursor-default'
                                    : `bg-slate-700 hover:bg-slate-600 text-white shadow-md transform hover:scale-105 active:scale-95`
                                }
                                ${isSolved ? 'bg-green-500 text-white' : ''}
                            `}
                            disabled={isSolved || tile === EMPTY_TILE}
                        >
                            {tile}
                        </button>
                    ))}
                </div>
            </div>
            
            <button
                onClick={shuffleTiles}
                className="mt-6 px-8 py-3 bg-cyan-500 text-white font-bold text-xl rounded-lg shadow-md border-b-4 border-cyan-700 hover:bg-cyan-400 active:border-b-0 active:translate-y-1 transition-all"
            >
                Shuffle
            </button>

            {showWinModal && (
                <WinModal
                    onPlayAgain={shuffleTiles}
                    onClose={handleCloseModal}
                    title="You Solved It!"
                    message={`Amazing! You did it in ${moves} moves.`}
                />
            )}
        </div>
    );
};

export default NumberPuzzleGame;