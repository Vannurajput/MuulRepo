import React from 'react';

export const MathSafariIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g opacity="0.8">
      <path d="M20 30 L80 30" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
      <path d="M50 10 L50 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
    </g>
    <g opacity="0.6">
      <path d="M20 70 L80 70" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
    </g>
    <path d="M20 50 L40 50" stroke="currentColor" strokeWidth="0" />
    <path d="M25 45 L75 85 M75 45 L25 85" stroke="currentColor" strokeWidth="8" opacity="0.4" strokeLinecap="round"/>
  </svg>
);