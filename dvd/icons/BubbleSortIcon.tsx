
import React from 'react';

export const BubbleSortIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="20" r="10" fill="#EF4444" />
    <circle cx="38" cy="35" r="10" fill="#3B82F6" />
    <circle cx="62" cy="35" r="10" fill="#22C55E" />
    <circle cx="26" cy="50" r="10" fill="#F97316" />
    <circle cx="50" cy="50" r="10" fill="#A855F7" />
    <circle cx="74" cy="50" r="10" fill="#EAB308" />
    
    {/* Shooter */}
    <path d="M40 95 L50 75 L60 95 Z" fill="currentColor" opacity="0.7" />
    <circle cx="50" cy="85" r="10" fill="#3B82F6" />
  </svg>
);
