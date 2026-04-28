

import React, { useState, useEffect, useCallback, useRef } from 'react';

// A reusable Arrow Icon for the D-pad controls
const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
  </svg>
);

interface GameProps {
  onGameOver: (score: number, gameId: string) => void;
}

const GRID_SIZE = 20;
const INITIAL_SPEED = 300; // ms
const SPEED_INCREMENT = 5;

type Direction = { x: number; y: number };
type SnakeSegment = { x: number; y: number };
type Food = { x: number; y: number };
type Popup = { key: number; x: number; y: number; };
type Particle = { key: number; x: number; y: number; };

// Custom hook for game interval
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = React.useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

const SnakeGame: React.FC<GameProps> = ({ onGameOver }) => {
  const [snake, setSnake] = useState<SnakeSegment[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Food>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>({ x: 0, y: -1 }); // Start moving up
  const [speed, setSpeed] = useState<number | null>(INITIAL_SPEED);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);

  // Use a ref to hold the latest score, so endGame doesn't need score as a dependency.
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const generateFood = useCallback((currentSnake: SnakeSegment[]) => {
    let newFoodPosition: Food;
    do {
      newFoodPosition = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
    setFood(newFoodPosition);
  }, []);

  useEffect(() => {
    // Generate the initial food in a safe spot away from the initial snake.
    generateFood([{ x: 10, y: 10 }]);
  }, [generateFood]);

  useEffect(() => {
    if (isGameOver) return;
    let blinkTimeout: number;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        blinkTimeout = window.setTimeout(blink, Math.random() * 4000 + 2000);
      }, 200);
    };
    const initialBlinkTimeout = setTimeout(blink, Math.random() * 4000 + 2000);

    return () => {
      clearTimeout(initialBlinkTimeout);
      clearTimeout(blinkTimeout);
    };
  }, [isGameOver]);

  const addEatEffect = useCallback((x: number, y: number) => {
    const popupKey = Date.now();
    const newPopup: Popup = { key: popupKey, x, y };
    setPopups(currentPopups => [...currentPopups, newPopup]);
    setTimeout(() => {
      setPopups(currentPopups => currentPopups.filter(p => p.key !== popupKey));
    }, 1000);

    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      key: Date.now() + i, x, y,
    }));
    setParticles(currentParticles => [...currentParticles, ...newParticles]);
    setTimeout(() => {
      setParticles(currentParticles => currentParticles.filter(p => !newParticles.some(np => np.key === p.key)));
    }, 1000);
  }, []);

  const endGame = useCallback(() => {
    setIsGameOver(true);
    setSpeed(null);
    // Use the score ref to avoid dependency on score state
    setTimeout(() => onGameOver(scoreRef.current, 'snake'), 500);
  }, [onGameOver]);

  const gameLoop = useCallback(() => {
    if (isGameOver) return;
    setSnake(prevSnake => {
      const currentHead = prevSnake[0];
      const newHead = { x: currentHead.x + direction.x, y: currentHead.y + direction.y };

      const isCollision =
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y);

      if (isCollision) {
        endGame();
        return prevSnake;
      }

      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const newSnakeBody = ateFood ? prevSnake : prevSnake.slice(0, -1);
      const newSnake = [newHead, ...newSnakeBody];

      if (ateFood) {
        setScore(s => s + 1);
        addEatEffect(food.x, food.y);
        setSpeed(s => (s ? Math.max(50, s - SPEED_INCREMENT) : null));
        generateFood(newSnake);
      }
      return newSnake;
    });
  }, [direction, food, isGameOver, endGame, generateFood, addEatEffect]);

  useInterval(gameLoop, speed);
  
  const changeDirection = useCallback((newDirection: Direction) => {
      setDirection(currentDirection => {
        if (currentDirection.x + newDirection.x !== 0 || currentDirection.y + newDirection.y !== 0) {
            return newDirection;
        }
        return currentDirection;
      });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    switch (e.key) {
      case 'ArrowUp': case 'w': changeDirection({ x: 0, y: -1 }); break;
      case 'ArrowDown': case 's': changeDirection({ x: 0, y: 1 }); break;
      case 'ArrowLeft': case 'a': changeDirection({ x: -1, y: 0 }); break;
      case 'ArrowRight': case 'd': changeDirection({ x: 1, y: 0 }); break;
    }
  }, [changeDirection]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const boardDimension = `min(90vw, 70vh, 500px)`;
  const cellDimension = `calc(${boardDimension} / ${GRID_SIZE})`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#4a752c] p-2 sm:p-4 touch-none">
       <style>{`
        @keyframes popup {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(-30px) scale(1.2); opacity: 0; }
        }
        .animate-popup { animation: popup 1s ease-out forwards; }
        
        @keyframes particle-burst {
          from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          to { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .animate-particle-burst { animation: particle-burst 0.8s ease-out forwards; }

        @keyframes game-over-flash {
          0%, 100% { background-color: #dc2626; } /* red-600 */
          50% { background-color: #f87171; } /* red-400 */
        }
        .game-over-flash { animation: game-over-flash 0.5s infinite; }

        .snake-board {
            width: ${boardDimension};
            height: ${boardDimension};
            background-color: #a7d36a;
            background-image: 
              linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
            background-size: ${cellDimension} ${cellDimension};
        }
      `}</style>
      <div className="w-full max-w-lg text-center mb-4">
        <p className="text-2xl mt-2 text-lime-200">Score: <span className="font-bold text-yellow-300">{score}</span></p>
      </div>

      <div
        className="relative snake-board border-4 border-[#6f9a45] shadow-lg rounded-md overflow-hidden"
      >
        {isGameOver ? (
          <div className="w-full h-full flex items-center justify-center text-red-100 bg-red-800/50 text-3xl md:text-4xl font-bold animate-pulse">
              GAME OVER
          </div>
        ) : (
          <>
            {/* Snake */}
            {snake.map((segment, index) => {
                const isHead = index === 0;
                const style: React.CSSProperties = {
                    position: 'absolute',
                    width: cellDimension,
                    height: cellDimension,
                    top: `calc(${segment.y} * ${cellDimension})`,
                    left: `calc(${segment.x} * ${cellDimension})`,
                    transition: `all ${speed ? speed / 1000 : 0.1}s linear`,
                    borderRadius: '25%',
                };
                
                if (isHead) {
                    let rotation = '0deg';
                    if (direction.x === 1) rotation = '90deg';
                    else if (direction.x === -1) rotation = '-90deg';
                    else if (direction.y === 1) rotation = '180deg';
                    
                    return (
                        <div key={index} style={style} className={`bg-blue-500 z-10 flex items-center justify-center p-0.5 ${isGameOver ? 'game-over-flash' : ''}`}>
                            <div className="w-full h-full bg-blue-500 rounded-[20%] relative flex items-center justify-center">
                                <div className="flex w-3/4 justify-around" style={{transform: `rotate(${rotation})`}}>
                                    <div className="w-1/4 h-1/4 bg-white rounded-full flex items-center justify-center"><div className={`w-1/2 rounded-full bg-black transition-all duration-100 ${isBlinking ? 'h-[2px]' : 'h-1/2'}`}/></div>
                                    <div className="w-1/4 h-1/4 bg-white rounded-full flex items-center justify-center"><div className={`w-1/2 rounded-full bg-black transition-all duration-100 ${isBlinking ? 'h-[2px]' : 'h-1/2'}`}/></div>
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div key={index} style={style} className={`bg-gradient-to-br from-blue-400 to-blue-500 ${isGameOver ? 'game-over-flash' : ''}`} />
                    );
                }
            })}

            {/* Food */}
            <div
              className="flex items-center justify-center animate-pulse"
              style={{
                position: 'absolute',
                width: cellDimension,
                height: cellDimension,
                top: `calc(${food.y} * ${cellDimension})`,
                left: `calc(${food.x} * ${cellDimension})`,
                fontSize: `calc(${cellDimension} * 0.8)`,
              }}
            >
              🍎
            </div>

            {/* Popups & Particles */}
            {popups.map(p => (
                <div
                    key={p.key}
                    className="absolute text-orange-500 font-bold text-xl animate-popup pointer-events-none z-20"
                    style={{
                        top: `calc(${p.y} * ${cellDimension})`,
                        left: `calc(${p.x} * ${cellDimension})`,
                        transform: 'translateX(25%)',
                    }}
                >
                    +1
                </div>
            ))}
            {particles.map(p => {
                const angle = Math.random() * 2 * Math.PI;
                const distance = 40;
                const tx = `${Math.cos(angle) * distance - 50}%`;
                const ty = `${Math.sin(angle) * distance - 50}%`;
                
                return (
                    <div
                        key={p.key}
                        className="absolute animate-particle-burst pointer-events-none z-20"
                        style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#ef4444', // red-500
                            borderRadius: '50%',
                            top: `calc((${p.y} + 0.5) * ${cellDimension})`,
                            left: `calc((${p.x} + 0.5) * ${cellDimension})`,
                            '--tx': tx,
                            '--ty': ty,
                        } as React.CSSProperties}
                    />
                );
            })}
          </>
        )}
      </div>
      
      {!isGameOver && (
          <div className="grid grid-cols-3 grid-rows-3 gap-2 mt-6 w-48 h-48 sm:w-56 sm:h-56">
            <div />
            <button aria-label="Move Up" onClick={() => changeDirection({x: 0, y: -1})} className="col-start-2 row-start-1 bg-sky-500 rounded-lg shadow-md active:bg-sky-600 active:scale-95 transition-transform flex items-center justify-center"><ArrowIcon className="w-10 h-10 text-white transform -rotate-90" /></button>
            <div />
            <button aria-label="Move Left" onClick={() => changeDirection({x: -1, y: 0})} className="col-start-1 row-start-2 bg-sky-500 rounded-lg shadow-md active:bg-sky-600 active:scale-95 transition-transform flex items-center justify-center"><ArrowIcon className="w-10 h-10 text-white transform rotate-180" /></button>
            <div />
            <button aria-label="Move Right" onClick={() => changeDirection({x: 1, y: 0})} className="col-start-3 row-start-2 bg-sky-500 rounded-lg shadow-md active:bg-sky-600 active:scale-95 transition-transform flex items-center justify-center"><ArrowIcon className="w-10 h-10 text-white" /></button>
            <div />
            <button aria-label="Move Down" onClick={() => changeDirection({x: 0, y: 1})} className="col-start-2 row-start-3 bg-sky-500 rounded-lg shadow-md active:bg-sky-600 active:scale-95 transition-transform flex items-center justify-center"><ArrowIcon className="w-10 h-10 text-white transform rotate-90" /></button>
            <div />
          </div>
      )}
    </div>
  );
};

export default SnakeGame;
