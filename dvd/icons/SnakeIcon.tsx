import React from 'react';

export const SnakeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="10" y="30" width="20" height="20" rx="5"/>
    <rect x="30" y="30" width="20" height="20" rx="5" opacity="0.8"/>
    <rect x="50" y="30" width="20" height="20" rx="5"/>
    <rect x="70" y="30" width="20" height="20" rx="5" opacity="0.8"/>
    <rect x="70" y="50" width="20" height="20" rx="5"/>
    <rect x="50" y="50" width="20" height="20" rx="5" opacity="0.8"/>
    <rect x="50" y="70" width="20" height="20" rx="5"/>
  </svg>
);