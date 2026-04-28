import React from 'react';

export const CritterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="45" fill="currentColor" />
    <circle cx="35" cy="40" r="8" fill="white" />
    <circle cx="65" cy="40" r="8" fill="white" />
    <circle cx="37" cy="42" r="4" fill="black" />
    <circle cx="63" cy="42" r="4" fill="black" />
    <path d="M 30 65 Q 50 80 70 65" stroke="black" strokeWidth="4" fill="transparent" />
  </svg>
);
