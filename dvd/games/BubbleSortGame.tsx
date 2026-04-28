
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { StarIcon } from '../icons/StarIcon';
import { ColorMatchIcon } from '../icons/ColorMatchIcon';
import { CritterIcon } from '../icons/CritterIcon';

// --- Game Constants ---
const BUBBLE_COLORS = ['#0d87ff', '#00d5ff', '#ff3e3e', '#ffef41', '#00f862', '#a239ff'];
const BOMB_COLOR = '#333333';
const STAR_POWER_COLOR = 'STAR';
const COLOR_BOMB_COLOR = 'COLOR_BOMB';
const GRID_ROWS = 12;
const GRID_COLS = 11;

// --- Original Design Dimensions (for reference and aspect ratio) ---
const ORIGINAL_BUBBLE_DIAMETER = 36;
const ORIGINAL_GAME_WIDTH = GRID_COLS * ORIGINAL_BUBBLE_DIAMETER;
const ORIGINAL_GAME_HEIGHT = 560;
const ORIGINAL_PROJECTILE_SPEED = 18;

// --- Types ---
interface Bubble {
  id: number;
  color: string;
  row: number;
  col: number;
  isPopping?: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface PoppedStar {
    id: number;
    x: number;
    y: number;
}

// --- Helper Functions ---
const getNeighbors = (targetBubble: Bubble, board: Bubble[], getBubbleXY: (r:number,c:number) => {x:number, y:number}, bubbleDiameter: number): Bubble[] => {
    return board.filter(b => {
        if (b.id === targetBubble.id) return false;
        const { x: bX, y: bY } = getBubbleXY(b.row, b.col);
        const { x: targetX, y: targetY } = getBubbleXY(targetBubble.row, targetBubble.col);
        const dist = Math.hypot(bX - targetX, bY - targetY);
        return dist < bubbleDiameter * 1.2;
    });
};

// --- Child Components ---

const GlossyBubble = React.memo(({ color, children, diameter }: { color: string, children?: React.ReactNode, diameter: number }) => {
    const isBomb = color === BOMB_COLOR;
    const isStar = color === STAR_POWER_COLOR;
    const isColorBomb = color === COLOR_BOMB_COLOR;

    let background;
    if (isBomb) background = `radial-gradient(circle at 65% 35%, #999, #000 80%)`;
    else if (isStar) background = `radial-gradient(circle at 65% 35%, #fff, #ffd700 80%)`;
    else if (isColorBomb) background = `conic-gradient(from 90deg at 50% 50%, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)`;
    else background = `radial-gradient(circle at 65% 35%, rgba(255,255,255,0.9) 1%, rgba(255,255,255,0.4) 10%, transparent 50%), ${color}`;
    
    const bubbleStyle: React.CSSProperties = {
        width: diameter,
        height: diameter,
        background,
        boxShadow: `inset 0 -3px 5px rgba(0,0,0,0.5), 0 2px 3px rgba(0,0,0,0.3)`,
    };

    return (
        <div style={bubbleStyle} className={`relative rounded-full flex items-center justify-center`}>
            {isBomb && <CritterIcon className="w-2/3 h-2/3 text-red-500" />}
            {isStar && <StarIcon className="w-2/3 h-2/3 text-yellow-900" />}
            {children}
        </div>
    );
});

const StarBurst: React.FC<{ x: number, y: number }> = ({ x, y }) => (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 50 }}>
        <svg width="60" height="60" viewBox="0 0 100 100" className="animate-star-burst">
            <path d="M50 0 L61 39 L100 39 L69 61 L80 100 L50 75 L20 100 L31 61 L0 39 L39 39 Z" fill="#ffef41"/>
        </svg>
    </div>
);


const GameHUD = React.memo(({ score, shotsFired, shotsPerWave }: { score: number, shotsFired: number, shotsPerWave: number }) => {
    const levelScore = (score % 1000) / 10;
    return (
        <div className="absolute top-2 inset-x-2 md:inset-x-4 h-14 bg-slate-900/60 backdrop-blur-sm rounded-full flex items-center justify-between pl-20 pr-3 md:pr-5 z-20 border-2 border-slate-700/80">
            <div className="relative w-40 h-8 bg-slate-800/80 rounded-full flex items-center justify-center shadow-inner">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" style={{ width: `${levelScore}%` }} />
                <div className="absolute w-full flex justify-around">
                    <StarIcon className={`w-5 h-5 transition-colors ${levelScore > 20 ? 'text-yellow-400' : 'text-slate-600'}`} />
                    <StarIcon className={`w-5 h-5 transition-colors ${levelScore > 50 ? 'text-yellow-400' : 'text-slate-600'}`} />
                    <StarIcon className={`w-5 h-5 transition-colors ${levelScore > 90 ? 'text-yellow-400' : 'text-slate-600'}`} />
                </div>
            </div>
            <div className="text-3xl font-bold text-white drop-shadow-lg">{score}</div>
            <div className="flex items-center gap-2 text-white">
                <span className="text-3xl">😊</span>
                <span className="font-bold text-xl">{`${shotsFired}/${shotsPerWave}`}</span>
            </div>
        </div>
    );
});

const PowerupBar = React.memo(({ powerups, onActivate }: { powerups: any, onActivate: (type: string) => void }) => {
    const ICONS = [
        { type: 'star', component: StarIcon, color: 'text-yellow-400' },
        { type: 'color', component: ColorMatchIcon, color: 'text-fuchsia-400' },
        { type: 'bomb', component: CritterIcon, color: 'text-red-500' },
    ];
    return (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-3 md:gap-4 z-20">
            {ICONS.map((p, i) => {
                const Icon = p.component;
                const count = powerups[p.type as keyof typeof powerups];
                return (
                    <button
                        key={p.type}
                        onClick={() => onActivate(p.type)}
                        disabled={count <= 0}
                        className={`relative w-14 h-14 md:w-16 md:h-16 bg-slate-800/70 backdrop-blur-sm rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-slate-600 hover:border-cyan-400`}
                    >
                        <Icon className={`w-8 h-8 ${p.color}`} />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-slate-800">{count}</div>
                    </button>
                )
            })}
        </div>
    );
});


const BubbleShooterGame: React.FC<{ onGameOver: (score: number, gameId: string) => void; }> = ({ onGameOver }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [shooterQueue, setShooterQueue] = useState<string[]>([]);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [aimAngle, setAimAngle] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [shotsFired, setShotsFired] = useState(0);
  const [poppedStars, setPoppedStars] = useState<PoppedStar[]>([]);
  const [powerups, setPowerups] = useState({ star: 2, color: 1, bomb: 3 });
  
  const [dimensions, setDimensions] = useState({
      width: ORIGINAL_GAME_WIDTH,
      height: ORIGINAL_GAME_HEIGHT,
      bubbleDiameter: ORIGINAL_BUBBLE_DIAMETER
  });

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);
  const isProcessingTurn = useRef(false);
  const [aimPath, setAimPath] = useState('');

  const scoreRef = useRef(score);
  scoreRef.current = score;

  useLayoutEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = gameArea;
      if (clientWidth === 0) return;
      setDimensions({
        width: clientWidth,
        height: clientHeight,
        bubbleDiameter: clientWidth / GRID_COLS,
      });
    });

    resizeObserver.observe(gameArea);
    // Initial call
    const { clientWidth, clientHeight } = gameArea;
     if (clientWidth > 0) {
        setDimensions({
            width: clientWidth,
            height: clientHeight,
            bubbleDiameter: clientWidth / GRID_COLS,
        });
     }
    return () => resizeObserver.disconnect();
  }, []);
  
  const { width: GAME_WIDTH, height: GAME_HEIGHT, bubbleDiameter: BUBBLE_DIAMETER } = dimensions;
  const BUBBLE_RADIUS = BUBBLE_DIAMETER / 2;
  const SHOOTER_Y = GAME_HEIGHT - BUBBLE_DIAMETER * 1.66;
  const GAME_OVER_LINE_Y = GAME_HEIGHT - BUBBLE_DIAMETER * 2.5;
  const PROJECTILE_SPEED = GAME_HEIGHT * (ORIGINAL_PROJECTILE_SPEED / ORIGINAL_GAME_HEIGHT);
  const ROW_SQUISH_FACTOR = BUBBLE_DIAMETER * (5 / ORIGINAL_BUBBLE_DIAMETER);

  const getBubbleXY = useCallback((row: number, col: number) => {
    const x = col * BUBBLE_DIAMETER + (row % 2 === 1 ? BUBBLE_RADIUS : 0) + BUBBLE_RADIUS;
    const y = row * (BUBBLE_DIAMETER - ROW_SQUISH_FACTOR) + BUBBLE_RADIUS;
    return { x, y };
  }, [BUBBLE_DIAMETER, BUBBLE_RADIUS, ROW_SQUISH_FACTOR]);

  const getActiveColors = useCallback((board: Bubble[]) => {
    const active = new Set(board.map(b => b.color));
    return active.size > 2 ? Array.from(active) : BUBBLE_COLORS.slice(0, 3);
  }, []);

  const generateBubbleColor = useCallback((currentBubbles: Bubble[]) => {
    const activeColors = getActiveColors(currentBubbles);
    return activeColors[Math.floor(Math.random() * activeColors.length)];
  }, [getActiveColors]);

  const getShotsPerWave = (currentScore: number) => Math.max(3, 8 - Math.floor(currentScore / 1000));
  
  const resetGame = useCallback(() => {
    let initialBubbles: Bubble[] = [];
    let idCounter = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < (r % 2 === 1 ? GRID_COLS - 1 : GRID_COLS); c++) {
        initialBubbles.push({ id: idCounter++, color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)], row: r, col: c });
      }
    }
    setBubbles(initialBubbles);
    setShooterQueue([generateBubbleColor(initialBubbles), generateBubbleColor(initialBubbles)]);
    setProjectile(null);
    setScore(0);
    setIsGameOver(false);
    setShotsFired(0);
    setAimAngle(0);
    setPowerups({ star: 2, color: 1, bomb: 3 });
  }, [generateBubbleColor]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);
  
  const checkGameOver = useCallback((currentBubbles: Bubble[]) => {
     for(const b of currentBubbles) {
         const { y } = getBubbleXY(b.row, b.col);
         if(y + BUBBLE_RADIUS > GAME_OVER_LINE_Y) {
            setIsGameOver(true);
            setTimeout(() => onGameOver(scoreRef.current, 'bubble-sort'), 1000);
            return true;
         }
     }
     return false;
  }, [onGameOver, getBubbleXY, BUBBLE_RADIUS, GAME_OVER_LINE_Y]);

  const addCeilingRow = useCallback((currentBubbles: Bubble[]) => {
    const movedBubbles = currentBubbles.map(b => ({ ...b, row: b.row + 1 }));
    let newIdCounter = Date.now();
    const newRowBubbles: Bubble[] = [];
    const activeColors = getActiveColors(movedBubbles);
    for (let c = 0; c < GRID_COLS; c++) {
      newRowBubbles.push({
        id: newIdCounter++,
        color: activeColors[Math.floor(Math.random() * activeColors.length)],
        row: 0,
        col: c
      });
    }
    const finalBoard = [...movedBubbles, ...newRowBubbles];
    setBubbles(finalBoard);
    checkGameOver(finalBoard);
  }, [getActiveColors, checkGameOver]);
  
  const triggerPopAnimation = useCallback((bubblesToPop: Bubble[]) => {
    const newStars = bubblesToPop.map(b => {
      const { x, y } = getBubbleXY(b.row, b.col);
      return { id: b.id, x, y };
    });
    setPoppedStars(current => [...current, ...newStars]);
    setTimeout(() => {
      setPoppedStars(current => current.filter(s => !newStars.some(ns => ns.id === s.id)));
    }, 500);
  }, [getBubbleXY]);

  const processTurn = useCallback(async (snappedBubble: Bubble | Projectile, currentBubbles: Bubble[]) => {
    let allBubbles: Bubble[];
    let newBubble: Bubble;

    if ('row' in snappedBubble) { 
        newBubble = snappedBubble;
        allBubbles = [...currentBubbles, newBubble];
    } else {
        let row = Math.round((snappedBubble.y - BUBBLE_RADIUS) / (BUBBLE_DIAMETER - ROW_SQUISH_FACTOR));
        row = Math.max(0, row);
        const colOffset = row % 2 === 1 ? BUBBLE_RADIUS : 0;
        let col = Math.round((snappedBubble.x - colOffset - BUBBLE_RADIUS) / BUBBLE_DIAMETER);
        const maxCol = row % 2 === 1 ? GRID_COLS - 2 : GRID_COLS - 1;
        col = Math.max(0, Math.min(col, maxCol));
        newBubble = { id: Date.now(), color: snappedBubble.color, row, col };
        allBubbles = [...currentBubbles, newBubble];
    }
    
    setBubbles(allBubbles);
    
    let cluster: Bubble[] = [];
    const localGetNeighbors = (bubble: Bubble, board: Bubble[]) => getNeighbors(bubble, board, getBubbleXY, BUBBLE_DIAMETER);
    
    if (newBubble.color === BOMB_COLOR) {
        const neighbors = localGetNeighbors(newBubble, allBubbles);
        cluster = [...neighbors, newBubble];
    } else if (newBubble.color === STAR_POWER_COLOR) {
        const neighbors = allBubbles.filter(b => {
             const { x: bX, y: bY } = getBubbleXY(b.row, b.col);
             const { x: newX, y: newY } = getBubbleXY(newBubble.row, newBubble.col);
             return Math.hypot(bX - newX, bY - newY) < BUBBLE_DIAMETER * 2.5;
        });
        cluster = [...neighbors, newBubble];
    } else if (newBubble.color === COLOR_BOMB_COLOR) {
        const hitBubble = localGetNeighbors(newBubble, allBubbles).sort((a,b) => Math.hypot(getBubbleXY(a.row, a.col).x - newBubble.id, getBubbleXY(a.row, a.col).y - newBubble.id) - Math.hypot(getBubbleXY(b.row, b.col).x - newBubble.id, getBubbleXY(b.row, b.col).y - newBubble.id) )[0];
        if(hitBubble) {
           cluster = allBubbles.filter(b => b.color === hitBubble.color);
        } else {
           cluster = [newBubble];
        }
    } else {
        const q = [newBubble];
        const visited = new Set([newBubble.id]);
        while(q.length > 0) {
            const current = q.shift()!;
            cluster.push(current);
            const neighbors = localGetNeighbors(current, allBubbles);
            for(const neighbor of neighbors) {
                if(!visited.has(neighbor.id) && neighbor.color === newBubble.color) {
                    visited.add(neighbor.id);
                    q.push(neighbor);
                }
            }
        }
    }
    
    const isPowerupHit = [BOMB_COLOR, STAR_POWER_COLOR, COLOR_BOMB_COLOR].includes(newBubble.color);

    if (cluster.length >= 3 || isPowerupHit) {
        triggerPopAnimation(cluster);
        setScore(s => s + cluster.length * 10);
        allBubbles = allBubbles.filter(b => !cluster.some(cb => cb.id === b.id));
    } else {
        return allBubbles;
    }
    
    if (allBubbles.length > 0) {
      const connectedToCeiling = new Set<number>();
      const floatQueue = allBubbles.filter(b => b.row === 0);
      floatQueue.forEach(b => connectedToCeiling.add(b.id));
      let head = 0;
      while(head < floatQueue.length) {
          const current = floatQueue[head++];
          const neighbors = localGetNeighbors(current, allBubbles);
          for(const neighbor of neighbors) {
              if(!connectedToCeiling.has(neighbor.id)) {
                  connectedToCeiling.add(neighbor.id);
                  floatQueue.push(neighbor);
              }
          }
      }

      const floatingBubbles = allBubbles.filter(b => !connectedToCeiling.has(b.id));
      if (floatingBubbles.length > 0) {
          setScore(s => s + floatingBubbles.length * 20);
          triggerPopAnimation(floatingBubbles);
          allBubbles = allBubbles.filter(b => connectedToCeiling.has(b.id));
      }
    }

    setBubbles(allBubbles);
    return allBubbles;
  }, [setScore, BUBBLE_DIAMETER, BUBBLE_RADIUS, ROW_SQUISH_FACTOR, getBubbleXY, triggerPopAnimation]);
  
  const snapProjectile = useCallback(async (proj: Projectile) => {
    if (isProcessingTurn.current) return;
    isProcessingTurn.current = true;
    try {
        const finalBubbles = await processTurn(proj, bubbles);
        
        if (checkGameOver(finalBubbles)) {
          return;
        }
        
        const shotsForNextWave = getShotsPerWave(score);
        const newShotsFired = shotsFired + 1;
        if (newShotsFired >= shotsForNextWave) {
          addCeilingRow(finalBubbles);
          setShotsFired(0);
        } else {
          setShotsFired(newShotsFired);
        }
    } finally {
        isProcessingTurn.current = false;
    }
  }, [processTurn, bubbles, score, shotsFired, addCeilingRow, checkGameOver]);
  
  const gameLoop = useCallback(() => {
    if (!projectile || isGameOver) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    let newProj = { ...projectile };
    newProj.x += newProj.vx;
    newProj.y += newProj.vy;

    if (newProj.x < BUBBLE_RADIUS || newProj.x > GAME_WIDTH - BUBBLE_RADIUS) newProj.vx *= -1;
    if (newProj.y < BUBBLE_RADIUS) {
      setProjectile(null);
      snapProjectile(newProj);
      return;
    }

    for (const bubble of bubbles) {
      const { x: bubbleX, y: bubbleY } = getBubbleXY(bubble.row, bubble.col);
      const dist = Math.hypot(newProj.x - bubbleX, newProj.y - bubbleY);
      if (dist < BUBBLE_DIAMETER) {
        setProjectile(null);
        snapProjectile(newProj);
        return;
      }
    }

    setProjectile(newProj);
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [projectile, bubbles, isGameOver, snapProjectile, BUBBLE_RADIUS, BUBBLE_DIAMETER, GAME_WIDTH, getBubbleXY]);

  useEffect(() => {
    if (projectile) animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => { if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current) };
  }, [projectile, gameLoop]);

  const updateAimPath = useCallback((angle: number) => {
    if (isProcessingTurn.current || isGameOver || projectile) { setAimPath(''); return; }
    
    let pathPoints = [];
    let currentPoint = { x: GAME_WIDTH / 2, y: SHOOTER_Y };
    let currentVel = { vx: Math.sin(angle) * PROJECTILE_SPEED, vy: -Math.cos(angle) * PROJECTILE_SPEED };
    pathPoints.push(currentPoint);

    for (let i = 0; i < 1; i++) {
        let tWall = Infinity, tCeiling = Infinity;
        if (currentVel.vx > 0.001) tWall = (GAME_WIDTH - BUBBLE_RADIUS - currentPoint.x) / currentVel.vx;
        else if (currentVel.vx < -0.001) tWall = (BUBBLE_RADIUS - currentPoint.x) / currentVel.vx;
        if(currentVel.vy < -0.001) tCeiling = (BUBBLE_RADIUS - currentPoint.y) / currentVel.vy;
        
        let t = Math.min(tWall, tCeiling);
        
        const endPoint = { x: currentPoint.x + t * currentVel.vx, y: currentPoint.y + t * currentVel.vy };
        pathPoints.push(endPoint);

        if (t === tWall) currentVel.vx *= -1;
        else break;
        currentPoint = endPoint;
    }
    
    setAimPath(pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' '));
  }, [isGameOver, projectile, GAME_WIDTH, SHOOTER_Y, BUBBLE_RADIUS, PROJECTILE_SPEED]);
  
  const handleAim = (clientX: number, clientY: number) => {
    if (isProcessingTurn.current || isGameOver || projectile) return;
    const rect = gameAreaRef.current!.getBoundingClientRect();
    const targetX = (clientX - rect.left) * (GAME_WIDTH / rect.width);
    const targetY = (clientY - rect.top) * (GAME_HEIGHT / rect.height);

    const dx = targetX - (GAME_WIDTH / 2), dy = targetY - SHOOTER_Y;
    if (dy >= -10) return;
    const angleRad = Math.atan2(dy, dx);
    let visualAngle = angleRad + Math.PI / 2;
    const clampMargin = 0.08;
    visualAngle = Math.max(-Math.PI / 2 + clampMargin, Math.min(visualAngle, Math.PI / 2 - clampMargin));
    setAimAngle(visualAngle);
    updateAimPath(visualAngle);
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => handleAim(e.clientX, e.clientY);

  const handleShoot = () => {
    if (projectile || isGameOver || isProcessingTurn.current || shooterQueue.length === 0) return;
    setAimPath('');
    
    const newQueue = [...shooterQueue];
    const firedColor = newQueue.shift()!;
    newQueue.push(generateBubbleColor(bubbles));
    setShooterQueue(newQueue);

    setProjectile({
      x: GAME_WIDTH / 2, y: SHOOTER_Y,
      vx: Math.sin(aimAngle) * PROJECTILE_SPEED, vy: -Math.cos(aimAngle) * PROJECTILE_SPEED,
      color: firedColor,
    });
  };
  
  const handleActivatePowerup = (type: string) => {
    if (powerups[type as keyof typeof powerups] <= 0 || isProcessingTurn.current) return;
    
    const newQueue = [...shooterQueue];
    
    switch(type) {
        case 'star': newQueue[0] = STAR_POWER_COLOR; break;
        case 'color': newQueue[0] = COLOR_BOMB_COLOR; break;
        case 'bomb': newQueue[0] = BOMB_COLOR; break;
    }
    
    setShooterQueue(newQueue);
    setPowerups(p => ({ ...p, [type]: p[type as keyof typeof p] - 1 }));
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent touch-none overflow-hidden relative" >
        <GameHUD score={score} shotsFired={shotsFired} shotsPerWave={getShotsPerWave(score)} />
      <div 
        ref={gameAreaRef}
        className="relative cursor-pointer"
        style={{ width: '100%', maxWidth: ORIGINAL_GAME_WIDTH, aspectRatio: `${ORIGINAL_GAME_WIDTH} / ${ORIGINAL_GAME_HEIGHT}` }}
        onPointerMove={handlePointerMove}
        onClick={handleShoot}
        onPointerLeave={() => setAimPath('')}
      >
        <div className="absolute inset-0">
            {bubbles.map(bubble => {
              const { x, y } = getBubbleXY(bubble.row, bubble.col);
              return <div 
                key={bubble.id} 
                className="absolute"
                style={{ 
                    width: BUBBLE_DIAMETER, height: BUBBLE_DIAMETER,
                    left: x - BUBBLE_RADIUS, top: y - BUBBLE_RADIUS,
                    transition: 'top 0.4s ease-out, left 0.4s ease-out, transform 0.2s, opacity 0.2s'
                }}>
                    <GlossyBubble color={bubble.color} diameter={BUBBLE_DIAMETER} />
                </div>
            })}
            {poppedStars.map(star => <StarBurst key={star.id} x={star.x} y={star.y} />)}
            
            {projectile && (
                <div className="absolute" style={{
                    width: BUBBLE_DIAMETER, height: BUBBLE_DIAMETER,
                    left: projectile.x - BUBBLE_RADIUS,
                    top: projectile.y - BUBBLE_RADIUS,
                }}>
                    <GlossyBubble color={projectile.color} diameter={BUBBLE_DIAMETER} />
                </div>
            )}
        </div>
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line x1="0" y1={GAME_OVER_LINE_Y} x2={GAME_WIDTH} y2={GAME_OVER_LINE_Y} stroke="#dc2626" strokeWidth="2" strokeDasharray="10 5" opacity="0.6" />
            {aimPath && <path d={aimPath} stroke="white" strokeWidth="2" strokeDasharray="5 10" fill="none" opacity="0.7" />}
        </svg>

        {isGameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                <p className="text-5xl font-bold text-red-500 animate-pulse">GAME OVER</p>
            </div>
        )}
      </div>

        <div className="absolute inset-x-0 pointer-events-none z-20" style={{bottom: '14%', height: `${BUBBLE_DIAMETER*2}px`}}>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center">
                <div className="relative" style={{transform: `rotate(${aimAngle * 180 / Math.PI}deg)`, transition: 'transform 0.1s linear'}}>
                     <div className="bg-slate-600 rounded-t-md" style={{width: `${BUBBLE_DIAMETER*0.9}px`, height: `${BUBBLE_DIAMETER*1.1}px`, transform: `translateY(${BUBBLE_DIAMETER*0.1}px)`}}/>
                </div>
                {shooterQueue.length > 0 && 
                    <div className="p-2 bg-slate-800/50 rounded-full" style={{width: BUBBLE_DIAMETER*1.5, height: BUBBLE_DIAMETER*1.5}}>
                        <GlossyBubble color={shooterQueue[0]} diameter={BUBBLE_DIAMETER * 1.3}/>
                    </div>
                }
            </div>

            {shooterQueue.length > 1 && (
                <div className="absolute left-1/2 bottom-0 flex flex-col items-center" style={{transform: `translateX(${BUBBLE_DIAMETER*1.5}px)`}}>
                    <span className="text-white/80 text-sm">Next</span>
                    <div className="p-1 bg-slate-800/50 rounded-full" style={{width: BUBBLE_DIAMETER*1.1, height: BUBBLE_DIAMETER*1.1}}>
                        <GlossyBubble color={shooterQueue[1]} diameter={BUBBLE_DIAMETER} />
                    </div>
                </div>
            )}
        </div>
      <PowerupBar powerups={powerups} onActivate={handleActivatePowerup} />
      <style>{`
          @keyframes star-burst { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
          .animate-star-burst { animation: star-burst 0.4s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default BubbleShooterGame;
