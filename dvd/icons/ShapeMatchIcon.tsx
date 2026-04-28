import React from 'react';

export const ShapeMatchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="30" cy="30" r="20" fill="currentColor" opacity="0.9"/>
    <rect x="60" y="15" width="30" height="30" rx="5" fill="currentColor" opacity="0.7"/>
    <path d="M15 85 L45 55 L75 85 Z" fill="currentColor" opacity="0.5"/>
    <path d="M82.5 77.5 L67.5 77.5 L60 65 L67.5 52.5 L82.5 52.5 L90 65 Z" fill="currentColor" opacity="0.8" />
  </svg>
);