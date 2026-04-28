
import React from 'react';

export const NumberPuzzleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="5" y="5" width="90" height="90" rx="10" fill="currentColor" opacity="0.2"/>
    
    <rect x="10" y="10" width="18.75" height="18.75" rx="3" fill="currentColor" opacity="0.8"/>
    <text x="19.375" y="24" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="12" fontWeight="bold">1</text>
    
    <rect x="31.25" y="10" width="18.75" height="18.75" rx="3" fill="currentColor" opacity="0.8"/>
     <text x="40.625" y="24" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="12" fontWeight="bold">2</text>

    <rect x="10" y="31.25" width="18.75" height="18.75" rx="3" fill="currentColor" opacity="0.8"/>
    <text x="19.375" y="45.25" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="12" fontWeight="bold">5</text>
    
    <rect x="31.25" y="31.25" width="18.75" height="18.75" rx="3" fill="currentColor" opacity="0.6"/>
    <text x="40.625" y="45.25" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="12" fontWeight="bold">6</text>

    <rect x="52.5" y="52.5" width="18.75" height="18.75" rx="3" fill="currentColor" opacity="0.8"/>
    <text x="61.875" y="66.5" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="12" fontWeight="bold">11</text>
    
    <rect x="73.75" y="73.75" width="18.75" height="18.75" rx="3" fill="currentColor" opacity="0.1"/>
  </svg>
);
