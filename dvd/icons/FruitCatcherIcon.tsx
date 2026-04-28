
import React from 'react';

export const FruitCatcherIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M10 60 C 10 80, 90 80, 90 60 L 75 95 H 25 Z" fill="#c27b3d" />
    <path d="M10 60 C 10 80, 90 80, 90 60" stroke="#8d5a2c" strokeWidth="4" fill="none" />
    <g transform="translate(20, 20) rotate(-15)">
      <path d="M50 30 C 70 30, 70 60, 50 60 C 30 60, 30 30, 50 30" fill="#fde047" />
      <path d="M50 30 Q 60 20, 55 10" stroke="#166534" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
    <g transform="translate(40, 30) rotate(10)">
       <path d="M50 40 C 60 40, 65 55, 50 60 C 35 55, 40 40, 50 40" fill="#dc2626"/>
       <path d="M50 40 Q 55 30, 50 25" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);
