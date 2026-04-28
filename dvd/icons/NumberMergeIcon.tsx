import React from 'react';

export const NumberMergeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="45" cy="40" r="30" fill="currentColor" opacity="0.6"/>
        <circle cx="65" cy="60" r="35" fill="currentColor" opacity="0.9"/>
        <text x="65" y="70" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">16</text>
        <text x="45" y="50" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">8</text>
    </svg>
);