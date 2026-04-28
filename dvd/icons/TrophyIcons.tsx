import React from 'react';

export const TrophyLockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const TrophyBase: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M85 30 C 95 40, 95 60, 85 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <path d="M15 30 C 5 40, 5 60, 15 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <path d="M25 70 C 25 90, 75 90, 75 70 V 30 C 75 10, 25 10, 25 30 Z" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
      <path d="M40 90 H 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <path d="M50 90 V 95 H 40 V 100 H 60 V 95 H 50" stroke="currentColor" strokeWidth="6" strokeLinejoin="round"/>
      {children}
    </svg>
);

export const TrophyBronzeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <TrophyBase>
    <g fill="#CD7F32" {...props}>
      <circle cx="50" cy="50" r="15"/>
    </g>
  </TrophyBase>
);

export const TrophySilverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <TrophyBase>
    <g fill="#C0C0C0" {...props}>
      <polygon points="50,35 65,65 35,65" />
    </g>
  </TrophyBase>
);

export const TrophyGoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <TrophyBase>
    <g fill="#FFD700" {...props}>
      <path d="M50,35 L60,45 L75,45 L65,55 L70,65 L50,60 L30,65 L35,55 L25,45 L40,45 Z" />
    </g>
  </TrophyBase>
);

export const FirstPlayTrophyIcon: React.FC<{ gameIcon: React.ReactNode }> = ({ gameIcon }) => (
  <div className="relative w-full h-full">
    <TrophyBronzeIcon />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 text-white p-1">
      {gameIcon}
    </div>
  </div>
);