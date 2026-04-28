
import React from 'react';

export const ShellGameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g transform="translate(-20 15)">
      <path d="M20 80 H80 L70 40 H30 Z" fill="#dc2626" />
      <path d="M20 80 A 30 10 0 0 0 80 80" fill="white" stroke="#d1d5db" strokeWidth="2" />
    </g>
    <g transform="translate(20 15)">
      <path d="M20 80 H80 L70 40 H30 Z" fill="#dc2626" />
      <path d="M20 80 A 30 10 0 0 0 80 80" fill="white" stroke="#d1d5db" strokeWidth="2" />
    </g>
    <g transform="translate(0 -5) rotate(5 50 80)">
      <path d="M20 80 H80 L70 40 H30 Z" fill="#ef4444" />
      <path d="M20 80 A 30 10 0 0 0 80 80" fill="white" stroke="#e5e7eb" strokeWidth="2" />
    </g>
    <circle cx="50" cy="85" r="8" fill="black" />
  </svg>
);
