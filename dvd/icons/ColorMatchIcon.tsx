import React from 'react';

export const ColorMatchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="30" cy="30" r="20" fill="#EF4444"/>
    <circle cx="70" cy="30" r="20" fill="#3B82F6"/>
    <circle cx="30" cy="70" r="20" fill="#22C55E"/>
    <circle cx="70"cy="70" r="20" fill="#F97316"/>
    <text x="50" y="58" textAnchor="middle" fill="white" opacity="0.7" fontSize="24" fontWeight="bold" className="font-sans">Red</text>
  </svg>
);