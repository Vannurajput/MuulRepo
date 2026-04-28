import React from 'react';

export const SoundGuessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M10 50 Q 20 20, 30 50 T 50 50" stroke="currentColor" strokeWidth="6" fill="none" opacity="0.4"/>
        <path d="M15 50 Q 25 30, 35 50 T 55 50" stroke="currentColor" strokeWidth="6" fill="none" opacity="0.7"/>
        <path d="M20 50 Q 30 40, 40 50 T 60 50" stroke="currentColor" strokeWidth="6" fill="none" opacity="1"/>
        <path d="M82 45 a 10 10 0 0 1 0 20 a 12 12 0 0 0 0 -20" />
        <circle cx="70" cy="55" r="5" />
        <circle cx="75" cy="42" r="5" />
        <circle cx="90" cy="45" r="5" />
        <circle cx="92" cy="60" r="5" />
    </svg>
);