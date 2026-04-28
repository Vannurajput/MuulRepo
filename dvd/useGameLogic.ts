

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CritterType } from '../types';

const INITIAL_LIVES = 3;
const CRITTER_COLORS = ['#22d3ee', '#a78bfa', '#60a5fa', '#2dd4bf', '#818cf8'];

const DIFFICULTY_SETTINGS = {
  Easy: {
    initialSpawnRate: 2500,
    minSpawnRate: 1200,
    spawnRateDecrement: 30,
    initialLifespan: 4500,
    minLifespan: 3000,
    lifespanDecrement: 40,
    allowMultiSpawn: false,
  },
  Medium: { // Original settings
    initialSpawnRate: 1600,
    minSpawnRate: 500,
    spawnRateDecrement: 40,
    initialLifespan: 3000,
    minLifespan: 1500,
    lifespanDecrement: 50,
    allowMultiSpawn: true,
  },
  Hard: {
    initialSpawnRate: 1200,
    minSpawnRate: 350,
    spawnRateDecrement: 50,
    initialLifespan: 2200,
    minLifespan: 1000,
    lifespanDecrement: 60,
    allowMultiSpawn: true,
  },
};


export const useGameLogic = (onGameOver: (score: number) => void, difficulty: 'Easy' | 'Medium' | 'Hard') => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [critters, setCritters] = useState<CritterType[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const critterTimeoutsRef = useRef<Map<number, number>>(new Map());

  const settings = DIFFICULTY_SETTINGS[difficulty];

  const spawnRate = Math.max(settings.minSpawnRate, settings.initialSpawnRate - score * settings.spawnRateDecrement);
  const critterLifespan = Math.max(settings.minLifespan, settings.initialLifespan - score * settings.lifespanDecrement);
  
  const missCritter = useCallback((critterId: number) => {
    // Check if critter still exists before processing a miss
    critterTimeoutsRef.current.delete(critterId);
    setCritters(prev => prev.filter(c => c.id !== critterId));
    setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
            onGameOver(score);
        }
        return newLives;
    });
  }, [onGameOver, score]);

  const addCritter = useCallback(() => {
    let crittersToSpawn = 1;
    if (settings.allowMultiSpawn) {
        const rand = Math.random();
        if (difficulty === 'Hard') {
            if (score > 20) { // High score on hard
                if (rand < 0.5) crittersToSpawn = 3;
                else if (rand < 0.9) crittersToSpawn = 2;
            } else if (score > 5) { // Low score on hard
                if (rand < 0.2) crittersToSpawn = 3;
                else if (rand < 0.6) crittersToSpawn = 2;
            } else if (rand < 0.1) {
                crittersToSpawn = 2;
            }
        } else { // Medium difficulty (original logic)
            if (score > 30) {
                if (rand < 0.4) crittersToSpawn = 3;
                else if (rand < 0.8) crittersToSpawn = 2;
            } else if (score > 20) {
                if (rand < 0.2) crittersToSpawn = 3;
                else if (rand < 0.6) crittersToSpawn = 2;
            } else if (score > 10) {
                if (rand < 0.3) crittersToSpawn = 2;
            }
        }
    }


    const newCritters: CritterType[] = [];
    for (let i = 0; i < crittersToSpawn; i++) {
        const id = Date.now() + i;
        const newCritter: CritterType = {
            id,
            x: Math.random() * 70 + 15,
            y: Math.random() * 65 + 15,
            color: CRITTER_COLORS[Math.floor(Math.random() * CRITTER_COLORS.length)],
        };
        newCritters.push(newCritter);
    }
    
    setCritters(prev => [...prev, ...newCritters]);
    
    newCritters.forEach(critter => {
        const timeoutId = window.setTimeout(() => {
            missCritter(critter.id);
        }, critterLifespan);
        critterTimeoutsRef.current.set(critter.id, timeoutId);
    });
    
  }, [missCritter, critterLifespan, score, settings, difficulty]);
  
  const catchCritter = useCallback((critterId: number) => {
    const timeoutId = critterTimeoutsRef.current.get(critterId);
    if(timeoutId) {
        clearTimeout(timeoutId);
        critterTimeoutsRef.current.delete(critterId);
    }
    
    setCritters(prev => prev.filter(c => c.id !== critterId));
    setScore(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    if (lives <= 0) {
      if(gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      critterTimeoutsRef.current.forEach(clearTimeout);
      critterTimeoutsRef.current.clear();
      onGameOver(score);
    }
  }, [lives, onGameOver, score]);

  const isGameOver = lives <= 0;

  useEffect(() => {
    if(isGameOver) return;
    gameLoopRef.current = window.setInterval(addCritter, spawnRate);
    return () => {
      if(gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [addCritter, spawnRate, isGameOver]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
       if(gameLoopRef.current) clearInterval(gameLoopRef.current);
       critterTimeoutsRef.current.forEach(clearTimeout);
    }
  }, []);

  return { score, lives, critters, catchCritter, isGameOver };
};