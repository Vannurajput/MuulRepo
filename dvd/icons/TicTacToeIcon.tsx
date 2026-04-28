import React from 'react';

export const TicTacToeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M30 5H70V30H30z" fill="currentColor" opacity="0.2" />
    <path d="M5 30H95V70H5z" fill="currentColor" opacity="0.2" />
    <path d="M30 70H70V95H30z" fill="currentColor" opacity="0.2" />
    <path d="M33.333,0 v100" stroke="currentColor" strokeWidth="5" opacity="0.4"/>
    <path d="M66.666,0 v100" stroke="currentColor" strokeWidth="5" opacity="0.4"/>
    <path d="M0,33.333 h100" stroke="currentColor" strokeWidth="5" opacity="0.4"/>
    <path d="M0,66.666 h100" stroke="currentColor" strokeWidth="5" opacity="0.4"/>
    <path d="M10 10 L 25 25 M 25 10 L 10 25" stroke="#a3e635" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="10" stroke="#38bdf8" strokeWidth="5" fill="none"/>
  </svg>
);