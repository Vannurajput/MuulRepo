
import React from 'react';

// --- SVG Assets ---

export const Basket: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 120 100" style={style}>
    <defs>
      <linearGradient id="fruit-catcher-basketGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c27b3d" />
        <stop offset="100%" stopColor="#8d5a2c" />
      </linearGradient>
    </defs>
    <g style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}>
      <path d="M10 40 C 10 60, 110 60, 110 40 L 90 95 H 30 Z" fill="url(#fruit-catcher-basketGradient)" stroke="#5c2d0e" strokeWidth="3" />
      <path d="M10 40 C 10 60, 110 60, 110 40" stroke="#a36b2f" strokeWidth="8" fill="none" />
      <path d="M20 40 L 40 95" stroke="#a36b2f" strokeWidth="2" opacity="0.5"/>
      <path d="M60 40 L 60 95" stroke="#a36b2f" strokeWidth="2" opacity="0.5"/>
      <path d="M100 40 L 80 95" stroke="#a36b2f" strokeWidth="2" opacity="0.5"/>
    </g>
  </svg>
);

export const Banana: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 80 80" style={style}>
    <g style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>
      <path d="M20 60 Q 50 10, 70 50 Q 40 80, 20 60" fill="#fde047" stroke="#eab308" strokeWidth="1"/>
      <path d="M20 60 Q 25 55, 22 50" stroke="#a16207" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M70 50 Q 68 45, 65 43" stroke="#a16207" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

export const Pineapple: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 80 100" style={style}>
    <g style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>
      <path d="M40,15 L30,45 L50,45 Z" fill="#22c55e" />
      <path d="M40,15 L35,40 L45,40 Z" fill="#16a34a" transform="rotate(30, 40, 15)"/>
      <path d="M40,15 L35,40 L45,40 Z" fill="#16a34a" transform="rotate(-30, 40, 15)"/>
      <ellipse cx="40" cy="70" rx="30" ry="25" fill="#facc15" stroke="#eab308" strokeWidth="1"/>
      <path d="M20 60 L60 90" stroke="#eab308" strokeWidth="2" opacity="0.7" />
      <path d="M20 90 L60 60" stroke="#eab308" strokeWidth="2" opacity="0.7" />
    </g>
  </svg>
);

export const Mango: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 80 80" style={style}>
    <defs>
      <radialGradient id="fruit-catcher-mangoGradient">
        <stop offset="0%" stopColor="#fb923c"/>
        <stop offset="100%" stopColor="#f97316"/>
      </radialGradient>
    </defs>
    <g style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>
      <path d="M55 20 C 80 40, 70 70, 40 70 C 10 70, 10 40, 25 30 S 40 10, 55 20" fill="url(#fruit-catcher-mangoGradient)" stroke="#ea580c" strokeWidth="1"/>
      <path d="M55 20 Q 60 15, 50 15" stroke="#166534" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

export const Snail: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 80 60" style={style}>
    <g style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>
      <path d="M 60 50 C 70 50, 75 40, 70 30 C 60 10, 30 10, 25 30 C 20 50, 60 50, 60 50" fill="#a16207" stroke="#5c2d0e" strokeWidth="1"/>
      <path d="M 50 30 a 10 10 0 1 0 -20 0 a 10 10 0 1 0 20 0" stroke="#8d5a2c" strokeWidth="3" fill="none" />
      <path d="M 60 50 L 20 50 L 15 45" stroke="#a16207" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="40" r="2" fill="black" />
      <path d="M 10 45 L 5 35" stroke="#8d5a2c" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 20 45 L 15 35" stroke="#8d5a2c" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

export const Frog: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="0 0 80 60" style={style}>
    <g style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>
      <ellipse cx="40" cy="40" rx="35" ry="18" fill="#4ade80" stroke="#16a34a" strokeWidth="1"/>
      <circle cx="25" cy="25" r="10" fill="#22c55e" />
      <circle cx="55" cy="25" r="10" fill="#22c55e" />
      <circle cx="25" cy="25" r="5" fill="white" />
      <circle cx="55" cy="25" r="5" fill="white" />
      <circle cx="25" cy="25" r="2" fill="black" />
      <circle cx="55" cy="25" r="2" fill="black" />
      <path d="M30 45 Q 40 50, 50 45" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// --- Game Types and Constants ---

export interface Item {
  id: number;
  type: 'fruit' | 'critter';
  component: React.FC<{ style?: React.CSSProperties }>;
  x: number;       // percentage (0-100)
  y: number;       // px
  speed: number;   // px per frame
  rotation: number;
  size: number;    // px
}

export interface FruitData {
  type: 'fruit';
  component: React.FC<{ style?: React.CSSProperties }>;
  points: number;
}

export interface CritterData {
  type: 'critter';
  component: React.FC<{ style?: React.CSSProperties }>;
}

export const FRUITS: FruitData[] = [
  { type: 'fruit', component: Banana, points: 10 },
  { type: 'fruit', component: Pineapple, points: 15 },
  { type: 'fruit', component: Mango, points: 20 },
];

export const CRITTERS: CritterData[] = [
  { type: 'critter', component: Snail },
  { type: 'critter', component: Frog },
];

export const BASKET_WIDTH_PERCENT = 25;
export const BASKET_ASPECT_RATIO = 1.2; // width / height
export const BASKET_BOTTOM_PERCENT = 8;
