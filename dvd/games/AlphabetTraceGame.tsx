

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const LETTER_DATA: { [key: string]: { path: string } } = {
    'A': { path: "M 25,85 L 50,15 L 75,85 M 37.5,55 H 62.5" },
    'B': { path: "M 30,15 V 85 M 30,15 C 70,15 70,50 30,50 M 30,50 C 75,50 75,85 30,85" },
    'C': { path: "M 80,30 A 35,35 0 1 0 80,70" },
    'D': { path: "M 30,15 V 85 C 80,85 80,15 30,15" },
    'E': { path: "M 75,15 H 25 V 85 H 75 M 25,50 H 65" },
    'F': { path: "M 25,15 H 75 M 25,15 V 85 M 25,50 H 65" },
    'G': { path: "M 80,30 A 35,35 0 1 0 80,70 L 80,60 H 55" },
    'H': { path: "M 25,15 V 85 M 75,15 V 85 M 25,50 H 75" },
    'I': { path: "M 50,15 V 85" },
    'J': { path: "M 75,15 V 70 C 75,90 25,90 25,70" },
    'K': { path: "M 25,15 V 85 M 75,15 L 45,50 L 75,85" },
    'L': { path: "M 25,15 V 85 H 75" },
    'M': { path: "M 20,85 V 15 L 50,55 L 80,15 V 85" },
    'N': { path: "M 20,85 V 15 L 80,85 V 15" },
    'O': { path: "M 50,50 m -30,0 a 30,30 0 1,0 60,0 a 30,30 0 1,0 -60,0" },
    'P': { path: "M 25,15 V 85 M 25,15 C 75,15 75,50 25,50" },
    'Q': { path: "M 50,50 m -30,0 a 30,30 0 1,0 60,0 a 30,30 0 1,0 -60,0 M 65,65 L 85,85" },
    'R': { path: "M 25,15 V 85 M 25,15 C 75,15 75,50 25,50 M 50,50 L 75,85" },
    'S': { path: "M 75,25 C 25,25 25,50 50,50 C 75,50 75,75 25,75" },
    'T': { path: "M 15,15 H 85 M 50,15 V 85" },
    'U': { path: "M 25,15 V 70 C 25,90 75,90 75,70 V 15" },
    'V': { path: "M 20,15 L 50,85 L 80,15" },
    'W': { path: "M 15,15 L 35,85 L 50,40 L 65,85 L 85,15" },
    'X': { path: "M 20,15 L 80,85 M 80,15 L 20,85" },
    'Y': { path: "M 20,15 L 50,50 V 85 M 80,15 L 50,50" },
    'Z': { path: "M 20,15 H 80 L 20,85 H 80" }
};

const CHECKPOINT_DENSITY = 10; // pixels per checkpoint
const SUCCESS_THRESHOLD = 0.7; // 70% of checkpoints must be covered
const PROXIMITY_THRESHOLD = 25; // pixels within which a checkpoint is considered "hit"

const AlphabetTraceGame: React.FC<GameProps> = () => {
  const [letterIndex, setLetterIndex] = useState(0);
  const [drawnPoints, setDrawnPoints] = useState<{ x: number, y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [checkpoints, setCheckpoints] = useState<{ x: number, y: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const guidePathRef = useRef<SVGPathElement>(null);

  const currentLetter = ALPHABET[letterIndex];
  const currentLetterData = LETTER_DATA[currentLetter];

  useEffect(() => {
    // Generate checkpoints for the current letter
    if (guidePathRef.current) {
        const path = guidePathRef.current;
        const length = path.getTotalLength();
        const newCheckpoints = [];
        for (let i = 0; i < length; i += CHECKPOINT_DENSITY) {
            const point = path.getPointAtLength(i);
            newCheckpoints.push({ x: point.x, y: point.y });
        }
        setCheckpoints(newCheckpoints);
    }
  }, [letterIndex]);

  const resetForNextLetter = useCallback(() => {
    setIsComplete(false);
    setDrawnPoints([]);
    setFeedback(null);
  }, []);

  const getPointerPosition = (e: React.PointerEvent) => {
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isComplete || feedback) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const pos = getPointerPosition(e);
    if (pos) setDrawnPoints([pos]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const pos = getPointerPosition(e);
    if (pos) setDrawnPoints(prev => [...prev, pos]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (drawnPoints.length < 5) {
      setTimeout(() => setDrawnPoints([]), 500);
      return;
    }
    
    const coveredCheckpoints = new Set();
    const svgToScreenRatio = (gameAreaRef.current?.clientWidth || 100) / 100;

    drawnPoints.forEach(p => {
        checkpoints.forEach((cp, index) => {
            const dist = Math.hypot(p.x - (cp.x * svgToScreenRatio), p.y - (cp.y * svgToScreenRatio));
            if (dist < PROXIMITY_THRESHOLD) {
                coveredCheckpoints.add(index);
            }
        });
    });

    const coverage = checkpoints.length > 0 ? coveredCheckpoints.size / checkpoints.length : 0;

    if (coverage >= SUCCESS_THRESHOLD) {
        setFeedback({ message: 'Great Job!', type: 'success' });
        setIsComplete(true);
        setTimeout(() => {
            setLetterIndex(prev => (prev + 1) % ALPHABET.length);
            resetForNextLetter();
        }, 2000);
    } else {
        setFeedback({ message: 'Try Again!', type: 'error' });
        setTimeout(() => {
            setDrawnPoints([]);
            setFeedback(null);
        }, 1500);
    }
  };

  const buildPathData = (points: {x: number, y: number}[]) => {
      if (points.length < 1) return "";
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  return (
    <div 
        className="w-full h-full flex flex-col items-center justify-center bg-purple-700 p-2 sm:p-4 text-white overflow-hidden relative select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
      <style>{`
          @keyframes draw-in { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
          .animate-draw-in { animation: draw-in 1s ease-out forwards; stroke-dasharray: 1000; }
          @keyframes feedback-pop { 
            0% { transform: translateY(20px) scale(0.8); opacity: 0; }
            50% { transform: translateY(0) scale(1.1); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
          .feedback-anim { animation: feedback-pop 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards; }
          .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
          @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>

      <div className="absolute inset-0 z-0 pointer-events-none opacity-10" style={{backgroundImage: 'url("/images/star-pattern.svg")', backgroundSize: '300px'}}></div>
      
      <div className="relative w-full max-w-lg aspect-square flex items-center justify-center z-10" ref={gameAreaRef}>
        <svg viewBox="0 0 100 100" className="absolute w-full h-full">
            {/* The background guide path */}
            <path
                d={currentLetterData.path}
                stroke="#4a044e"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={isComplete ? 0.3 : 0.4}
            />
            {/* The dashed line to trace on */}
            <path
                d={currentLetterData.path}
                stroke="white"
                strokeWidth="2"
                strokeDasharray="3 5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={isComplete || isDrawing ? 0 : 0.5}
            />

            {/* The invisible path for getting points */}
            <path d={currentLetterData.path} ref={guidePathRef} fill="none" stroke="none" />
        </svg>

        {/* User's drawing SVG */}
        <svg className="absolute w-full h-full" onPointerDown={handlePointerDown}>
             <path
                d={buildPathData(drawnPoints)}
                stroke="#22d3ee"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className={feedback?.type === 'error' ? 'shake' : ''}
                style={{ filter: 'drop-shadow(0 0 8px #22d3ee)' }}
            />
        </svg>

         {/* Letter fill on completion */}
        {isComplete && (
            <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                <path
                   d={currentLetterData.path}
                   stroke="#fff"
                   strokeWidth="18"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   fill="none"
                   className="animate-draw-in"
                />
            </svg>
        )}
      </div>

      <div className="h-16 mt-4 flex items-center justify-center">
        {feedback && (
          <div className={`feedback-anim text-4xl font-bold drop-shadow-lg ${feedback.type === 'success' ? 'text-lime-300' : 'text-red-400'}`}>
            {feedback.message}
          </div>
        )}
        {!feedback && (
          <h2 className="text-3xl font-bold drop-shadow-lg text-center">
            Trace the letter <span className="text-yellow-300">{currentLetter}</span>
          </h2>
        )}
      </div>
    </div>
  );
};

export default AlphabetTraceGame;