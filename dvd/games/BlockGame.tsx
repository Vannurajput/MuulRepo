
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ReplayIcon } from '../icons/ReplayIcon';
import { useBlockGame, TETROMINOES, BOARD_WIDTH, BOARD_HEIGHT } from '../../hooks/useBlockGame';
import type { TetrominoKey, Player, Board } from '../../hooks/useBlockGame';
import { HomeIcon } from '../icons/HomeIcon';


// --- Reusable UI Components ---

// A single block cell on the board with a glossy finish
const Block = React.memo(({ type }: { type: TetrominoKey }) => {
    // Transparent empty cell
    if (type === '0') {
        return <div className="bg-transparent" />;
    }

    const color = TETROMINOES[type].color;
    const style: React.CSSProperties = {
        background: `radial-gradient(circle at 65% 35%, rgba(255,255,255,0.7) 1%, rgba(255,255,255,0.4) 10%, transparent 40%), ${color}`,
        boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.5)`
    };

    return <div className="w-full h-full" style={style} />;
});

// The main game board grid, now with an internal galaxy theme
const GameBoard: React.FC<{ board: Board; player: Player | null }> = ({ board: staticBoard, player }) => {
    // Create a mutable copy to draw the player piece on
    const displayBoard = staticBoard.map(row => [...row]);

    // Draw the player's tetromino onto the board copy
    if (player) {
        player.tetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardY = y + player.pos.y;
                    const boardX = x + player.pos.x;
                    // Check bounds to prevent drawing outside the board
                    if (displayBoard[boardY]?.[boardX] !== undefined) {
                        displayBoard[boardY][boardX] = player.key;
                    }
                }
            });
        });
    }

    return (
        <div className="grid galaxy-bg bg-black/50 backdrop-blur-sm border-2 border-cyan-400/50 w-full h-full" style={{
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
            gap: '1px', // Creates the grid line effect
        }}>
            {displayBoard.map((row, y) => row.map((cell, x) => (
                <Block key={`${y}-${x}`} type={cell} />
            )))}
        </div>
    );
};

// --- On-Screen Control Icons ---
const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 md:w-10 md:h-10 ${className}`}>
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
    </svg>
);

const RotateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-7 h-7 md:w-8 md:h-8 ${className}`}>
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
);

const HardDropIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-8 h-8 md:w-10 md:h-10 ${className}`}>
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
);

// A more flexible D-pad button to handle different pointer events
const DpadButton: React.FC<{
    onClick?: () => void;
    onPointerDown?: (e: React.PointerEvent) => void;
    onPointerUp?: (e: React.PointerEvent) => void;
    onPointerLeave?: (e: React.PointerEvent) => void;
    children: React.ReactNode;
    ariaLabel: string;
    className?: string;
}> = ({ onClick, onPointerDown, onPointerUp, onPointerLeave, children, ariaLabel, className }) => {
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPointerDown) {
            onPointerDown(e);
        } else if (onClick) {
            onClick();
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!onPointerUp) return;
        e.preventDefault();
        e.stopPropagation();
        onPointerUp(e);
    };

    const handlePointerLeave = (e: React.PointerEvent) => {
        if (!onPointerLeave) return;
        e.preventDefault();
        e.stopPropagation();
        onPointerLeave(e);
    };

    return (
        <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className={`bg-slate-800/70 backdrop-blur-sm flex items-center justify-center text-white/80 shadow-lg border-2 border-slate-700 active:bg-cyan-500/50 active:scale-95 transition-all ${className}`}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
};

const GameHeader: React.FC<{
    score: number;
    onRestart: () => void;
    onQuit: () => void;
}> = ({ score, onRestart, onQuit }) => {
    return (
        <div className="absolute top-0 left-0 right-0 p-2 md:p-4 flex justify-between items-center z-20 h-16 md:h-20">
            <div className="flex items-center gap-2">
                <button onClick={onQuit} className="p-2 bg-slate-800/60 rounded-full hover:bg-slate-700/80 transition-colors" aria-label="Quit Game">
                    <HomeIcon className="w-7 h-7 text-white" />
                </button>
                <button onClick={onRestart} className="p-2 bg-slate-800/60 rounded-full hover:bg-slate-700/80 transition-colors" aria-label="Restart Game">
                    <ReplayIcon className="w-7 h-7 text-white" />
                </button>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-900/80 rounded-lg shadow-inner border border-slate-700 p-2 px-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Score</h3>
                <p className="text-3xl text-white font-mono">{score}</p>
            </div>
        </div>
    );
};


const BlockGame: React.FC<{ 
    onGameOver: (score: number, gameId: string) => void; 
    onShowQuitModal?: () => void;
}> = ({ onGameOver, onShowQuitModal }) => {
    const {
        board, player, score, isGameOver,
        startGame, movePlayer, rotatePlayer, hardDrop
    } = useBlockGame({ onGameOver });
    
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const moveIntervalRef = useRef<number | null>(null);

    const stopMove = useCallback(() => {
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
    }, []);

    const startMove = useCallback((dir: -1 | 1) => {
        if (isGameOver) return;
        stopMove();
        movePlayer(dir);
        moveIntervalRef.current = window.setInterval(() => {
            movePlayer(dir);
        }, 100);
    }, [isGameOver, movePlayer, stopMove]);

    useEffect(() => {
        return () => {
            stopMove(); // Cleanup on unmount
        };
    }, [stopMove]);

    useEffect(() => {
        startGame();
    }, [startGame]);

    useEffect(() => {
        if (!isGameOver) {
            gameContainerRef.current?.focus();
        }
    }, [isGameOver]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (isGameOver) return;
        e.preventDefault();
        switch (e.key) {
            case 'ArrowLeft': case 'a': movePlayer(-1); break;
            case 'ArrowRight': case 'd': movePlayer(1); break;
            case 'ArrowDown': case 's': hardDrop(); break; // Soft drop is handled by gravity
            case 'ArrowUp': case 'w': rotatePlayer(); break;
            case ' ': hardDrop(); break;
        }
    }, [isGameOver, movePlayer, hardDrop, rotatePlayer]);

    return (
        <div 
            ref={gameContainerRef}
            className="relative w-full h-full select-none outline-none touch-none overflow-hidden flex flex-col p-2 bg-[#0f172a]"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
             <style>{`
                @keyframes move-stars { from { background-position: 0 0; } to { background-position: -10000px 5000px; } }
                .galaxy-bg {
                    background-color: transparent; /* Let the parent show through */
                    background-image: 
                      radial-gradient(1px 1px at 20px 30px, #e2e8f0, rgba(0,0,0,0)),
                      radial-gradient(1px 1px at 40px 70px, #e2e8f0, rgba(0,0,0,0)),
                      radial-gradient(1px 1px at 80px 120px, #e2e8f0, rgba(0,0,0,0)),
                      radial-gradient(2px 2px at 160px 240px, #e2e8f0, rgba(0,0,0,0));
                    background-repeat: repeat;
                    background-size: 300px 300px;
                    animation: move-stars 200s linear infinite;
                }
                @keyframes shoot-star { 0% { transform: translate(150vw, -50vh) scale(0.5); opacity: 1; } 70% { transform: translate(-50vw, 50vh) scale(0.5); opacity: 1; } 100% { transform: translate(-100vw, 80vh) scale(0.5); opacity: 0; } }
                .shooting-star { position: absolute; top: 0; left: 0; width: 100px; height: 2px; background: linear-gradient(to left, #fff, rgba(255,255,255,0)); transform: rotate(-30deg); animation: shoot-star 8s linear infinite; animation-delay: 2s; }
            `}</style>

            <div className="shooting-star" />
            
            <GameHeader 
                score={score}
                onRestart={startGame}
                onQuit={onShowQuitModal ?? (() => {})}
            />

            <main className="w-full flex-grow flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-full max-w-[16rem] aspect-[10/20]">
                        {isGameOver && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-md">
                                <h3 className="text-4xl font-bold text-red-500">Game Over</h3>
                                <p className="text-white text-2xl mt-2">Score: {score}</p>
                                <button onClick={startGame} className="mt-6 px-6 py-3 bg-cyan-500 rounded-lg text-white font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors">
                                   <ReplayIcon className="w-6 h-6"/> Play Again
                                </button>
                            </div>
                        )}
                        <GameBoard board={board} player={player} />
                    </div>
                    
                    <footer className="w-full flex justify-center items-center">
                        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-48 h-48 md:w-56 md:h-56">
                            <DpadButton onClick={rotatePlayer} ariaLabel="Rotate" className="col-start-2 row-start-1 rounded-t-3xl">
                                <RotateIcon className="w-7 h-7 md:w-8 md:h-8" />
                            </DpadButton>
                            <DpadButton
                                onPointerDown={() => startMove(-1)}
                                onPointerUp={stopMove}
                                onPointerLeave={stopMove}
                                ariaLabel="Move Left" 
                                className="col-start-1 row-start-2 rounded-l-3xl"
                            >
                                <ArrowIcon className="transform -rotate-180 w-8 h-8 md:w-10 md:h-10" />
                            </DpadButton>
                    
                            <div className="col-start-2 row-start-2 bg-slate-900/50 rounded-full border-2 border-slate-700" />
                    
                            <DpadButton 
                                onPointerDown={() => startMove(1)}
                                onPointerUp={stopMove}
                                onPointerLeave={stopMove}
                                ariaLabel="Move Right" 
                                className="col-start-3 row-start-2 rounded-r-3xl"
                            >
                              <ArrowIcon className="w-8 h-8 md:w-10 md:h-10" />
                            </DpadButton>
                            <DpadButton onClick={hardDrop} ariaLabel="Hard Drop" className="col-start-2 row-start-3 rounded-b-3xl !bg-cyan-600/70 border-cyan-500">
                                <HardDropIcon className="w-8 h-8 md:w-10 md:h-10" />
                            </DpadButton>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default BlockGame;
