
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HeartIcon } from '../icons/HeartIcon';
import { 
    Basket, 
    FRUITS, 
    CRITTERS, 
    BASKET_WIDTH_PERCENT, 
    BASKET_ASPECT_RATIO, 
    BASKET_BOTTOM_PERCENT, 
    type Item 
} from './FruitCatcherAssets';


// --- Game Logic Hook ---

const useFruitCatcher = ({ onGameOver }: { onGameOver: (score: number, gameId: string) => void }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [items, setItems] = useState<Item[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameDimensions, setGameDimensions] = useState({ width: 0, height: 0 });

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const itemLoopId = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(performance.now());

  const itemsRef = useRef<Item[]>(items);
  itemsRef.current = items;

  const basketElementRef = useRef<HTMLDivElement | null>(null);
  const currentBasketX = useRef<number>(50); // percentage

  const scoreRef = useRef<number>(0);
  scoreRef.current = score;

  const basketWidth = Math.min(150, gameDimensions.width * (BASKET_WIDTH_PERCENT / 100));
  const basketHeight = basketWidth / BASKET_ASPECT_RATIO;

  // Track game area size
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const observer = new ResizeObserver(() => {
      setGameDimensions({
        width: gameArea.offsetWidth,
        height: gameArea.offsetHeight,
      });
    });
    observer.observe(gameArea);

    setGameDimensions({
      width: gameArea.offsetWidth,
      height: gameArea.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  const createItem = useCallback((currentScore: number) => {
    const dims = gameDimensions;
    if (dims.width === 0) return;

    const isFruit = Math.random() > 0.2;
    const itemData = isFruit
      ? FRUITS[Math.floor(Math.random() * FRUITS.length)]
      : CRITTERS[Math.floor(Math.random() * CRITTERS.length)];

    const newItem: Item = {
      id: Date.now() + Math.random(),
      type: itemData.type,
      component: itemData.component,
      x: Math.random() * 90 + 5, // 5% - 95%
      y: -80,
      speed: (dims.height / 350) + (Math.random() * (dims.height / 500)) + (currentScore / 400),
      rotation: Math.random() * 40 - 20,
      size: Math.min(100, dims.width * 0.12 + Math.random() * (dims.width * 0.05)),
    };
    setItems(prev => [...prev, newItem]);
  }, [gameDimensions]);

  // Main game loop
  useEffect(() => {
    if (isGameOver || gameDimensions.height === 0) {
      if (itemLoopId.current !== null) cancelAnimationFrame(itemLoopId.current);
      return;
    }

    const gameLoop = () => {
      const gameAreaHeight = gameDimensions.height;
      const gameAreaWidth = gameDimensions.width;

      const basketBottomOffset = gameAreaHeight * (BASKET_BOTTOM_PERCENT / 100);
      const basketRect = {
        left: (currentBasketX.current / 100) * gameAreaWidth - basketWidth / 2,
        right: (currentBasketX.current / 100) * gameAreaWidth + basketWidth / 2,
        top: gameAreaHeight - basketBottomOffset - basketHeight,
        bottom: gameAreaHeight - basketBottomOffset,
      };

      const currentItems = itemsRef.current;
      const newPositions = currentItems.map(item => ({ ...item, y: item.y + item.speed }));
      const itemsToKeep: Item[] = [];
      let pointsToAdd = 0;
      let livesToLose = 0;

      for (const item of newPositions) {
        const itemCenterX = (item.x / 100) * gameAreaWidth;
        const itemBottomY = item.y + item.size;

        const intersectsBasket =
          itemBottomY >= basketRect.top &&
          item.y < basketRect.bottom &&
          itemCenterX > basketRect.left &&
          itemCenterX < basketRect.right;

        if (intersectsBasket) {
          if (item.type === 'fruit') {
            pointsToAdd += (FRUITS.find(f => f.component === item.component)?.points || 10);
          } else {
            livesToLose += 1;
          }
        } else if (item.y > gameAreaHeight) {
          if (item.type === 'fruit') {
            livesToLose += 1;
          }
        } else {
          itemsToKeep.push(item);
        }
      }

      setItems(itemsToKeep);

      if (pointsToAdd > 0) setScore(s => s + pointsToAdd);
      if (livesToLose > 0) setLives(l => Math.max(0, l - livesToLose));

      const spawnInterval = Math.max(400, 1200 - scoreRef.current);
      if (performance.now() - lastSpawnTimeRef.current > spawnInterval) {
        createItem(scoreRef.current);
        lastSpawnTimeRef.current = performance.now();
      }

      itemLoopId.current = requestAnimationFrame(gameLoop);
    };

    const initialSpawnTimeout = window.setTimeout(() => createItem(scoreRef.current), 500);
    itemLoopId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (itemLoopId.current !== null) cancelAnimationFrame(itemLoopId.current);
      window.clearTimeout(initialSpawnTimeout);
    };
  }, [isGameOver, createItem, gameDimensions, basketWidth, basketHeight]);

  // Game over check
  useEffect(() => {
    if (lives <= 0 && !isGameOver) {
      setIsGameOver(true);
      setTimeout(() => onGameOver(scoreRef.current, 'fruit-catcher'), 1500);
    }
  }, [lives, isGameOver, onGameOver]);

  // Pointer movement for direct manipulation
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGameOver || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(
      BASKET_WIDTH_PERCENT / 2,
      Math.min(100 - BASKET_WIDTH_PERCENT / 2, newX)
    );

    // Update both the ref for collision logic and the element's style directly for max responsiveness
    currentBasketX.current = clampedX;
    if (basketElementRef.current) {
      basketElementRef.current.style.left = `${clampedX}%`;
    }
  };

  // Capture pointer on down event to ensure smooth dragging on touch devices
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    handlePointerMove(e);
  };

  return {
    score,
    lives,
    items,
    isGameOver,
    gameAreaRef,
    basketElementRef,
    handlePointerMove,
    handlePointerDown,
    basketWidth,
  };
};

// --- Main Game Component ---

const FruitCatcherGame: React.FC<{ onGameOver: (score: number, gameId: string) => void }> = ({ onGameOver }) => {
  const {
    score,
    lives,
    items,
    isGameOver,
    gameAreaRef,
    basketElementRef,
    handlePointerMove,
    handlePointerDown,
    basketWidth,
  } = useFruitCatcher({ onGameOver });

  return (
    <div
      className="w-full h-full relative overflow-hidden select-none bg-transparent touch-none"
      ref={gameAreaRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      <div className="absolute top-4 left-4 right-4 pl-20 flex justify-between items-center z-10">
        <div className="bg-black/50 rounded-full px-6 py-2 text-2xl text-white font-bold shadow-lg">Score: {score}</div>
        <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 shadow-lg">
          {Array.from({ length: lives }).map((_, i) => (
            <HeartIcon key={i} className="w-8 h-8 text-red-500 animate-pulse drop-shadow-lg" />
          ))}
        </div>
      </div>

      <h1 className="absolute top-5 left-1/2 -translate-x-1/2 text-3xl font-bold text-white/90 drop-shadow-lg z-10 pointer-events-none">
        Fruit Catcher
      </h1>

      {items.map(item => {
        const ItemComponent = item.component;
        return (
          <ItemComponent
            key={item.id}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: item.y,
              width: item.size,
              height: 'auto',
              transform: `translateX(-50%) rotate(${item.rotation}deg)`,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      <div
        ref={basketElementRef}
        style={{
          position: 'absolute',
          bottom: `${BASKET_BOTTOM_PERCENT}%`,
          left: '50%', // This is the initial position, JS will update it.
          width: `${basketWidth}px`,
          height: 'auto',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      >
        <Basket style={{ width: '100%', height: 'auto' }} />
      </div>

      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-fade-in">
          <h2 className="text-6xl font-bold text-red-500 animate-pulse drop-shadow-lg">Game Over</h2>
        </div>
      )}
    </div>
  );
};

export default FruitCatcherGame;
