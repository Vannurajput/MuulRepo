import React, { useState, useEffect, useCallback, useRef } from 'react';
import WinModal from '../WinModal';

// --- ICONS ---
const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg>
);
const HintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
);
const BackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
);
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
);


// --- TYPES AND CONSTANTS ---
const DIFFICULTIES = {
    'Easy': { size: 8, numWords: 6, maxLength: 5, backwards: false },
    'Medium': { size: 10, numWords: 8, maxLength: 7, backwards: true },
    'Hard': { size: 12, numWords: 10, maxLength: 10, backwards: true },
};
const THEMES = ['Animals', 'Food', 'Space', 'Nature', 'School'];
type Cell = { row: number; col: number };
type FoundWordPath = { word: string; start: Cell; end: Cell; color: string; };
type GameState = 'setup' | 'loading' | 'playing';
type DifficultyKey = keyof typeof DIFFICULTIES;

const WORD_BANK: Record<string, string[]> = {
    'Animals': ['CAT', 'DOG', 'FISH', 'BIRD', 'LION', 'TIGER', 'BEAR', 'FROG', 'DUCK', 'PIG', 'COW', 'GOAT', 'WOLF', 'FOX', 'DEER', 'HORSE', 'MOUSE', 'SNAKE', 'SHEEP', 'MONKEY', 'PANDA'],
    'Food': ['APPLE', 'BREAD', 'CAKE', 'PIZZA', 'SOUP', 'RICE', 'CHEESE', 'JUICE', 'PASTA', 'STEAK', 'FRUIT', 'CORN', 'MILK', 'EGG', 'FISH', 'SALAD', 'TOAST', 'CANDY'],
    'Space': ['SUN', 'MOON', 'STAR', 'MARS', 'EARTH', 'SPACE', 'ALIEN', 'COMET', 'ROCKET', 'ORBIT', 'VENUS', 'PLUTO', 'NEBULA', 'GALAXY', 'ASTEROID'],
    'Nature': ['TREE', 'RIVER', 'FLOWER', 'LEAF', 'RAIN', 'WIND', 'CLOUD', 'OCEAN', 'LAKE', 'ROCK', 'SOIL', 'PLANT', 'HILL', 'SAND', 'BEACH', 'FOREST'],
    'School': ['BOOK', 'PEN', 'DESK', 'TEST', 'CLASS', 'PENCIL', 'PAPER', 'READ', 'WRITE', 'STUDY', 'TEACHER', 'BOARD', 'GLUE', 'RULER', 'ERASER', 'SCHOOL'],
};

// --- HELPER FUNCTIONS ---
const getDirections = (difficulty: DifficultyKey) => {
    const dirs = [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }]; // E, S, SE
    if (DIFFICULTIES[difficulty].backwards) {
        // Add all 8 directions for harder modes
        return [
            { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: -1 },
            { r: 0, c: -1 }, { r: -1, c: 0 }, { r: -1, c: -1 }, { r: -1, c: 1 }
        ];
    }
    return dirs;
};

const generatePuzzle = (words: string[], size: number, difficulty: DifficultyKey): { grid: string[][], wordLocations: Map<string, { start: Cell, end: Cell }> } | null => {
    let grid = Array.from({ length: size }, () => Array(size).fill(''));
    const wordLocations = new Map<string, { start: Cell, end: Cell }>();
    const directions = getDirections(difficulty);

    for (const word of words.sort((a, b) => b.length - a.length)) {
        let placed = false;
        for (let i = 0; i < 200; i++) { // Attempt to place each word 200 times
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startRow = Math.floor(Math.random() * size);
            const startCol = Math.floor(Math.random() * size);
            const endRow = startRow + (word.length - 1) * dir.r;
            const endCol = startCol + (word.length - 1) * dir.c;

            if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

            let canPlace = true;
            for (let j = 0; j < word.length; j++) {
                const r = startRow + j * dir.r;
                const c = startCol + j * dir.c;
                if (grid[r][c] !== '' && grid[r][c] !== word[j]) { canPlace = false; break; }
            }

            if (canPlace) {
                for (let j = 0; j < word.length; j++) {
                    grid[startRow + j * dir.r][startCol + j * dir.c] = word[j];
                }
                wordLocations.set(word, { start: { row: startRow, col: startCol }, end: { row: endRow, col: endCol } });
                placed = true;
                break;
            }
        }
        if (!placed) return null; // Failed to place a word
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c] === '') grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
    
    return { grid, wordLocations };
};


// --- COMPONENT ---
const WordFinderGame: React.FC<{ onGameOver: (score: number, gameId?: string) => void; }> = ({ onGameOver }) => {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [difficulty, setDifficulty] = useState<DifficultyKey | null>(null);
    const [theme, setTheme] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    
    const [grid, setGrid] = useState<string[][]>([]);
    const [words, setWords] = useState<string[]>([]);
    const [wordLocations, setWordLocations] = useState<Map<string, { start: Cell, end: Cell }>>(new Map());
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [foundWordPaths, setFoundWordPaths] = useState<FoundWordPath[]>([]);
    
    const [isDragging, setIsDragging] = useState(false);
    const [selection, setSelection] = useState<{ start: Cell, end: Cell } | null>(null);
    const [hintsLeft, setHintsLeft] = useState(3);
    const [hintPath, setHintPath] = useState<FoundWordPath | null>(null);
    const [showWinModal, setShowWinModal] = useState(false);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<{ word: string; points: number } | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);
    const highlightColors = useRef(['#38bdf8', '#34d399', '#f9a8d4', '#facc15', '#a78bfa', '#f87171', '#fb923c', '#818cf8']).current;

    const handleStartGame = () => {
        if (!theme || !difficulty) return;
        setGameState('loading');
        setLoadingMessage('Generating your puzzle...');
        
        try {
            const config = DIFFICULTIES[difficulty];
            const wordListForTheme = WORD_BANK[theme] || [];
            
            const eligibleWords = wordListForTheme
                .filter(word => word.length >= 3 && word.length <= config.maxLength)
                .sort(() => 0.5 - Math.random());
            
            const selectedWords = eligibleWords.slice(0, config.numWords);

            if (selectedWords.length < config.numWords) {
                throw new Error(`Not enough words for theme "${theme}" and difficulty "${difficulty}".`);
            }
            
            let puzzleData = null;
            for(let i=0; i<5; i++){ // Try generating a few times if it fails
                puzzleData = generatePuzzle(selectedWords, config.size, difficulty);
                if (puzzleData) break;
            }

            if (!puzzleData) throw new Error("Could not generate puzzle layout.");
            
            setWords(selectedWords);
            setGrid(puzzleData.grid);
            setWordLocations(puzzleData.wordLocations);
            setFoundWords(new Set());
            setFoundWordPaths([]);
            setHintsLeft(3);
            setScore(0);
            setShowWinModal(false);

            setTimeout(() => setGameState('playing'), 500);

        } catch (error) {
            console.error("Error generating puzzle:", error);
            setLoadingMessage('Oops! Could not create a puzzle. Please try again.');
            setTimeout(() => setGameState('setup'), 2000);
        }
    };
    
    const getCellFromCoordinates = (clientX: number, clientY: number): Cell | null => {
        const gridEl = gridRef.current;
        if (!gridEl || !difficulty) return null;
        const rect = gridEl.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const col = Math.floor((x / rect.width) * DIFFICULTIES[difficulty].size);
        const row = Math.floor((y / rect.height) * DIFFICULTIES[difficulty].size);
        return { row, col };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (gameState !== 'playing') return;
        const cell = getCellFromCoordinates(e.clientX, e.clientY);
        if (cell) {
            e.currentTarget.setPointerCapture(e.pointerId);
            setIsDragging(true);
            setSelection({ start: cell, end: cell });
        }
    };
    
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !selection) return;
        const cell = getCellFromCoordinates(e.clientX, e.clientY);
        if (cell) setSelection({ ...selection, end: cell });
    };
    
    const handlePointerUp = () => {
        if (!isDragging || !selection) return;
        setIsDragging(false);

        const { start, end } = selection;
        const dr = end.row - start.row;
        const dc = end.col - start.col;

        let word = '';
        if (dr === 0 && dc === 0) {
            word = grid[start.row][start.col];
        } else if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
            const len = Math.max(Math.abs(dr), Math.abs(dc));
            const stepR = Math.sign(dr);
            const stepC = Math.sign(dc);
            for (let i = 0; i <= len; i++) word += grid[start.row + i * stepR][start.col + i * stepC];
        } else {
            setSelection(null);
            return;
        }
        
        const reversedWord = word.split('').reverse().join('');
        const wordData = wordLocations.get(word) || wordLocations.get(reversedWord);

        if (wordData && !foundWords.has(word) && !foundWords.has(reversedWord)) {
            const actualWord = wordLocations.has(word) ? word : reversedWord;
            const newFoundWords = new Set(foundWords).add(actualWord);
            setFoundWords(newFoundWords);
            setFoundWordPaths(prev => [...prev, {
                word: actualWord, start: wordData.start, end: wordData.end,
                color: highlightColors[foundWords.size % highlightColors.length]
            }]);
            const difficultyMultiplier = Object.keys(DIFFICULTIES).indexOf(difficulty!) + 1;
            const pointsEarned = 10 * difficultyMultiplier;
            setScore(s => s + pointsEarned);

            // Show feedback popup
            setFeedback({ word: actualWord, points: pointsEarned });
            setTimeout(() => setFeedback(null), 1500);

            if (wordLocations.size > 0 && newFoundWords.size === wordLocations.size) {
                setTimeout(() => setShowWinModal(true), 500);
            }
        }
        setSelection(null);
    };
    
    const handleHint = () => {
        if (hintsLeft <= 0 || hintPath) return;
        const unfoundWord = words.find(w => !foundWords.has(w));
        if (unfoundWord) {
            const loc = wordLocations.get(unfoundWord)!;
            setHintPath({ word: unfoundWord, ...loc, color: 'white' });
            setHintsLeft(h => h - 1);
            setTimeout(() => setHintPath(null), 1500);
        }
    };

    const renderHighlight = (start: Cell, end: Cell, color: string, key: string | number, opacity = 0.6) => {
        const gridEl = gridRef.current;
        if (!gridEl || !difficulty) return null;
        const { width, height } = gridEl.getBoundingClientRect();
        const size = DIFFICULTIES[difficulty].size;
        const cellWidth = width / size;
        const cellHeight = height / size;

        const startX = start.col * cellWidth + cellWidth / 2;
        const startY = start.row * cellHeight + cellHeight / 2;
        const endX = end.col * cellWidth + cellWidth / 2;
        const endY = end.row * cellHeight + cellHeight / 2;

        return <line key={key} x1={startX} y1={startY} x2={endX} y2={endY} stroke={color} strokeWidth={cellHeight * 0.8} strokeLinecap="round" opacity={opacity} />;
    };

    if (gameState === 'setup') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4 animate-fade-in">
                <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-slate-700">
                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">Word Finder Setup</h1>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-cyan-400 mb-3 text-center">1. Choose a Theme</h2>
                        <div className="flex flex-wrap justify-center gap-3">
                            {THEMES.map(t => <button key={t} onClick={() => setTheme(t)} className={`px-5 py-2 text-lg font-bold rounded-full transition-all duration-300 shadow-md border-2 ${theme === t ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-700/70 text-slate-200 border-slate-600 hover:bg-slate-600'}`}>{t}</button>)}
                        </div>
                    </div>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-cyan-400 mb-3 text-center">2. Choose Difficulty</h2>
                        <div className="flex flex-wrap justify-center gap-3">
                            {Object.keys(DIFFICULTIES).map(d => <button key={d} onClick={() => setDifficulty(d as DifficultyKey)} className={`px-5 py-2 text-lg font-bold rounded-full transition-all duration-300 shadow-md border-2 ${difficulty === d ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-700/70 text-slate-200 border-slate-600 hover:bg-slate-600'}`}>{d}</button>)}
                        </div>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => onGameOver(-1, 'word-finder')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-600 text-white font-bold text-xl rounded-lg shadow-lg border-b-4 border-slate-800 hover:bg-slate-500 active:border-b-0 active:translate-y-1 transition-all">
                            <BackIcon className="w-7 h-7" /> Back
                        </button>
                        <button onClick={handleStartGame} disabled={!theme || !difficulty} className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 text-white font-bold text-xl rounded-lg shadow-lg border-b-4 border-green-700 hover:bg-green-400 active:border-b-0 active:translate-y-1 transition-all disabled:bg-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed">
                            <PlayIcon className="w-7 h-7" /> Start Game
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (gameState === 'loading') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-4 text-white text-center">
                <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold">{loadingMessage}</h2>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-transparent p-2 sm:p-4">
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
                @keyframes fall {
                    from {
                        transform: translateY(0vh) rotate(0deg);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(110vh) rotate(720deg);
                        opacity: 0.8;
                    }
                }
            `}</style>
            {showWinModal && (
                <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
                    {Array.from({ length: 60 }).map((_, i) => {
                        const style: React.CSSProperties = {
                            position: 'absolute',
                            top: '-10vh',
                            left: `${Math.random() * 100}vw`,
                            fontSize: `${Math.random() * 1.5 + 1}rem`,
                            animation: `fall ${Math.random() * 3 + 5}s linear ${Math.random() * 5}s forwards`,
                        };
                        return (
                            <span key={i} style={style}>
                                {Math.random() > 0.5 ? '🎁' : '🪙'}
                            </span>
                        );
                    })}
                </div>
            )}
             {showWinModal && <WinModal 
                onPlayAgain={() => {setShowWinModal(false); setGameState('setup');}} 
                onClose={() => onGameOver(score, 'word-finder')} 
                message={`You found all the words and scored ${score} points!`}
                playAgainText="New Puzzle"
            />}
            {feedback && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none animate-fade-in">
                    <div className="flex flex-col items-center gap-2 p-6 rounded-2xl shadow-2xl bg-green-500/90 text-white font-bold text-4xl animate-pop-in">
                        <span className="text-5xl">🎉</span>
                        <span>{feedback.word}</span>
                        <span className="text-2xl opacity-80">+{feedback.points}</span>
                    </div>
                </div>
            )}
            <div className="w-full h-full max-w-6xl mx-auto grid grid-rows-[auto_1fr_auto] md:grid-rows-1 md:grid-cols-4 gap-4 text-white select-none touch-none">

                {/* Left Column (Desktop) / Top & Bottom Panels (Mobile) */}
                <div className="md:col-span-1 flex flex-col gap-4 md:order-1">
                    {/* Top info: title, score, controls */}
                    <div className="order-1 md:order-1 p-4 bg-slate-800/70 backdrop-blur-sm rounded-lg border-2 border-slate-700">
                        <h2 className="text-xl font-bold text-cyan-400 mb-2 text-center">{theme} Words</h2>
                        <div className="flex justify-between items-center text-lg">
                             <div className="flex flex-col">
                                <span className="text-sm text-slate-300">SCORE</span>
                                <span className="font-bold text-3xl text-white">{score}</span>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={handleHint} disabled={hintsLeft <= 0 || !!hintPath} className="flex items-center gap-2 px-3 py-2 bg-purple-500 rounded-full font-bold disabled:bg-slate-600 disabled:cursor-not-allowed text-sm">
                                    <HintIcon className="w-5 h-5"/> Hint ({hintsLeft})
                                </button>
                                 <button onClick={() => setGameState('setup')} className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-full font-bold text-sm">
                                    <RefreshIcon className="w-5 h-5"/> New
                                </button>
                             </div>
                        </div>
                    </div>

                    {/* Word List */}
                    <div className="order-3 md:order-2 p-4 bg-slate-800/70 backdrop-blur-sm rounded-lg border-2 border-slate-700 md:flex-grow">
                        {/* Mobile word list */}
                        <div className="md:hidden flex flex-wrap justify-center gap-x-3 gap-y-2">
                            {words.map(word => <span key={word} className={`px-3 py-1 rounded-full text-base font-semibold transition-all ${foundWords.has(word) ? 'line-through bg-slate-700 text-slate-500' : 'bg-slate-600 text-white'}`}>{word}</span>)}
                        </div>
                        {/* Desktop vertical list */}
                        <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-1 text-lg font-semibold content-start">
                             {words.map(word => <span key={word} className={`transition-all duration-500 ${foundWords.has(word) ? 'line-through text-slate-500' : 'text-white'}`}>{word}</span>)}
                        </div>
                    </div>
                </div>

                {/* Game Grid */}
                <div 
                    className="order-2 md:order-2 md:col-span-3 flex items-center justify-center min-h-0"
                    onPointerDown={handlePointerDown} 
                    onPointerMove={handlePointerMove} 
                    onPointerUp={handlePointerUp} 
                    onPointerLeave={handlePointerUp}
                >
                    <div className="relative aspect-square w-full h-auto max-h-full">
                        <div ref={gridRef} className="absolute inset-0">
                            <div className="grid gap-0.5 w-full h-full bg-slate-900/50 p-1 sm:p-2 rounded-lg" style={{gridTemplateColumns: `repeat(${DIFFICULTIES[difficulty!].size}, 1fr)`}}>
                                {grid.map((row, r) => row.map((letter, c) => (
                                    <div key={`${r}-${c}`} className="flex items-center justify-center text-xl sm:text-2xl font-bold bg-slate-800/80 rounded-sm sm:rounded-md aspect-square">
                                        {letter}
                                    </div>
                                )))}
                            </div>
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {foundWordPaths.map(p => renderHighlight(p.start, p.end, p.color, p.word))}
                                {isDragging && selection && renderHighlight(selection.start, selection.end, 'rgba(255,255,255,0.4)', 'selection')}
                                {hintPath && renderHighlight(hintPath.start, hintPath.end, hintPath.color, 'hint', 0.8)}
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WordFinderGame;