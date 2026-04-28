import React from 'react';

export const WordFinderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="wordFinderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    
    <circle cx="45" cy="45" r="30" strokeWidth="10" stroke="url(#wordFinderGrad)" fill="rgba(255,255,255,0.1)" />
    <line x1="68" y1="68" x2="85" y2="85" strokeWidth="12" stroke="url(#wordFinderGrad)" strokeLinecap="round" />

    <text x="30" y="40" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" opacity="0.8">W</text>
    <text x="45" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" opacity="0.8">O</text>
    <text x="60" y="40" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" opacity="0.8">R</text>
    <text x="45" y="30" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white" opacity="0.5">D</text>
  </svg>
);