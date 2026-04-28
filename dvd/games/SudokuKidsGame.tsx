

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import WinModal from '../WinModal';
import QuitModal from '../QuitModal';
import { BackIcon } from '../icons/BackIcon';
import { CloseIcon } from '../icons/CloseIcon';

// --- ICONS ---
const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.5 8C9.85 8 7.45 8.99 5.6 10.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.38 11.23 17.28 8 12.5 8z" />
  </svg>
);
const RedoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.78 0-8.88 3.23-9.87 7.78l-2.37-.78C.25 9.45 4.93 6 11.5 6c2.12 0 4.11 .9 5.6 2.38L19 6v9h-9l3.4-3.4z" />
  </svg>
);
const HintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
  </svg>
);
const NotesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);
const RestartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </svg>
);
const HelpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);


// --- TYPES AND CONSTANTS ---
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type CellValue = number | null; // 0-5 for colors, null for empty
type Board = CellValue[][];
type Notes = Set<number>[][];

const DIFFICULTY_CONFIG: Record<Difficulty, { size: number, holes: number }> = {
  'Easy': { size: 4, holes: 6 },
  'Medium': { size: 4, holes: 8 },
  'Hard': { size: 6, holes: 20 },
};

const PALETTE = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#a855f7'];

// --- SUDOKU GENERATION LOGIC ---
const shuffleArray = (arr: any[]) => arr.slice().sort(() => Math.random() - 0.5);

const isValid = (board: Board, val: number, row: number, col: number): boolean => {
  const size = board.length;
  const boxSizeRow = size === 4 ? 2 : 2;
  const boxSizeCol = size === 4 ? 2 : 3;
  const boxRowStart = row - (row % boxSizeRow);
  const boxColStart = col - (col % boxSizeCol);

  // Check row and column
  for (let i = 0; i < size; i++) {
    if (board[row][i] === val || board[i][col] === val) return false;
  }

  // Check box
  for (let r = 0; r < boxSizeRow; r++) {
    for (let c = 0; c < boxSizeCol; c++) {
      if (board[boxRowStart + r][boxColStart + c] === val) return false;
    }
  }
  return true;
};

const solveSudoku = (board: Board): boolean => {
    const size = board.length;
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (board[row][col] === null) {
                const values = shuffleArray(Array.from({ length: size }, (_, i) => i));
                for (const val of values) {
                    if (isValid(board, val, row, col)) {
                        board[row][col] = val;
                        if (solveSudoku(board)) return true;
                        board[row][col] = null;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

const generatePuzzle = (difficulty: Difficulty): { puzzle: Board, solution: Board } => {
    const { size, holes } = DIFFICULTY_CONFIG[difficulty];
    const solution: Board = Array(size).fill(null).map(() => Array(size).fill(null));
    solveSudoku(solution);

    const puzzle = solution.map(row => [...row]);
    
    let attempts = holes;
    while (attempts > 0) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        if (puzzle[row][col] !== null) {
            puzzle[row][col] = null;
            attempts--;
        }
    }
    return { puzzle, solution };
};

// --- Child Components ---
const InstructionsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="relative bg-slate-800/90 rounded-2xl shadow-2xl shadow-purple-500/20 border-2 border-purple-400 w-full max-w-lg p-6 md:p-8 text-left">
            <div className="flex items-center gap-4 mb-4">
                <HintIcon className="w-12 h-12 text-purple-400"/>
                <h2 className="text-4xl font-bold text-purple-400 drop-shadow-md">How to Play!</h2>
            </div>
            <ul className="list-disc list-inside space-y-3 text-slate-200 text-lg ml-2">
                <li>The goal is to fill every empty square with a color.</li>
                <li>Each <strong>row</strong> must have one of every color, with no repeats.</li>
                <li>Each <strong>column</strong> must also have one of every color.</li>
                <li>Each colored <strong>box</strong> must have one of every color too!</li>
            </ul>
            <p className="text-slate-300 text-lg mt-4 ml-2">Click an empty square, then click a color from the palette to fill it in.</p>
            <div className="text-center mt-6">
                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/30 border-b-4 border-purple-700 hover:bg-purple-400 active:border-b-0 active:translate-y-1 transition-all duration-150"
                >
                    Let's Go!
                </button>
            </div>
        </div>
    </div>
);


// --- GAME COMPONENT ---
const SudokuKidsGame: React.FC<{ onGameOver: (score: number, gameId?: string) => void; }> = ({ onGameOver }) => {
    const [gameState, setGameState] = useState<'select' | 'playing' | 'solved'>('select');
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [initialBoard, setInitialBoard] = useState<Board | null>(null);
    const [playerBoard, setPlayerBoard] = useState<Board | null>(null);
    const [solution, setSolution] = useState<Board | null>(null);
    const [notes, setNotes] = useState<Notes | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [history, setHistory] = useState<{ board: Board, notes: Notes }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [hints, setHints] = useState(3);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showQuitModal, setShowQuitModal] = useState(false);

    const scoreRef = useRef({ hintsUsed: 0 });

    useEffect(() => {
        const hasPlayedBefore = localStorage.getItem('sudokuKidsFirstTime') === 'false';
        if (!hasPlayedBefore) {
            setShowInstructions(true);
            localStorage.setItem('sudokuKidsFirstTime', 'false');
        }
    }, []);

    const errors = useMemo(() => {
        if (!playerBoard) return new Set<string>();
        const errorSet = new Set<string>();
        const size = playerBoard.length;
        
        const checkGroup = (group: CellValue[], isRow: boolean, index: number) => {
            const counts: { [key: number]: number[] } = {};
            group.forEach((val, i) => {
                if (val !== null) {
                    if (!counts[val]) counts[val] = [];
                    counts[val].push(i);
                }
            });
            Object.values(counts).forEach(indices => {
                if (indices.length > 1) {
                    indices.forEach(i => errorSet.add(isRow ? `${index}-${i}` : `${i}-${index}`));
                }
            });
        };

        const checkBox = (rOffset: number, cOffset: number, boxSizeRow: number, boxSizeCol: number) => {
            const box: { val: CellValue, r: number, c: number }[] = [];
            for (let i = 0; i < boxSizeRow; i++) {
                for (let j = 0; j < boxSizeCol; j++) {
                    box.push({ val: playerBoard[rOffset + i][cOffset + j], r: rOffset + i, c: cOffset + j });
                }
            }
            const counts: { [key: number]: { r: number, c: number }[] } = {};
             box.forEach(item => {
                if (item.val !== null) {
                    if (!counts[item.val]) counts[item.val] = [];
                    counts[item.val].push({r: item.r, c: item.c});
                }
            });
            Object.values(counts).forEach(items => {
                if (items.length > 1) {
                    items.forEach(item => errorSet.add(`${item.r}-${item.c}`));
                }
            });
        }

        for (let i = 0; i < size; i++) {
            checkGroup(playerBoard[i], true, i); // Check row
            checkGroup(playerBoard.map(row => row[i]), false, i); // Check col
        }

        // Check boxes
        const boxSizeRow = size === 4 ? 2 : 2;
        const boxSizeCol = size === 4 ? 2 : 3;
        for (let r = 0; r < size; r += boxSizeRow) {
            for (let c = 0; c < size; c += boxSizeCol) {
                checkBox(r, c, boxSizeRow, boxSizeCol);
            }
        }
        return errorSet;
    }, [playerBoard]);

    const startGame = useCallback((diff: Difficulty) => {
        const { puzzle, solution: sol } = generatePuzzle(diff);
        const size = DIFFICULTY_CONFIG[diff].size;
        const initialNotes = Array(size).fill(null).map(() => Array(size).fill(null).map(() => new Set<number>()));
        
        setDifficulty(diff);
        setInitialBoard(puzzle);
        setPlayerBoard(puzzle);
        setSolution(sol);
        setNotes(initialNotes);
        setHistory([{ board: puzzle, notes: initialNotes }]);
        setHistoryIndex(0);
        setSelectedCell(null);
        setIsNotesMode(false);
        setGameState('playing');
        setHints(3);
        scoreRef.current.hintsUsed = 0;
    }, []);
    
    const updateHistory = useCallback((newBoard: Board, newNotes: Notes) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ board: newBoard, notes: newNotes });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const handlePaletteSelect = (val: number) => {
        if (!selectedCell || !playerBoard || !notes || gameState === 'solved') return;
        const { row, col } = selectedCell;
        if (initialBoard?.[row][col] !== null) return; // Can't change initial numbers

        const newBoard = playerBoard.map(r => [...r]);
        const newNotes = notes.map(r => r.map(s => new Set(s)));

        if (isNotesMode) {
            if (newNotes[row][col].has(val)) {
                newNotes[row][col].delete(val);
            } else {
                newNotes[row][col].add(val);
            }
            newBoard[row][col] = null; // Clear final value if entering notes
        } else {
            newBoard[row][col] = newBoard[row][col] === val ? null : val;
            newNotes[row][col].clear(); // Clear notes when setting final value
        }
        
        setPlayerBoard(newBoard);
        setNotes(newNotes);
        updateHistory(newBoard, newNotes);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setPlayerBoard(history[newIndex].board);
            setNotes(history[newIndex].notes);
            setHistoryIndex(newIndex);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setPlayerBoard(history[newIndex].board);
            setNotes(history[newIndex].notes);
            setHistoryIndex(newIndex);
        }
    };
    
    const handleHint = () => {
        if (hints <= 0 || !playerBoard || !solution || gameState === 'solved') return;
        
        const emptyCells = [];
        for(let r=0; r < playerBoard.length; r++) {
            for(let c=0; c < playerBoard.length; c++) {
                if(playerBoard[r][c] === null) emptyCells.push({r,c});
            }
        }
        
        if(emptyCells.length > 0) {
            const {r,c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newBoard = playerBoard.map(row => [...row]);
            newBoard[r][c] = solution[r][c];
            setPlayerBoard(newBoard);
            
            const newNotes = notes!.map(row => row.map(s => new Set(s)));
            newNotes[r][c].clear();
            setNotes(newNotes);
            
            updateHistory(newBoard, newNotes);
            setHints(h => h - 1);
            scoreRef.current.hintsUsed++;
        }
    };
    
    // Win Condition Check
    useEffect(() => {
        if (!playerBoard || gameState === 'solved') return;
        const isFilled = playerBoard.every(row => row.every(cell => cell !== null));
        if (isFilled && errors.size === 0) {
            setGameState('solved');
            setShowWinModal(true);
            
            let finalScore = 0;
            if (scoreRef.current.hintsUsed === 0) finalScore = 100; // No hints trophy
            else if (difficulty === 'Hard') finalScore = 6; // 6x6 trophy
            else finalScore = 1; // 4x4 trophy
            onGameOver(finalScore, 'sudoku-kids');
        }
    }, [playerBoard, errors, onGameOver, difficulty, gameState]);

    if (gameState === 'select') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-transparent gap-8 p-4">
                {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
                <h1 className="text-5xl font-bold text-white text-center">Select Difficulty</h1>
                <div className="flex flex-col sm:flex-row gap-6">
                    <button onClick={() => startGame('Easy')} className="px-10 py-5 text-2xl font-bold text-white bg-green-500 rounded-2xl shadow-lg border-b-4 border-green-700 hover:bg-green-400 transition-all active:translate-y-1 active:border-b-0">Easy (4x4)</button>
                    <button onClick={() => startGame('Medium')} className="px-10 py-5 text-2xl font-bold text-white bg-cyan-500 rounded-2xl shadow-lg border-b-4 border-cyan-700 hover:bg-cyan-400 transition-all active:translate-y-1 active:border-b-0">Medium (4x4)</button>
                    <button onClick={() => startGame('Hard')} className="px-10 py-5 text-2xl font-bold text-white bg-purple-500 rounded-2xl shadow-lg border-b-4 border-purple-700 hover:bg-purple-400 transition-all active:translate-y-1 active:border-b-0">Hard (6x6)</button>
                </div>
            </div>
        );
    }

    if (!playerBoard || !notes || !initialBoard || !difficulty) return null;

    const size = DIFFICULTY_CONFIG[difficulty].size;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-transparent">
            {showWinModal && (
                <WinModal
                    title="Puzzle Solved!"
                    message="You're a Sudoku superstar!"
                    onPlayAgain={() => {
                        setShowWinModal(false);
                        startGame(difficulty);
                    }}
                    onClose={() => {
                        setShowWinModal(false);
                        setGameState('select');
                    }}
                    playAgainText="New Puzzle"
                />
            )}
            {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}
            {showQuitModal && (
                <QuitModal
                    onClose={() => setShowQuitModal(false)}
                    onExit={() => onGameOver(-1)}
                />
            )}
            
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button 
                    onClick={() => {
                        setSelectedCell(null);
                        setGameState('select');
                    }}
                    className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                    aria-label="Back to level selection"
                >
                    <BackIcon className="w-8 h-8 text-white" />
                </button>
                <button 
                    onClick={() => setShowQuitModal(true)}
                    className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                    aria-label="Quit to main menu"
                >
                    <CloseIcon className="w-8 h-8 text-white" />
                </button>
            </div>
            
            <h1 className="absolute top-4 text-3xl sm:text-4xl font-bold text-white text-center pointer-events-none z-10 drop-shadow-lg">
                Sudoku Kids
            </h1>

            <div className={`grid gap-1 sm:gap-1.5 p-1 sm:p-2 bg-slate-800/80 rounded-lg border-2 border-slate-700 w-full max-w-lg aspect-square`}>
                {Array.from({length: size}).map((_, r) => (
                    <div key={r} className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`}}>
                         {playerBoard[r].map((val, c) => {
                            const isInitial = initialBoard[r][c] !== null;
                            const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                            const isError = errors.has(`${r}-${c}`);
                            const boxSizeRow = size === 4 ? 2 : 2;
                            const boxSizeCol = size === 4 ? 2 : 3;
                            const isAltBox = (Math.floor(r/boxSizeRow) + Math.floor(c/boxSizeCol)) % 2 === 1;

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    onClick={() => setSelectedCell({row: r, col: c})}
                                    className={`rounded-sm sm:rounded-md flex items-center justify-center aspect-square transition-colors
                                        ${isInitial ? 'bg-slate-700' : (isAltBox ? 'bg-slate-900/40' : 'bg-slate-900/80')}
                                        ${!isInitial && 'cursor-pointer'}
                                        ${isSelected ? 'ring-4 ring-cyan-400 z-10' : ''}
                                        ${isError && !isInitial ? 'bg-red-500/50' : ''}
                                    `}
                                >
                                    {val !== null ? (
                                        <div className={`w-3/4 h-3/4 rounded-full transition-all duration-300 ${isInitial ? 'opacity-80' : 'scale-105'}`} style={{ backgroundColor: PALETTE[val] }}></div>
                                    ) : (
                                        <div className={`grid w-full h-full text-xs text-white/50`} style={{gridTemplateColumns: `repeat(${size === 4 ? 2:3}, 1fr)`}}>
                                            {Array.from({length: size}).map((_, i) => (
                                                <div key={i} className="flex items-center justify-center">
                                                    {notes[r][c].has(i) && <div className="w-1/2 h-1/2 rounded-full opacity-60" style={{backgroundColor: PALETTE[i]}} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`}}>
                    {PALETTE.slice(0, size).map((color, i) => (
                        <button key={i} onClick={() => handlePaletteSelect(i)} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg border-2 border-slate-600 hover:scale-110 transition-transform" style={{ backgroundColor: color }} aria-label={`Select color ${i + 1}`}/>
                    ))}
                </div>
                <div className="flex gap-2 p-2 bg-slate-800/80 rounded-full">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-3 bg-slate-700 rounded-full disabled:opacity-50"><UndoIcon className="w-6 h-6"/></button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-3 bg-slate-700 rounded-full disabled:opacity-50"><RedoIcon className="w-6 h-6"/></button>
                    <button onClick={() => setIsNotesMode(m => !m)} className={`p-3 rounded-full ${isNotesMode ? 'bg-cyan-500' : 'bg-slate-700'}`}><NotesIcon className="w-6 h-6"/></button>
                    <button onClick={handleHint} disabled={hints <= 0} className="p-3 bg-slate-700 rounded-full disabled:opacity-50 relative"><HintIcon className="w-6 h-6"/> <span className="absolute -top-1 -right-1 text-xs bg-yellow-400 text-black font-bold w-5 h-5 rounded-full flex items-center justify-center">{hints}</span></button>
                    <button onClick={() => startGame(difficulty)} className="p-3 bg-slate-700 rounded-full"><RestartIcon className="w-6 h-6"/></button>
                    <button onClick={() => setShowInstructions(true)} className="p-3 bg-slate-700 rounded-full text-purple-400 hover:bg-slate-600"><HelpIcon className="w-6 h-6"/></button>
                </div>
            </div>
        </div>
    );
};

export default SudokuKidsGame;
