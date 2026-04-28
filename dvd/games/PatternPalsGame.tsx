

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeartIcon } from '../icons/HeartIcon';

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const shapes = ['circle', 'square', 'triangle'];
const colors = ['#22d3ee', '#a78bfa', '#60a5fa', '#2dd4bf', '#d946ef'];

interface ShapeObject {
  shape: string;
  color: string;
}

const PatternPalsGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [pattern, setPattern] = useState<ShapeObject[]>([]);
  const [options, setOptions] = useState<ShapeObject[]>([]);
  const [answer, setAnswer] = useState<ShapeObject | null>(null);

  // New state for drag and drop
  const [dragging, setDragging] = useState<{ piece: ShapeObject, index: number, offset: {x: number, y: number} } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number, y: number } | null>(null);
  const [isOverTarget, setIsOverTarget] = useState(false);
  const dropTargetRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<{type: 'correct' | 'wrong', pos: {x: number, y: number}} | null>(null);

  const generatePattern = useCallback(() => {
    const patternType = Math.random() < 0.5 ? 'ABAB' : 'AABB';
    const itemA: ShapeObject = { shape: shapes[Math.floor(Math.random() * shapes.length)], color: colors[Math.floor(Math.random() * colors.length)] };
    let itemB: ShapeObject;
    do {
      itemB = { shape: shapes[Math.floor(Math.random() * shapes.length)], color: colors[Math.floor(Math.random() * colors.length)] };
    } while (itemA.shape === itemB.shape && itemA.color === itemB.color);

    let newPattern: ShapeObject[] = [];
    let newAnswer: ShapeObject;

    if (patternType === 'ABAB') {
      newPattern = [itemA, itemB, itemA];
      newAnswer = itemB;
    } else { // AABB
      newPattern = [itemA, itemA, itemB];
      newAnswer = itemB;
    }
    
    setPattern(newPattern);
    setAnswer(newAnswer);

    const newOptions = new Set<ShapeObject>([newAnswer]);
    while (newOptions.size < 4) {
      const randomShape = { shape: shapes[Math.floor(Math.random() * shapes.length)], color: colors[Math.floor(Math.random() * colors.length)] };
      // This stringify trick is a simple way to check for object uniqueness
      if (!Array.from(newOptions).some(opt => JSON.stringify(opt) === JSON.stringify(randomShape))) {
        newOptions.add(randomShape);
      }
    }
    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    generatePattern();
  }, [generatePattern]);

  useEffect(() => {
    if (lives <= 0) {
      setTimeout(() => onGameOver(score, 'pattern-pals'), 1500);
    }
  }, [lives, score, onGameOver]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>, option: ShapeObject, index: number) => {
    if (lives <= 0 || dragging || feedback) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging({ 
        piece: option, 
        index, 
        offset: { x: e.clientX - rect.left, y: e.clientY - rect.top }
    });
    setDragPos({ x: e.clientX, y: e.clientY });
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragPos({ x: e.clientX, y: e.clientY });
      
      const target = dropTargetRef.current;
      if (target) {
          const rect = target.getBoundingClientRect();
          const over = e.clientX >= rect.left && e.clientX <= rect.right &&
                       e.clientY >= rect.top && e.clientY <= rect.bottom;
          setIsOverTarget(over);
      }
  };

  const handlePointerUp = () => {
      if (!dragging) return;
      
      const dropPos = { ...dragPos! };

      if (isOverTarget) {
          if (dragging.piece.shape === answer?.shape && dragging.piece.color === answer?.color) {
              setScore(s => s + 1);
              setFeedback({type: 'correct', pos: dropPos});
              setTimeout(() => {
                  generatePattern();
                  setFeedback(null);
              }, 800);
          } else {
              setLives(l => l - 1);
              setFeedback({type: 'wrong', pos: dropPos});
              setTimeout(() => setFeedback(null), 800);
          }
      }

      setDragging(null);
      setDragPos(null);
      setIsOverTarget(false);
  };
  
  const ShapeComponent: React.FC<{ item: ShapeObject; className?: string }> = ({ item, className = "w-20 h-20" }) => {
    const commonProps = {
        className: `w-full h-full`,
        style: { color: item.color },
        viewBox: "0 0 100 100",
        preserveAspectRatio: "xMidYMid meet"
    };

    let shapeSvg;
    switch (item.shape) {
        case 'circle':
            shapeSvg = <svg {...commonProps}><circle cx="50" cy="50" r="50" fill="currentColor" /></svg>;
            break;
        case 'square':
            shapeSvg = <svg {...commonProps}><rect width="100" height="100" fill="currentColor" /></svg>;
            break;
        case 'triangle':
            shapeSvg = <svg {...commonProps}><path d="M50 0 L100 100 L0 100 Z" fill="currentColor" /></svg>;
            break;
        default:
            shapeSvg = null;
    }
    
    return <div className={className}>{shapeSvg}</div>;
  };

  return (
    <div 
        className="w-full h-full flex flex-col items-center justify-center bg-transparent p-2 sm:p-4 relative touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
    >
       <style>{`
          @keyframes pop-out {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1.5) translateY(-30px); opacity: 0; }
          }
          .animate-pop-out {
              animation: pop-out 0.8s ease-out forwards;
              text-shadow: 0 0 10px rgba(0,0,0,0.5);
          }
      `}</style>
      <div className="absolute top-4 left-4 right-4 pl-16 flex justify-between items-center z-10">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-1 sm:py-2 border border-slate-600/50">
          <p className="text-xl sm:text-3xl text-slate-200">Score: <span className="font-bold text-cyan-400">{score}</span></p>
        </div>
        <div className="flex items-center bg-slate-800/60 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-1 sm:py-2 border border-slate-600/50 gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <HeartIcon key={i} className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 drop-shadow-lg" />
          ))}
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center flex-grow w-full pt-16 sm:pt-0">
        {lives > 0 ? (
          <>
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-6 sm:mb-8 h-16 sm:h-24">
                {pattern.map((item, index) => <ShapeComponent key={index} item={item} className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20" />)}
                <div 
                    ref={dropTargetRef}
                    className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-4 border-dashed rounded-lg flex items-center justify-center text-4xl sm:text-5xl transition-all duration-300
                        ${isOverTarget ? 'border-cyan-400 bg-cyan-500/20 scale-110' : 'border-slate-600'}
                        ${isOverTarget ? 'text-cyan-300' : 'text-slate-500'}
                    `}
                >
                    ?
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {options.map((option, index) => (
                <button 
                  key={index} 
                  onPointerDown={(e) => handlePointerDown(e, option, index)} 
                  className={`p-1 sm:p-2 bg-slate-800/80 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-slate-700 hover:border-cyan-500
                    ${(dragging?.index === index || feedback) ? 'opacity-30' : ''}
                    ${dragging ? 'cursor-grabbing' : 'cursor-grab'}
                  `}
                  disabled={!!feedback}
                >
                  <ShapeComponent item={option} className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24" />
                </button>
              ))}
            </div>
          </>
        ) : (
           <div className="text-6xl font-bold text-red-500 animate-pulse">GAME OVER</div>
        )}
      </div>

      {dragging && dragPos && (
        <div 
            className="absolute top-0 left-0 pointer-events-none z-50"
            style={{ transform: `translate(${dragPos.x - dragging.offset.x}px, ${dragPos.y - dragging.offset.y}px) scale(1.1)` }}
        >
            <div className="p-1 sm:p-2">
                <ShapeComponent item={dragging.piece} className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 drop-shadow-2xl" />
            </div>
        </div>
      )}
      {feedback && (
          <div 
            className="absolute top-0 left-0 text-5xl pointer-events-none z-50"
            style={{ transform: `translate(${feedback.pos.x - 50}px, ${feedback.pos.y - 50}px)` }}
          >
              <span className={`animate-pop-out`}>
                {feedback.type === 'correct' ? '🎉' : '❌'}
              </span>
          </div>
      )}
    </div>
  );
};

export default PatternPalsGame;
