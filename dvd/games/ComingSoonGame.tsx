import React from 'react';

interface ComingSoonGameProps {
    title: string;
}

const ComingSoonGame: React.FC<ComingSoonGameProps> = ({ title }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gray-800 text-white">
      <h1 className="text-5xl font-bold font-pixel mb-4">{title}</h1>
      <p className="text-3xl text-fuchsia-400 animate-pulse">Coming Soon!</p>
      <p className="mt-8 text-lg text-violet-300">This game is under construction. Check back later for more fun!</p>
    </div>
  );
};

export default ComingSoonGame;