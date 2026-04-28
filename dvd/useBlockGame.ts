
import { useState, useCallback, useEffect, useRef } from 'react';

// --- Game Constants & Types ---
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TETROMINOES = {
  '0': { shape: [[0]], color: 'transparent' }, // Empty cell
  I: { shape: [[1, 1, 1, 1]], color: '#22d3ee' }, // Cyan
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6' }, // Blue
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' }, // Orange
  O: { shape: [[1, 1], [1, 1]], color: '#facc15' }, // Yellow
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#22c55e' }, // Green
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' }, // Purple
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef4444' }, // Red
};
export type TetrominoKey = keyof typeof TETROMINOES;

export type Board = (TetrominoKey)[][];
export type Player = {
  pos: { x: number; y: number };
  tetromino: { shape: number[][]; color: string };
  key: TetrominoKey;
};

// --- Custom Hook for game interval ---
const useInterval = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);
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

// --- Helper Functions ---
const createBoard = (): Board =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill('0'));

export const useBlockGame = ({ onGameOver }: { onGameOver: (score: number, gameId: string) => void; }) => {
    const [board, setBoard] = useState<Board>(() => createBoard());
    const [player, setPlayer] = useState<Player | null>(null);
    const [nextTetrominoKey, setNextTetrominoKey] = useState<TetrominoKey>('0');
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);
    const [isGameOver, setIsGameOver] = useState(true);
    const [dropTime, setDropTime] = useState<number | null>(null);

    const scoreRef = useRef(score);
    scoreRef.current = score;

    const randomTetromino = useCallback((): TetrominoKey => {
        const tetrominos = 'IJLOSTZ';
        return tetrominos[Math.floor(Math.random() * tetrominos.length)] as TetrominoKey;
    }, []);

    const checkCollision = useCallback((p: Player, b: Board, { x: moveX, y: moveY }: { x: number, y: number }): boolean => {
        for (let y = 0; y < p.tetromino.shape.length; y++) {
            for (let x = 0; x < p.tetromino.shape[y].length; x++) {
                if (p.tetromino.shape[y][x] !== 0) {
                    const newY = y + p.pos.y + moveY;
                    const newX = x + p.pos.x + moveX;
                    if (!b[newY] || !b[newY][newX] || b[newY][newX] !== '0') {
                        return true;
                    }
                }
            }
        }
        return false;
    }, []);

    const resetPlayer = useCallback((currentBoard: Board, currentNextKey: TetrominoKey) => {
        const key = currentNextKey === '0' ? randomTetromino() : currentNextKey;
        const newNextKey = randomTetromino();
        const tetromino = TETROMINOES[key];
        const newPlayer: Player = {
            pos: { x: BOARD_WIDTH / 2 - Math.floor(tetromino.shape[0].length / 2), y: 0 },
            tetromino,
            key,
        };

        if (checkCollision(newPlayer, currentBoard, { x: 0, y: 0 })) {
            setIsGameOver(true);
            setDropTime(null);
            onGameOver(scoreRef.current, 'block-game');
        } else {
            setPlayer(newPlayer);
        }
        setNextTetrominoKey(newNextKey);
    }, [randomTetromino, checkCollision, onGameOver]);


    const startGame = useCallback(() => {
        const newBoard = createBoard();
        setBoard(newBoard);
        setScore(0);
        setRows(0);
        setLevel(0);
        setIsGameOver(false);
        setDropTime(800);
        const firstNextKey = randomTetromino();
        setNextTetrominoKey(firstNextKey);
        resetPlayer(newBoard, firstNextKey);
    }, [randomTetromino, resetPlayer]);
    
    const handleLockAndReset = useCallback((p: Player) => {
        const newBoard = board.map(row => [...row]);
        p.tetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardY = y + p.pos.y;
                    const boardX = x + p.pos.x;
                    if (newBoard[boardY]) newBoard[boardY][boardX] = p.key;
                }
            });
        });

        let clearedCount = 0;
        const sweptBoard = newBoard.reduce((acc, row) => {
            if (row.every(cell => cell !== '0')) {
                acc.unshift(Array(BOARD_WIDTH).fill('0'));
                clearedCount++;
                return acc;
            }
            acc.push(row);
            return acc;
        }, [] as Board);

        if (clearedCount > 0) {
            const linePoints = [0, 100, 300, 500, 800];
            setScore(prev => prev + linePoints[clearedCount] * (level + 1));
            const newTotalRows = rows + clearedCount;
            setRows(newTotalRows);
            setLevel(Math.floor(newTotalRows / 10));
        }
        
        setBoard(sweptBoard);
        resetPlayer(sweptBoard, nextTetrominoKey);
    }, [board, level, rows, resetPlayer, nextTetrominoKey]);

    const movePlayer = useCallback((dir: number) => {
        if (!player || isGameOver) return;
        if (!checkCollision(player, board, { x: dir, y: 0 })) {
            setPlayer(p => p ? { ...p, pos: { ...p.pos, x: p.pos.x + dir } } : null);
        }
    }, [player, board, isGameOver, checkCollision]);

    const movePlayerToX = useCallback((targetX: number) => {
        if (!player || isGameOver) return;
        const pieceWidth = player.tetromino.shape[0].length;
        const clampedX = Math.max(0, Math.min(BOARD_WIDTH - pieceWidth, targetX));
        const tempPlayer = { ...player, pos: { ...player.pos, x: clampedX } };
        
        // Check collision at the new absolute position.
        // We pass {x:0, y:0} because tempPlayer already has the new target coordinates.
        if (!checkCollision(tempPlayer, board, { x: 0, y: 0 })) {
            setPlayer(tempPlayer);
        }
    }, [player, isGameOver, checkCollision, board]);

    const rotatePlayer = useCallback(() => {
        if (!player || isGameOver) return;
        const shape = player.tetromino.shape;
        const rotatedShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]).reverse());
        const newPlayer = { ...player, tetromino: { ...player.tetromino, shape: rotatedShape } };
        
        const originalPos = player.pos.x;
        let offset = 1;
        while(checkCollision(newPlayer, board, { x: 0, y: 0 })) {
            newPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (Math.abs(offset) > newPlayer.tetromino.shape[0].length + 1) { // Wall kick check
                newPlayer.pos.x = originalPos; // Cannot rotate
                return;
            }
        }
        setPlayer(newPlayer);
    }, [player, board, isGameOver, checkCollision]);

    const drop = useCallback(() => {
        if (!player || isGameOver) return;
        if (!checkCollision(player, board, { x: 0, y: 1 })) {
            setPlayer(p => p ? { ...p, pos: { ...p.pos, y: p.pos.y + 1 } } : null);
        } else {
            handleLockAndReset(player);
        }
    }, [player, board, isGameOver, checkCollision, handleLockAndReset]);

    const hardDrop = useCallback(() => {
        if (!player || isGameOver) return;
        let y = 0;
        while (!checkCollision(player, board, { x: 0, y: y + 1 })) {
            y++;
        }
        const finalPlayer = { ...player, pos: { ...player.pos, y: player.pos.y + y } };
        handleLockAndReset(finalPlayer);
    }, [player, board, isGameOver, checkCollision, handleLockAndReset]);

    useEffect(() => {
        if (!isGameOver) {
            setDropTime(800 / (level + 1));
        }
    }, [level, isGameOver]);

    useInterval(drop, dropTime);
    
    return { board, player, nextTetrominoKey, score, rows, level, isGameOver, startGame, movePlayer, rotatePlayer, drop, hardDrop, checkCollision, movePlayerToX };
};