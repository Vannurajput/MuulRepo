import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeartIcon } from '../icons/HeartIcon';

// --- TYPES AND CONSTANTS ---
type GamePhase = 'watching' | 'shuffling' | 'guessing' | 'revealing';
const CUP_COUNT = 3;
const SHUFFLE_MOVES = 5;
const POSITIONS = [-120, 0, 120]; // Relative % translation

// --- SVG COMPONENTS ---
const Cup: React.FC<{ lifted: boolean }> = ({ lifted }) => (
    <div className={`w-24 h-28 md:w-32 md:h-36 relative transition-transform duration-300 ease-out ${lifted ? '-translate-y-16 md:-translate-y-20' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
                <radialGradient id="shell-game-cupGradient" cx="50%" cy="100%" r="90%" fx="50%" fy="100%">
                    <stop offset="0%" stopColor="#c0392b" />
                    <stop offset="100%" stopColor="#e74c3c" />
                </radialGradient>
            </defs>
            <path d="M 10 90 H 90 L 80 30 H 20 Z" fill="url(#shell-game-cupGradient)" />
            <ellipse cx="50" cy="30" rx="30" ry="10" fill="#c0392b" />
            <ellipse cx="50" cy="30" rx="28" ry="8" fill="#e74c3c" />
        </svg>
    </div>
);

const Ball: React.FC = () => (
    <div className="w-10 h-10 md:w-12 md:h-12 absolute bottom-2 left-1/2 -translate-x-1/2 z-0">
         <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
                <radialGradient id="shell-game-ballGradient" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#f1c40f" />
                    <stop offset="100%" stopColor="#f39c12" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#shell-game-ballGradient)" className="drop-shadow-md" />
        </svg>
    </div>
);

// --- MAIN GAME COMPONENT ---
const ShellGame: React.FC<{ onGameOver: (score: number, gameId: string) => void; }> = ({ onGameOver }) => {
    const [cups, setCups] = useState(() => Array.from({ length: CUP_COUNT }, (_, i) => ({ id: i, pos: i })));
    const [ballCupId, setBallCupId] = useState(1);
    const [phase, setPhase] = useState<GamePhase>('watching');
    const [liftedCupId, setLiftedCupId] = useState<number | null>(null);
    const [message, setMessage] = useState('Watch the ball!');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);

    const timeouts = useRef<number[]>([]);
    const clearTimeouts = () => timeouts.current.forEach(clearTimeout);

    const startRound = useCallback(() => {
        clearTimeouts();
        setPhase('watching');
        setMessage('Watch the ball!');
        setCups(Array.from({ length: CUP_COUNT }, (_, i) => ({ id: i, pos: i })));
        const newBallCupId = Math.floor(Math.random() * CUP_COUNT);
        setBallCupId(newBallCupId);
        
        timeouts.current.push(window.setTimeout(() => setLiftedCupId(newBallCupId), 500));
        timeouts.current.push(window.setTimeout(() => setLiftedCupId(null), 1500));
        timeouts.current.push(window.setTimeout(() => {
            setPhase('shuffling');
            setMessage('Shuffling...');
            
            // Generate shuffle sequence
            let sequence: { c1: number, c2: number }[] = [];
            for (let i = 0; i < SHUFFLE_MOVES + level; i++) {
                const c1 = Math.floor(Math.random() * CUP_COUNT);
                let c2;
                do {
                    c2 = Math.floor(Math.random() * CUP_COUNT);
                } while (c1 === c2);
                sequence.push({ c1, c2 });
            }

            const shuffleSpeed = Math.max(150, 400 - level * 20);
            sequence.forEach((move, index) => {
                timeouts.current.push(window.setTimeout(() => {
                    setCups(prevCups => {
                        const cup1 = prevCups.find(c => c.pos === move.c1)!;
                        const cup2 = prevCups.find(c => c.pos === move.c2)!;
                        return prevCups.map(c => {
                            if (c.id === cup1.id) return { ...c, pos: move.c2 };
                            if (c.id === cup2.id) return { ...c, pos: move.c1 };
                            return c;
                        });
                    });
                }, (index + 1) * shuffleSpeed));
            });

            timeouts.current.push(window.setTimeout(() => {
                setPhase('guessing');
                setMessage('Where is the ball?');
            }, (sequence.length + 1) * shuffleSpeed));

        }, 2000));
    }, [level]);

    useEffect(() => {
        startRound();
        return clearTimeouts;
    }, [startRound]);
    
    useEffect(() => {
        if (lives <= 0) {
            // Score is based on the level they failed on.
            // Completing level 1 gives 10 pts, level 2 gives 20, etc.
            const score = (level - 1) * 10;
            setTimeout(() => onGameOver(score, 'shell-game'), 1500);
        }
    }, [lives, level, onGameOver]);

    const handleCupClick = (cupId: number) => {
        if (phase !== 'guessing') return;

        setPhase('revealing');
        setLiftedCupId(cupId);

        if (cupId === ballCupId) {
            setMessage('You got it!');
            timeouts.current.push(window.setTimeout(() => {
                setLevel(l => l + 1);
                startRound();
            }, 2000));
        } else {
            setMessage('Try again!');
            setLives(l => l - 1);
            timeouts.current.push(window.setTimeout(() => {
                if (lives > 1) {
                    setLiftedCupId(ballCupId); // Show correct one
                    timeouts.current.push(window.setTimeout(startRound, 2000));
                }
            }, 1000));
        }
    };
    
    const shuffleSpeed = Math.max(0.15, 0.4 - level * 0.02);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-transparent overflow-hidden">
            <div className="absolute top-4 left-4 right-4 pl-20 flex justify-between items-center z-10">
                <div className="bg-slate-800/60 rounded-xl px-4 py-2">
                    <p className="text-2xl text-white">Level: <span className="font-bold text-cyan-400">{level}</span></p>
                </div>
                <div className="flex items-center bg-slate-800/60 rounded-xl px-4 py-2">
                    {Array.from({ length: lives }).map((_, i) => (
                        <HeartIcon key={i} className="w-8 h-8 text-red-500" />
                    ))}
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center relative w-full max-w-2xl">
                {cups.map(({ id, pos }) => (
                    <div
                        key={id}
                        onClick={() => handleCupClick(id)}
                        className={`absolute z-10 ${phase === 'guessing' ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{
                            transform: `translateX(${POSITIONS[pos]}%)`,
                            transition: `transform ${shuffleSpeed}s ease-in-out`,
                        }}
                    >
                        {id === ballCupId && <Ball />}
                        <Cup lifted={liftedCupId === id} />
                    </div>
                ))}
            </div>

            <div className="h-24 flex items-center justify-center">
                 <h2 className={`text-4xl font-bold text-white transition-all duration-300 ${phase === 'shuffling' ? 'opacity-50' : 'opacity-100'}`}>
                    {lives <= 0 ? 'Game Over!' : message}
                </h2>
            </div>
        </div>
    );
};

export default ShellGame;
