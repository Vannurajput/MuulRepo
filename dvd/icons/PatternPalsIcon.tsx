import React from 'react';

export const PatternPalsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="20" cy="50" r="15" fill="currentColor" opacity="0.9"/>
    <rect x="45" y="35" width="30" height="30" rx="5" fill="currentColor" opacity="0.6"/>
    <circle cx="80" cy="50" r="15" fill="currentColor" opacity="0.9"/>
    <rect x="105" y="35" width="30" height="30" rx="5" fill="currentColor" opacity="0.2"/>
  </svg>
);