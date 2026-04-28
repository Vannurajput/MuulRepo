import React from 'react';

export const AlphabetTraceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <text
        x="50"
        y="80"
        textAnchor="middle"
        fontSize="90"
        fontWeight="bold"
        fill="currentColor"
        opacity="0.2"
        className="font-sans"
    >
        A
    </text>
    <path d="M25 80 L50 20 L75 80 M37 60 H63" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
    <circle cx="25" cy="80" r="5" fill="#22d3ee"/>
    <circle cx="28" cy="75" r="2" fill="white" opacity="0.8"/>
  </svg>
);