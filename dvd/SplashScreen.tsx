import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent animate-fade-in">
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { translateY(0px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>
      <div className="animate-float">
        <svg viewBox="0 0 100 100" className="w-40 h-40 drop-shadow-lg">
          <circle cx="50" cy="50" r="45" fill="#22d3ee" />
          <circle cx="35" cy="40" r="8" fill="white" />
          <circle cx="65" cy="40" r="8" fill="white" />
          <circle cx="37" cy="42" r="4" fill="black" />
          <circle cx="63" cy="42" r="4" fill="black" />
          <path d="M 30 65 Q 50 80 70 65" stroke="black" strokeWidth="4" fill="transparent" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-cyan-400 mt-6 drop-shadow-md" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
        Kids Games PWA
      </h1>
      <p className="text-slate-300 mt-2">Loading fun...</p>
    </div>
  );
};

export default SplashScreen;