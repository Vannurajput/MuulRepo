import React from 'react';
import { HeartIcon } from './icons/HeartIcon';

interface HUDProps {
  score: number;
  lives: number;
}

const HUD: React.FC<HUDProps> = ({ score, lives }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 pl-20 flex justify-between items-center text-white z-10">
      <div className="bg-black bg-opacity-40 rounded-xl px-4 py-2">
        <span className="font-bold text-2xl md:text-3xl drop-shadow-md">Score: </span>
        <span className="font-bold text-3xl md:text-4xl text-cyan-300 drop-shadow-lg">{score}</span>
      </div>
      <div className="flex items-center bg-black bg-opacity-40 rounded-xl px-4 py-2">
        {Array.from({ length: lives }).map((_, index) => (
          <HeartIcon key={index} className="w-8 h-8 md:w-10 md:h-10 text-red-500 drop-shadow-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
};

export default HUD;