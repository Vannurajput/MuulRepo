
import React from 'react';

export const SudokuKidsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Grid Background */}
    <rect x="5" y="5" width="90" height="90" rx="10" fill="currentColor" opacity="0.1"/>
    
    {/* Thick Region Lines */}
    <path d="M5 50 H 95 M50 5 V 95" stroke="currentColor" strokeWidth="4" opacity="0.4"/>

    {/* Thin Cell Lines */}
    <path d="M27.5 5 V 95 M72.5 5 V 95 M5 27.5 H 95 M5 72.5 H 95" stroke="currentColor" strokeWidth="2" opacity="0.2"/>

    {/* Shapes/Colors */}
    <circle cx="16.25" cy="16.25" r="8" fill="#ef4444" />
    <rect x="58.75" y="8.75" width="15" height="15" rx="3" fill="#3b82f6" />
    <path d="M16.25 58.75 L 8.75 73.75 H 23.75 Z" fill="#22c55e" />
    <circle cx="83.75" cy="83.75" r="8" fill="#f97316" />
    
    <text x="66.25" y="68.75" textAnchor="middle" fontSize="18" fill="#a855f7" fontWeight="bold">?</text>

  </svg>
);
