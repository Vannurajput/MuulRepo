import React from 'react';

export const MemoryMatchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="15" y="20" width="45" height="60" rx="5" fill="currentColor" opacity="0.5"/>
    <rect x="20" y="25" width="35" height="50" rx="3" fill="white" opacity="0.5"/>
    <path d="M37.5 45 L30 55 L45 55 Z" fill="currentColor" opacity="0.8"/>
    <g transform="rotate(15, 65, 50)">
      <rect x="45" y="20" width="45" height="60" rx="5" fill="currentColor" opacity="0.9"/>
      <rect x="50" y="25" width="35" height="50" rx="3" fill="white"/>
      <path d="M67.5 40.58 L72.63 55.42 L58.37 46.5 L76.63 46.5 L62.37 55.42 Z" fill="#22d3ee"/>
    </g>
  </svg>
);