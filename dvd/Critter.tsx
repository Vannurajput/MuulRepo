
import React from 'react';
import type { CritterType } from '../types';

interface CritterProps {
  critter: CritterType;
  onPointerDown: () => void;
}

const Critter: React.FC<CritterProps> = ({ critter, onPointerDown }) => {
  const critterStyle: React.CSSProperties = {
    left: `${critter.x}%`,
    top: `${critter.y}%`,
    animation: 'pop-in 0.3s ease-out forwards',
  };

  return (
    <div
      className="absolute w-20 h-20 md:w-24 md:h-24 cursor-pointer transform transition-transform duration-150 hover:scale-110 touch-none"
      style={critterStyle}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown();
      }}
      role="button"
      aria-label="Catch the critter"
    >
      <style>
        {`
          @keyframes pop-in {
            0% { transform: scale(0); }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="45" fill={critter.color} />
        <circle cx="35" cy="40" r="8" fill="white" />
        <circle cx="65" cy="40" r="8" fill="white" />
        <circle cx="37" cy="42" r="4" fill="black" />
        <circle cx="63" cy="42" r="4" fill="black" />
        <path d="M 30 65 Q 50 80 70 65" stroke="black" strokeWidth="4" fill="transparent" />
      </svg>
    </div>
  );
};

export default Critter;
