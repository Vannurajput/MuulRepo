import React from 'react';

export const JigsawPuzzleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M20 30 V20 A 10 10 0 0 1 30 10 H40 A 10 10 0 0 0 40 30 H30 V40 A 10 10 0 0 0 50 40 V30 H70 V70 H30 V60 A 10 10 0 0 1 40 70 H30 V80 H80 V20 H70 A 10 10 0 0 0 70 40 H80" 
      stroke="currentColor" 
      strokeWidth="5"
      strokeLinejoin="round"
      fill="currentColor"
      opacity="0.2"
    />
    <path d="M30,30 v10 a10,10 0,0,0 20,0 v-10 h10 v40 h-40 v-10 a10,10 0,0,1 20,0 v10 h10"
      fill="currentColor" opacity="0.9" />
  </svg>
);